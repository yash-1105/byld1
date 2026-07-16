import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { renderEmail, escapeHtml } from "../_shared/emailTemplate.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MailRecipient {
  email: string;
  name?: string;
}

interface RevisionPayload {
  projectName: string;
  previousDeadline: string; // e.g. "2026-01-01"
  newDeadline: string;
  revisedByName: string;
  reason?: string;
}

interface RequestBody {
  recipients: MailRecipient[];
  revision: RevisionPayload;
}

function buildRevisionEmail(logoUrl: string, appUrl: string, r: RevisionPayload): { subject: string; html: string } {
  const fmt = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const bodyHtml = `
    <strong>${escapeHtml(r.revisedByName)}</strong> has updated the
    deadline for <strong>${escapeHtml(r.projectName)}</strong>.
    <br/><br/>
    Previous: <strong>${fmt(r.previousDeadline)}</strong><br/>
    New: <strong>${fmt(r.newDeadline)}</strong>
    ${r.reason ? `<br/><br/>Reason: ${escapeHtml(r.reason)}` : ""}
  `;
  return {
    subject: `Deadline updated for ${r.projectName}`,
    html: renderEmail({
      logoUrl,
      eyebrow: "Deadline Revised",
      heading: "Your project deadline has changed.",
      bodyHtml,
      ctaLabel: "View Project",
      ctaUrl: `${appUrl}/projects`,
      footerNote: `You're receiving this because you're the client on ${escapeHtml(r.projectName)} in BYLD Space. &copy; ${new Date().getUTCFullYear()} BYLD Space.`,
    }),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json().catch(() => ({}))) as Partial<RequestBody>;
    const { recipients, revision } = body;

    if (!revision || !Array.isArray(recipients) || recipients.length === 0) {
      return new Response(JSON.stringify({ error: "revision and a non-empty recipients array are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const WEBHOOK_URL = Deno.env.get("APPROVAL_EMAIL_WEBHOOK_URL");
    const SHARED_SECRET = Deno.env.get("APPROVAL_EMAIL_SECRET");
    const APP_URL = (Deno.env.get("APP_URL") || "https://byld1.vercel.app").replace(/\/+$/, "");
    const LOGO_URL = `${APP_URL}/images/byld-lockup.png`;

    if (!WEBHOOK_URL || !SHARED_SECRET) {
      return new Response(JSON.stringify({ error: "APPROVAL_EMAIL_WEBHOOK_URL / APPROVAL_EMAIL_SECRET not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { subject, html } = buildRevisionEmail(LOGO_URL, APP_URL, revision);

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

    const gasText = await gasRes.text();
    if (!gasRes.ok) {
      console.error("send-deadline-revision-email: Apps Script webhook error", gasRes.status, gasText);
      return new Response(JSON.stringify({ error: "Email webhook error", detail: gasText }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(gasText, {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-deadline-revision-email error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
