CREATE TABLE IF NOT EXISTS public.document_folders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(project_id, name)
);

ALTER TABLE public.document_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view document folders" ON public.document_folders
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.projects p WHERE p.id = document_folders.project_id)
    );

CREATE POLICY "Users can create document folders" ON public.document_folders
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE INDEX IF NOT EXISTS idx_document_folders_project ON public.document_folders(project_id);
