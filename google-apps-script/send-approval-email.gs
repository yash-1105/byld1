/**
 * BYLD Space — Approval email relay.
 *
 * Deployed as a Google Apps Script Web App under the info@byldspace.com
 * Workspace account. Receives { secret, to, subject, html } from the Supabase
 * edge function `send-approval-email` (see supabase/functions/send-approval-email)
 * and sends the email via GmailApp, so it's delivered as info@byldspace.com.
 *
 * Setup: see google-apps-script/README.md for the full step-by-step.
 */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    var expectedSecret = PropertiesService.getScriptProperties().getProperty('SHARED_SECRET');
    if (!expectedSecret || data.secret !== expectedSecret) {
      return respond({ success: false, error: 'Unauthorized' });
    }

    var recipients = data.to || [];
    var subject = data.subject || 'BYLD Space Notification';
    var html = data.html || '';

    if (!recipients.length || !html) {
      return respond({ success: false, error: 'Missing to/html' });
    }

    recipients.forEach(function (address) {
      GmailApp.sendEmail(address, subject, 'Please view this email in an HTML-capable client.', {
        htmlBody: html,
        name: 'BYLD Space',
      });
    });

    return respond({ success: true, sent: recipients.length });
  } catch (err) {
    return respond({ success: false, error: err.message });
  }
}

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
