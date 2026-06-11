-- Add optional cost to approvals.
-- cost_type: 'fixed' (final) or 'variable' (an estimate the assignee finalises later in Budget).
-- cost_amount is stored in the app's USD base (same as budget_entries.amount).
ALTER TABLE public.approvals
    ADD COLUMN IF NOT EXISTS cost_type TEXT
        CHECK (cost_type IN ('fixed','variable')),
    ADD COLUMN IF NOT EXISTS cost_amount NUMERIC;
