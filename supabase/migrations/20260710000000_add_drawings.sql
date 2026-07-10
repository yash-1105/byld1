-- Drawings hub with version control: a `drawings` row is the logical sheet
-- (title/number/discipline), `drawing_versions` holds every uploaded revision.
-- The current revision is simply the highest version_number — no pointer column
-- to keep updates atomic (insert-only versioning preserves the full audit trail).

CREATE TABLE IF NOT EXISTS public.drawings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    drawing_number TEXT,
    discipline TEXT NOT NULL DEFAULT 'Architectural',
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.drawing_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    drawing_id UUID REFERENCES public.drawings(id) ON DELETE CASCADE NOT NULL,
    version_number INT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL DEFAULT 'pdf' CHECK (file_type IN ('pdf', 'image')),
    notes TEXT,
    uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE (drawing_id, version_number)
);

ALTER TABLE public.drawings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drawing_versions ENABLE ROW LEVEL SECURITY;

-- View: accessible by anyone who can see the project
CREATE POLICY "Users can view drawings for their projects" ON public.drawings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = drawings.project_id
        )
    );

CREATE POLICY "Users can view drawing versions for their projects" ON public.drawing_versions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.drawings d
            WHERE d.id = drawing_versions.drawing_id
        )
    );

-- Insert: uploader must be the authenticated user (role gating done in app)
CREATE POLICY "Users can insert drawings" ON public.drawings
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can insert drawing versions" ON public.drawing_versions
    FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

-- Update drawing metadata (rename/renumber/recategorize): any project viewer
CREATE POLICY "Users can update drawings for their projects" ON public.drawings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = drawings.project_id
        )
    );

-- Delete: only the drawing's creator can delete it (cascades to versions)
CREATE POLICY "Users can delete own drawings" ON public.drawings
    FOR DELETE USING (auth.uid() = created_by);

CREATE INDEX IF NOT EXISTS idx_drawings_project ON public.drawings(project_id);
CREATE INDEX IF NOT EXISTS idx_drawing_versions_drawing ON public.drawing_versions(drawing_id);
