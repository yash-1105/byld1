-- Architect-only mood boards: a Fabric.js whiteboard per row (canvas_data holds
-- canvas.toJSON() output; thumbnail_url is a downscaled PNG export in chat-media).
-- Role-gated at the DB layer on every operation — this feature must be fully
-- invisible to contractor/client/consultant, not just hidden in the UI.

CREATE TABLE IF NOT EXISTS public.mood_boards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL DEFAULT 'Untitled Board',
    canvas_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    thumbnail_url TEXT,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.mood_boards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Architects can view mood boards" ON public.mood_boards
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'architect')
        AND EXISTS (SELECT 1 FROM public.projects p WHERE p.id = mood_boards.project_id)
    );

CREATE POLICY "Architects can insert mood boards" ON public.mood_boards
    FOR INSERT WITH CHECK (
        auth.uid() = created_by
        AND EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'architect')
    );

CREATE POLICY "Architects can update mood boards" ON public.mood_boards
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'architect')
    );

CREATE POLICY "Architects can delete mood boards" ON public.mood_boards
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'architect')
    );

-- Trigger for updated_at (same convention as calendar_connections)
CREATE OR REPLACE FUNCTION update_mood_boards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mood_boards_updated_at_trigger
BEFORE UPDATE ON public.mood_boards
FOR EACH ROW
EXECUTE FUNCTION update_mood_boards_updated_at();

CREATE INDEX IF NOT EXISTS idx_mood_boards_project ON public.mood_boards(project_id);
