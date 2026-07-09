# Approval email notifications — Google Apps Script setup

BYLD Space sends approval-request and approval-decision emails through a small
Google Apps Script "relay" running under your `info@byldspace.com` Workspace
account. The app never talks to Gmail directly — it calls a Supabase edge
function (`supabase/functions/send-approval-email`), which builds the BYLD-branded
HTML email and POSTs `{ secret, to, subject, html }` to the Apps Script Web App,
which sends the mail via `GmailApp` so it arrives *from* `info@byldspace.com`.

## What triggers an email

- **New approval request** — when an architect submits a request, the project's
  client(s) are emailed; when a client submits one, the project's architect(s)
  are emailed; when a contractor/consultant submits one, both are emailed.
- **Decision made** — when a request is approved, rejected, or put on hold, the
  original requester is emailed the outcome.

## 1. Create the Apps Script project

1. Sign in to **script.google.com** as `info@byldspace.com` (this determines the
   "from" address — Apps Script sends as whichever account owns the script).
2. Click **New project**.
3. Name it something like `BYLD Space — Approval Emails`.
4. Delete the default `myFunction() {}` stub and paste in the contents of
   [`send-approval-email.gs`](./send-approval-email.gs) from this repo.

## 2. Set the shared secret

This stops random internet traffic from using your script to send mail.

1. In the Apps Script editor, click the **gear icon (Project Settings)** in the
   left sidebar.
2. Scroll to **Script Properties** → **Add script property**.
3. Property: `SHARED_SECRET`. Value: any long random string (e.g. generate one
   with `openssl rand -hex 32` in a terminal, or a password generator).
4. Save. Keep this value — you'll paste the same string into Supabase in step 4.

## 3. Deploy as a Web App

1. Click **Deploy → New deployment**.
2. Click the gear icon next to "Select type" → choose **Web app**.
3. Description: `send-approval-email v1`.
4. **Execute as:** `Me (info@byldspace.com)`.
5. **Who has access:** `Anyone`.
   (This is safe — the shared-secret check in the code rejects any request
   that doesn't include the correct `SHARED_SECRET`, so an unguessable secret
   is what actually protects the endpoint, not the access setting.)
6. Click **Deploy**.
7. The first time, Google will show an "authorization required" prompt →
   **Authorize access** → pick the `info@byldspace.com` account → you'll likely
   see an "unverified app" warning since this is your own private script → click
   **Advanced** → **Go to BYLD Space — Approval Emails (unsafe)** → **Allow**.
   This warning is expected for personal/internal Apps Script projects you
   haven't submitted for Google's verification review; it's safe to proceed
   since you wrote and own the code.
8. Copy the **Web app URL** shown after deployment — it looks like
   `https://script.google.com/macros/s/AKfycb.../exec`. This is your
   `APPROVAL_EMAIL_WEBHOOK_URL`.

## 4. Configure Supabase secrets

In the Supabase dashboard for this project (or via `supabase secrets set`):

```bash
supabase secrets set APPROVAL_EMAIL_WEBHOOK_URL="https://script.google.com/macros/s/AKfycb.../exec"
supabase secrets set APPROVAL_EMAIL_SECRET="<the same SHARED_SECRET value from step 2>"
```

`APP_URL` should already be set from the Google Drive/Calendar integrations —
it's reused here to build the logo image URL and the "Review in BYLD Space"
button link. If it isn't set yet:

```bash
supabase secrets set APP_URL="https://byld1.vercel.app"
```

## 5. Deploy the edge function

```bash
supabase functions deploy send-approval-email
```

## 6. Test it

1. In the app, submit a **New Request** in Approvals as an architect on a
   project that has a client member — the client should receive an email
   within a few seconds.
2. As that client, **Approve** or **Reject** it — the architect (original
   requester) should receive a decision email.
3. If nothing arrives, check: Supabase edge function logs (`supabase functions
   logs send-approval-email`), and the Apps Script project's **Executions**
   tab (left sidebar) for errors.

## Updating the email template or script later

- To change the email's copy/HTML, edit
  `supabase/functions/send-approval-email/index.ts` and redeploy with
  `supabase functions deploy send-approval-email` — no Apps Script changes
  needed for that.
- To change the Apps Script relay itself (e.g. `send-approval-email.gs`),
  edit it in the Apps Script editor, then **Deploy → Manage deployments →
  Edit (pencil icon) → Version: New version → Deploy**. The Web App URL stays
  the same across versions, so no Supabase secret update is needed.
