// Shared BYLD Space transactional email shell, used by send-approval-email and
// send-team-invite-email so every email renders with the identical sage-green page
// background, centered card, logo, eyebrow label, heading, body, divider, signature,
// and footer treatment.

// Renders the shared BYLD Space email shell: sage-green page background, centered
// white card, logo, eyebrow label, heading, body, divider, signature, footer.
export function renderEmail(opts: {
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

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
