-- Project classification (category / country / region) + an audit trail of deadline changes.
--
-- category / country / region are higher-level classification fields on the project itself —
-- distinct from the precise `address`/`latitude`/`longitude` used for geofencing & maps.
--
-- project_deadline_revisions records every change to projects.end_date so the whole team
-- (including clients) can see the full trail original → rev1 → rev2, not just the latest date.
--
-- NOTE ON ENFORCEMENT: the existing UPDATE policy on public.projects is not in a tracked
-- migration and (per the app's Mood Board precedent) already lets project members update the
-- row, so the "only architects may change end_date" rule is enforced at the APP level (only
-- architects get the edit affordance in DeadlineHistory), not by a DB policy. The revisions
-- table below IS architect-only at the DB level for inserts.

ALTER TABLE public.projects
    ADD COLUMN IF NOT EXISTS category TEXT,
    ADD COLUMN IF NOT EXISTS country TEXT,
    ADD COLUMN IF NOT EXISTS region TEXT; -- state / metro area / place

CREATE TABLE IF NOT EXISTS public.project_deadline_revisions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    previous_deadline DATE NOT NULL,
    new_deadline DATE NOT NULL,
    reason TEXT,
    changed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.project_deadline_revisions ENABLE ROW LEVEL SECURITY;

-- View: anyone who can see the parent project can see its full revision history (project/privacy
-- scoping is done in the app, matching the other feature tables).
CREATE POLICY "Users can view deadline revisions" ON public.project_deadline_revisions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_deadline_revisions.project_id)
    );

-- Insert: only an architect may record a deadline revision, and only as themselves.
CREATE POLICY "Architects can insert deadline revisions" ON public.project_deadline_revisions
    FOR INSERT WITH CHECK (
        auth.uid() = changed_by
        AND EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'architect')
    );

CREATE INDEX IF NOT EXISTS idx_deadline_revisions_project ON public.project_deadline_revisions(project_id);
