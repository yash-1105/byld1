-- Create calendar_connections table (per-user Google Calendar OAuth tokens)
-- Mirrors drive_connections from 20260605000000_add_google_drive_integration.sql
CREATE TABLE IF NOT EXISTS public.calendar_connections (
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
ALTER TABLE public.calendar_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for calendar_connections (owner-scoped)
CREATE POLICY "Users can view own calendar connections" ON public.calendar_connections
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar connections" ON public.calendar_connections
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar connections" ON public.calendar_connections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar connections" ON public.calendar_connections
    FOR UPDATE USING (auth.uid() = user_id);

-- Trigger for updated_at on calendar_connections
CREATE OR REPLACE FUNCTION update_calendar_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_calendar_connections_updated_at_trigger
BEFORE UPDATE ON public.calendar_connections
FOR EACH ROW
EXECUTE FUNCTION update_calendar_connections_updated_at();
