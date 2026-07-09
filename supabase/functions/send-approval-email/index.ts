import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MailRecipient {
  email: string;
  name?: string;
}

interface ApprovalPayload {
  title: string;
  category?: string;
  description?: string;
  projectName?: string;
  requesterName?: string;
  costType?: "fixed" | "variable";
  costAmount?: number; // already converted into costCurrency's units
  costCurrency?: string; // e.g. "USD" | "EUR" | "GBP" | "INR" | "AED" — the requester's currency
}

interface DecisionPayload {
  status: "approved" | "rejected" | "on_hold";
  decidedByName?: string;
  reason?: string;
}

interface RequestBody {
  type: "new_request" | "decision";
  recipients: MailRecipient[];
  approval: ApprovalPayload;
  decision?: DecisionPayload;
}

const STATUS_LABEL: Record<string, string> = {
  approved: "Approved",
  rejected: "Rejected",
  on_hold: "On Hold",
};

const STATUS_COLOR: Record<string, string> = {
  approved: "#3f6b3f",
  rejected: "#a5382f",
  on_hold: "#9c6f1e",
};

// Locale affects grouping (e.g. INR's lakh/crore commas), not just the symbol.
const CURRENCY_LOCALE: Record<string, string> = {
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  INR: "en-IN",
  AED: "en-AE",
};

function fmtMoney(amount?: number, currency = "USD"): string | undefined {
  if (amount === undefined || amount === null) return undefined;
  const locale = CURRENCY_LOCALE[currency] || "en-US";
  return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

// Renders the shared BYLD Space email shell: sage-green page background, centered
// white card, logo, eyebrow label, heading, body, divider, signature, footer.
function renderEmail(opts: {
  logoUrl: string;
  eyebrow: string;
  heading: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote: string;
}): string {
  const { logoUrl, eyebrow, heading, bodyHtml, ctaLabel, ctaUrl, footerNote } = opts;
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:#e9ede2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#e9ede2;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#f7f9f4;border-radius:20px;padding:48px 40px;">
            <tr>
              <td align="center" style="padding-bottom:28px;">
                <img src="${logoUrl}" alt="BYLD Space" height="28" style="height:28px;width:auto;display:block;" />
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-bottom:14px;">
                <span style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#7c8873;font-weight:600;">${eyebrow}</span>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-bottom:18px;">
                <h1 style="margin:0;font-size:24px;line-height:1.35;color:#1e2419;font-weight:700;">${heading}</h1>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-bottom:8px;color:#4a5540;font-size:15px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
            ${ctaLabel && ctaUrl ? `
            <tr>
              <td align="center" style="padding-top:20px;padding-bottom:8px;">
                <a href="${ctaUrl}" style="display:inline-block;background-color:#1e2419;color:#f7f9f4;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:10px;">${ctaLabel}</a>
              </td>
            </tr>` : ""}
            <tr>
              <td style="padding:28px 0 18px;">
                <hr style="border:none;border-top:1px solid #dde3d3;margin:0;" />
              </td>
            </tr>
            <tr>
              <td align="center" style="color:#1e2419;font-size:14px;">
                — The BYLD Space team
              </td>
            </tr>
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
            <tr>
              <td align="center" style="padding-top:18px;color:#8b937f;font-size:11px;line-height:1.6;">
                ${footerNote}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buildNewRequestEmail(logoUrl: string, appUrl: string, a: ApprovalPayload): { subject: string; html: string } {
  const cost = fmtMoney(a.costAmount, a.costCurrency);
  const costLine = cost
    ? `<br/><strong>${a.costType === "variable" ? "Estimated cost" : "Cost"}:</strong> ${cost}`
    : "";
  const bodyHtml = `
    <strong>${escapeHtml(a.requesterName || "A team member")}</strong> submitted a new approval request${a.projectName ? ` on <strong>${escapeHtml(a.projectName)}</strong>` : ""} that needs your review.
    <br/><br/>
    <strong>${escapeHtml(a.title)}</strong>${a.category ? ` &middot; ${escapeHtml(a.category)}` : ""}
    ${a.description ? `<br/>${escapeHtml(a.description)}` : ""}
    ${costLine}
  `;
  return {
    subject: `New approval request: ${a.title}`,
    html: renderEmail({
      logoUrl,
      eyebrow: "Approval Request",
      heading: "A new request needs your review.",
      bodyHtml,
      ctaLabel: "Review in BYLD Space",
      ctaUrl: `${appUrl}/approvals`,
      footerNote: `You're receiving this because you can decide approvals${a.projectName ? ` on ${escapeHtml(a.projectName)}` : ""} in BYLD Space. &copy; ${new Date().getUTCFullYear()} BYLD Space.`,
    }),
  };
}

function buildDecisionEmail(logoUrl: string, appUrl: string, a: ApprovalPayload, d: DecisionPayload): { subject: string; html: string } {
  const statusLabel = STATUS_LABEL[d.status] || d.status;
  const statusColor = STATUS_COLOR[d.status] || "#1e2419";
  const reasonLine = d.reason ? `<br/><br/><strong>Note:</strong> ${escapeHtml(d.reason)}` : "";
  const bodyHtml = `
    Your approval request has been
    <strong style="color:${statusColor};">${statusLabel.toLowerCase()}</strong>${a.projectName ? ` on <strong>${escapeHtml(a.projectName)}</strong>` : ""}${d.decidedByName ? ` by ${escapeHtml(d.decidedByName)}` : ""}.
    <br/><br/>
    <strong>${escapeHtml(a.title)}</strong>${a.category ? ` &middot; ${escapeHtml(a.category)}` : ""}
    ${reasonLine}
  `;
  return {
    subject: `Your request was ${statusLabel.toLowerCase()}: ${a.title}`,
    html: renderEmail({
      logoUrl,
      eyebrow: "Approval Update",
      heading: `Your request was ${statusLabel.toLowerCase()}.`,
      bodyHtml,
      ctaLabel: "View in BYLD Space",
      ctaUrl: `${appUrl}/approvals`,
      footerNote: `You're receiving this because you submitted this approval request in BYLD Space. &copy; ${new Date().getUTCFullYear()} BYLD Space.`,
    }),
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json().catch(() => ({}))) as Partial<RequestBody>;
    const { type, recipients, approval, decision } = body;

    if (!type || !approval || !Array.isArray(recipients) || recipients.length === 0) {
      return new Response(JSON.stringify({ error: "type, approval, and a non-empty recipients array are required" }), {
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

    const { subject, html } = type === "decision" && decision
      ? buildDecisionEmail(LOGO_URL, APP_URL, approval, decision)
      : buildNewRequestEmail(LOGO_URL, APP_URL, approval);

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
      console.error("send-approval-email: Apps Script webhook error", gasRes.status, gasText);
      return new Response(JSON.stringify({ error: "Email webhook error", detail: gasText }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(gasText, {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-approval-email error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
