-- Point-based comments (pins) on drawing revisions: each comment is anchored to an
-- exact spot on a specific revision's preview via fractional coordinates. Scoped to
-- drawing_versions (not drawings) on purpose — geometry can shift between revisions,
-- so a pin placed on Rev 2 must never surface on Rev 1 or Rev 3.

CREATE TABLE IF NOT EXISTS public.drawing_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    drawing_version_id UUID REFERENCES public.drawing_versions(id) ON DELETE CASCADE NOT NULL,
    x_pct NUMERIC(6,5) NOT NULL,   -- 0..1, position relative to the rendered image's own width
    y_pct NUMERIC(6,5) NOT NULL,   -- 0..1, position relative to the rendered image's own height
    comment_text TEXT NOT NULL,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.drawing_comments ENABLE ROW LEVEL SECURITY;

-- View: same permissiveness as drawings/drawing_versions (project scoping done in app)
CREATE POLICY "Users can view drawing comments" ON public.drawing_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.drawing_versions dv
            JOIN public.drawings d ON d.id = dv.drawing_id
            WHERE dv.id = drawing_comments.drawing_version_id
        )
    );

-- Insert: commenter must be the authenticated user (all four roles may comment)
CREATE POLICY "Users can insert drawing comments" ON public.drawing_comments
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Delete: the comment's own author, or an architect (same elevated-role pattern as approvals)
CREATE POLICY "Users can delete own drawing comments or architects can delete any" ON public.drawing_comments
    FOR DELETE USING (
        auth.uid() = created_by
        OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'architect')
    );

CREATE INDEX IF NOT EXISTS idx_drawing_comments_version ON public.drawing_comments(drawing_version_id);
