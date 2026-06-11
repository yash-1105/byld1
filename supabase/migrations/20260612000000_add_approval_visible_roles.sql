-- Add role-based visibility to approvals.
-- Approvals are always decided by architects & clients; this column lets the
-- requester additionally share an approval with contractors and/or consultants.
ALTER TABLE public.approvals
    ADD COLUMN IF NOT EXISTS visible_roles TEXT[] DEFAULT ARRAY['architect','client']::text[];

-- Backfill any existing rows so they remain visible to the decision-makers.
UPDATE public.approvals
    SET visible_roles = ARRAY['architect','client']::text[]
    WHERE visible_roles IS NULL;
