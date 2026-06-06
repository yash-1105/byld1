-- Create drive_connections table
CREATE TABLE IF NOT EXISTS public.drive_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    google_account_email TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.drive_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for drive_connections
CREATE POLICY "Users can view own drive connections" ON public.drive_connections
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own drive connections" ON public.drive_connections
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own drive connections" ON public.drive_connections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own drive connections" ON public.drive_connections
    FOR UPDATE USING (auth.uid() = user_id);

-- Create drive_folder_mappings table
CREATE TABLE IF NOT EXISTS public.drive_folder_mappings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    google_folder_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(project_id, google_folder_id)
);

ALTER TABLE public.drive_folder_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view mappings for their projects" ON public.drive_folder_mappings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = drive_folder_mappings.project_id
        )
    );

CREATE POLICY "Users can insert mappings" ON public.drive_folder_mappings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own mappings" ON public.drive_folder_mappings
    FOR DELETE USING (auth.uid() = user_id);

-- Create drive_files table
CREATE TABLE IF NOT EXISTS public.drive_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    google_file_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    drive_link TEXT NOT NULL,
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    metadata_json JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.drive_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view drive files for their projects" ON public.drive_files
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = drive_files.project_id
        )
    );

CREATE POLICY "Users can insert own drive files" ON public.drive_files
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own drive files" ON public.drive_files
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own drive files" ON public.drive_files
    FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at on drive_connections
CREATE OR REPLACE FUNCTION update_drive_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_drive_connections_updated_at_trigger
BEFORE UPDATE ON public.drive_connections
FOR EACH ROW
EXECUTE FUNCTION update_drive_connections_updated_at();
