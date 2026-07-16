# Speech relay

WebSocket relay for live streaming transcription (Google Cloud Speech-to-Text
`streamingRecognize`), used by the "Speak to create" voice flow on the
Approvals page. Deployed to Cloud Run, separate from the Vite app and from
Supabase Edge Functions (which can't drive a gRPC streaming client).

## Env vars

- `SUPABASE_JWKS_URL` — e.g. `https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json`
- `SUPABASE_PROJECT_URL` — e.g. `https://<project-ref>.supabase.co` (used to derive the expected `iss` claim)
- `SUPABASE_JWT_SECRET` — only needed if the project still signs tokens with a
  legacy symmetric (HS256) secret rather than the newer asymmetric (ES256) JWT
  signing keys. Check by decoding a real session token's header
  (`atob(access_token.split('.')[0])` in the browser console) — if `alg` is
  `ES256`, leave this unset; if `HS256`, set it from Supabase Dashboard →
  Project Settings → API → JWT Secret.
- `ALLOWED_ORIGINS` — comma-separated list of allowed WebSocket origins.
- `PORT` — set automatically by Cloud Run.

## Auth to Google Cloud

Uses Application Default Credentials via the Cloud Run service's attached
service account (`speech-relay-sa`, granted `roles/speech.client`) — no API
key.

## Deploy

```bash
gcloud run deploy speech-relay --source . \
  --project byld-drive-integration --region asia-south1 \
  --allow-unauthenticated \
  --service-account speech-relay-sa@byld-drive-integration.iam.gserviceaccount.com \
  --execution-environment gen2 --timeout 300 --concurrency 20 \
  --memory 512Mi --cpu 1 --min-instances 0 --max-instances 10 \
  --set-env-vars "SUPABASE_JWKS_URL=...,SUPABASE_PROJECT_URL=...,ALLOWED_ORIGINS=..."
```
