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

interface UpdatePayload {
  posterName: string;
  projectName: string;
  title: string;
  description?: string;
  updateType: "progress" | "milestone" | "issue";
}

interface CommentPayload {
  commenterName: string;
  posterName: string;
  projectName: string;
  title: string;
  commentText: string;
}

interface RequestBody {
  type: "new_update" | "comment";
  recipients: MailRecipient[];
  update?: UpdatePayload;
  comment?: CommentPayload;
}

function buildNewUpdateEmail(logoUrl: string, appUrl: string, u: UpdatePayload): { subject: string; html: string } {
  const bodyHtml = `
    <strong>${escapeHtml(u.posterName)}</strong> posted a new
    ${escapeHtml(u.updateType)} update on
    <strong>${escapeHtml(u.projectName)}</strong>.
    <br/><br/>
    <strong>${escapeHtml(u.title)}</strong>
    ${u.description ? `<br/>${escapeHtml(u.description)}` : ""}
  `;
  return {
    subject: `New site update: ${u.title}`,
    html: renderEmail({
      logoUrl,
      eyebrow: "Site Update",
      heading: "New activity on your project.",
      bodyHtml,
      ctaLabel: "View in BYLD Space",
      ctaUrl: `${appUrl}/site-updates`,
      footerNote: `You're receiving this because you have access to updates on ${escapeHtml(u.projectName)} in BYLD Space. &copy; ${new Date().getUTCFullYear()} BYLD Space.`,
    }),
  };
}

function buildCommentEmail(logoUrl: string, appUrl: string, c: CommentPayload): { subject: string; html: string } {
  const bodyHtml = `
    <strong>${escapeHtml(c.commenterName)}</strong> commented on your
    update on <strong>${escapeHtml(c.projectName)}</strong>.
    <br/><br/>
    <strong>${escapeHtml(c.title)}</strong>
    <br/>"${escapeHtml(c.commentText)}"
  `;
  return {
    subject: `New comment on your update: ${c.title}`,
    html: renderEmail({
      logoUrl,
      eyebrow: "New Comment",
      heading: "Someone commented on your update.",
      bodyHtml,
      ctaLabel: "View in BYLD Space",
      ctaUrl: `${appUrl}/site-updates`,
      footerNote: `You're receiving this because you posted this update in BYLD Space. &copy; ${new Date().getUTCFullYear()} BYLD Space.`,
    }),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json().catch(() => ({}))) as Partial<RequestBody>;
    const { type, recipients, update, comment } = body;

    if (
      !type ||
      !Array.isArray(recipients) || recipients.length === 0 ||
      (type === "new_update" && !update) ||
      (type === "comment" && !comment)
    ) {
      return new Response(JSON.stringify({ error: "type, a matching payload, and a non-empty recipients array are required" }), {
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

    const { subject, html } = type === "comment" && comment
      ? buildCommentEmail(LOGO_URL, APP_URL, comment)
      : buildNewUpdateEmail(LOGO_URL, APP_URL, update!);

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
      console.error("send-site-update-email: Apps Script webhook error", gasRes.status, gasText);
      return new Response(JSON.stringify({ error: "Email webhook error", detail: gasText }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(gasText, {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-site-update-email error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
