-- Schedule the daily overdue-approval reminder sweep.
--
-- The send-approval-reminder-email edge function is configured verify_jwt = false
-- (see supabase/config.toml), so pg_cron can invoke it with an empty body and NO auth
-- header — nothing secret is embedded in this migration. The function itself uses its
-- own SUPABASE_SERVICE_ROLE_KEY env var (available to every edge function by default)
-- to query the database.
--
-- NOTE: pg_cron / pg_net are available on Supabase but sometimes must first be enabled
-- from the dashboard (Database → Extensions) before `CREATE EXTENSION` succeeds from a
-- migration. If this migration errors on the CREATE EXTENSION lines, enable "pg_cron"
-- and "pg_net" once in the dashboard, then re-run `supabase db push`. The reminder is
-- useless unless something triggers it, so do not skip this step.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Make re-running this migration idempotent: drop any prior copy of the job first.
DO $$
BEGIN
  PERFORM cron.unschedule('send-approval-reminders-daily');
EXCEPTION WHEN OTHERS THEN
  NULL; -- job didn't exist yet
END $$;

SELECT cron.schedule(
  'send-approval-reminders-daily',
  '0 9 * * *', -- 09:00 UTC daily
  $$
  SELECT net.http_post(
    url := 'https://qnriqsnuebcxxzcfxfsv.supabase.co/functions/v1/send-approval-reminder-email',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{}'::jsonb
  );
  $$
);
