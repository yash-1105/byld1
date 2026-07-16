-- Approval due dates + one-shot overdue-reminder tracking.
--
-- due_date         : optional date by which the approval should be decided.
-- reminder_sent_at : set the first (and only) time an overdue reminder email is sent,
--                    so the scheduled reminder job never spams the same approval daily.

ALTER TABLE public.approvals
    ADD COLUMN IF NOT EXISTS due_date DATE,
    ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP WITH TIME ZONE;
