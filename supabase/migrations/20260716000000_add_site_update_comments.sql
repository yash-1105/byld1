-- Instagram-style comments on site updates. A comment belongs to the underlying
-- site_updates row, so it travels with that update from the 24h Stories view into the
-- Archive feed once the story window ends — nothing is lost. Same permissive-select +
-- owner/architect-delete pattern as drawing_comments (20260715000000_add_drawing_comments.sql).
--
-- Actual visibility of private/tagged updates is enforced the same way it already is for the
-- parent site_updates row: client-side filtering (see canViewUpdate in shared.tsx), NOT at the
-- DB level. Comments simply follow whatever access set the update itself is filtered into, so
-- this table adds no separate private-update logic.

CREATE TABLE IF NOT EXISTS public.site_update_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    site_update_id UUID REFERENCES public.site_updates(id) ON DELETE CASCADE NOT NULL,
    comment_text TEXT NOT NULL,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.site_update_comments ENABLE ROW LEVEL SECURITY;

-- View: same permissiveness as site_updates (project/privacy scoping done in app)
CREATE POLICY "Users can view site update comments" ON public.site_update_comments
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.site_updates su WHERE su.id = site_update_comments.site_update_id)
    );

-- Insert: commenter must be the authenticated user (all four roles may comment)
CREATE POLICY "Users can insert site update comments" ON public.site_update_comments
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Delete: the comment's own author, or an architect (same elevated-role pattern as approvals)
CREATE POLICY "Users can delete own site update comments or architects can delete any" ON public.site_update_comments
    FOR DELETE USING (
        auth.uid() = created_by
        OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'architect')
    );

CREATE INDEX IF NOT EXISTS idx_site_update_comments_update ON public.site_update_comments(site_update_id);
