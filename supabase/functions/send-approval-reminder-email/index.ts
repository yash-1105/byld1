import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { renderEmail, escapeHtml } from "../_shared/emailTemplate.ts";

// Unlike send-approval-email / send-deadline-revision-email (invoked by the client with a
// ready-made payload), this function is triggered on a SCHEDULE (pg_cron, see the companion
// migration) with an empty body. It queries the database itself using the service-role key
// to find overdue, still-pending approvals and emails their decision-makers a one-time reminder.
//
// It is configured verify_jwt = false in config.toml so the cron http_post can reach it
// without embedding a secret in SQL. Repeated invocation is safe: reminder_sent_at gates
// each approval to exactly one reminder.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DBUser {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
}

const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

function buildReminderEmail(
  logoUrl: string,
  appUrl: string,
  a: { title: string; projectName?: string; createdDate: string; dueDate: string },
): { subject: string; html: string } {
  const bodyHtml = `
    <strong>${escapeHtml(a.title)}</strong>${a.projectName ? ` on <strong>${escapeHtml(a.projectName)}</strong>` : ""}
    has been pending since <strong>${fmtDate(a.createdDate)}</strong> and was due
    <strong>${fmtDate(a.dueDate)}</strong>.
    <br/><br/>
    It's still awaiting a decision — please review it when you get a moment.
  `;
  return {
    subject: `Reminder: "${a.title}" is overdue for approval`,
    html: renderEmail({
      logoUrl,
      eyebrow: "Pending Approval",
      heading: "This approval needs your attention.",
      bodyHtml,
      ctaLabel: "Review in BYLD Space",
      ctaUrl: `${appUrl}/approvals`,
      footerNote: `You're receiving this because you can decide approvals${a.projectName ? ` on ${escapeHtml(a.projectName)}` : ""} in BYLD Space. &copy; ${new Date().getUTCFullYear()} BYLD Space.`,
    }),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const WEBHOOK_URL = Deno.env.get("APPROVAL_EMAIL_WEBHOOK_URL");
    const SHARED_SECRET = Deno.env.get("APPROVAL_EMAIL_SECRET");
    const APP_URL = (Deno.env.get("APP_URL") || "https://byld1.vercel.app").replace(/\/+$/, "");
    const LOGO_URL = `${APP_URL}/images/byld-lockup.png`;

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!WEBHOOK_URL || !SHARED_SECRET) {
      return new Response(JSON.stringify({ error: "APPROVAL_EMAIL_WEBHOOK_URL / APPROVAL_EMAIL_SECRET not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // 1. Overdue, still-pending approvals that haven't been reminded yet.
    const today = new Date().toISOString().split("T")[0];
    const { data: due, error: dueErr } = await supabase
      .from("approvals")
      .select("id, title, project_id, requested_by, created_at, due_date")
      .eq("status", "pending")
      .not("due_date", "is", null)
      .lte("due_date", today)
      .is("reminder_sent_at", null);
    if (dueErr) throw dueErr;

    if (!due || due.length === 0) {
      return new Response(JSON.stringify({ remindersSent: 0, message: "No overdue approvals to remind." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Preload the users and project_members needed for recipient resolution.
    const projectIds = [...new Set(due.map((a) => a.project_id).filter(Boolean))] as string[];
    const { data: allUsers } = await supabase.from("users").select("id, email, full_name, role");
    const users: DBUser[] = (allUsers as DBUser[]) || [];
    const { data: members } = projectIds.length
      ? await supabase.from("project_members").select("project_id, user_id").in("project_id", projectIds)
      : { data: [] as { project_id: string; user_id: string }[] };
    const projectMembers = (members as { project_id: string; user_id: string }[]) || [];
    const { data: projectRows } = projectIds.length
      ? await supabase.from("projects").select("id, name").in("id", projectIds)
      : { data: [] as { id: string; name: string }[] };
    const projects = (projectRows as { id: string; name: string }[]) || [];

    // Same recipient logic canDecideApproval()/resolveMailRecipients() encode on the frontend:
    // architect's request → the project's client(s); client's request → the project's architect(s);
    // anyone else → both. Prefer project members with that role, falling back to any user with it.
    const resolveRecipients = (projectId: string | null, roles: string[]): DBUser[] => {
      const memberIds = new Set(projectMembers.filter((m) => m.project_id === projectId).map((m) => m.user_id));
      let matches = users.filter((u) => memberIds.has(u.id) && u.role != null && roles.includes(u.role));
      if (matches.length === 0) {
        matches = users.filter((u) => u.role != null && roles.includes(u.role));
      }
      return matches.filter((u) => !!u.email);
    };

    let remindersSent = 0;
    for (const a of due) {
      const requester = users.find((u) => u.id === a.requested_by);
      const recipientRoles = requester?.role === "architect" ? ["client"]
        : requester?.role === "client" ? ["architect"]
        : ["architect", "client"];
      const recipients = resolveRecipients(a.project_id, recipientRoles);
      if (recipients.length === 0) continue; // no one to notify yet; leave it to retry next run

      const projectName = projects.find((p) => p.id === a.project_id)?.name;
      const { subject, html } = buildReminderEmail(LOGO_URL, APP_URL, {
        title: a.title,
        projectName,
        createdDate: a.created_at,
        dueDate: a.due_date,
      });

      const gasRes = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: SHARED_SECRET,
          to: recipients.map((r) => r.email).filter(Boolean),
          subject,
          html,
        }),
      });

      if (!gasRes.ok) {
        const detail = await gasRes.text();
        console.error("send-approval-reminder-email: webhook error for approval", a.id, gasRes.status, detail);
        continue; // don't mark as reminded — retry next run
      }

      // 4. Mark as reminded so it's never re-sent.
      const { error: markErr } = await supabase
        .from("approvals")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", a.id);
      if (markErr) {
        console.error("send-approval-reminder-email: failed to set reminder_sent_at for", a.id, markErr);
        continue;
      }
      remindersSent++;
    }

    // 5. Summary, useful for reading cron/function logs.
    return new Response(JSON.stringify({ remindersSent, candidates: due.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-approval-reminder-email error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
