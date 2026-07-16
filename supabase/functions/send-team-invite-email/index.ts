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

interface InvitePayload {
  inviteeName?: string;
  inviteeEmail: string;
  inviterName: string;
  projectName: string;
  role: string;
  invitationId: string;
}

interface RequestBody {
  recipient: MailRecipient;
  invite: InvitePayload;
}

function buildInviteEmail(logoUrl: string, appUrl: string, p: InvitePayload) {
  const bodyHtml = `
    <strong>${escapeHtml(p.inviterName)}</strong> invited you to join
    <strong>${escapeHtml(p.projectName)}</strong> on BYLD Space as a
    <strong>${escapeHtml(p.role)}</strong>.
  `;
  return {
    subject: `You've been invited to ${p.projectName} on BYLD Space`,
    html: renderEmail({
      logoUrl,
      eyebrow: "Team Invitation",
      heading: "You've been invited to join a project.",
      bodyHtml,
      ctaLabel: "Accept Invitation",
      ctaUrl: `${appUrl}/team?invite=${p.invitationId}`,
      footerNote: `You're receiving this because ${escapeHtml(p.inviterName)} invited you to join ${escapeHtml(p.projectName)} on BYLD Space. &copy; ${new Date().getUTCFullYear()} BYLD Space.`,
    }),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json().catch(() => ({}))) as Partial<RequestBody>;
    const { recipient, invite } = body;

    if (!recipient?.email || !invite?.invitationId || !invite?.projectName) {
      return new Response(JSON.stringify({ error: "recipient.email, invite.invitationId, and invite.projectName are required" }), {
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

    const { subject, html } = buildInviteEmail(LOGO_URL, APP_URL, invite);

    const gasRes = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: SHARED_SECRET,
        to: [recipient.email].filter(Boolean),
        subject,
        html,
      }),
    });

    const gasText = await gasRes.text();
    if (!gasRes.ok) {
      console.error("send-team-invite-email: Apps Script webhook error", gasRes.status, gasText);
      return new Response(JSON.stringify({ error: "Email webhook error", detail: gasText }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(gasText, {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-team-invite-email error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
