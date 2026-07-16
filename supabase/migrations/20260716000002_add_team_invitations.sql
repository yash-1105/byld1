-- Email-lookup + invite/accept flow for adding project members, replacing the old
-- "browse every registered user" Add panel (which leaked every user's name/email
-- platform-wide). Two pieces:
--
-- 1. lookup_user_for_invite(email): a narrow, SECURITY DEFINER lookup that returns at
--    most ONE exact email match with only the fields needed for an invite preview card.
--    This is deliberately separate from the broad SELECT the users table grants other
--    features (chat, assignees, etc. resolve OTHER users' names from IDs they already
--    hold) — looking someone up FROM SCRATCH by email must never return more than the
--    single exact match, or any field beyond the preview.
--
-- 2. team_invitations: pending → accepted/declined invites. Adding someone is now a
--    two-step invite → accept; project_members is only written on acceptance.

CREATE OR REPLACE FUNCTION public.lookup_user_for_invite(p_email TEXT)
RETURNS TABLE(id UUID, full_name TEXT, avatar_url TEXT, role TEXT, email TEXT)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT id, full_name, avatar_url, role, email
  FROM public.users
  WHERE lower(email) = lower(p_email)
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.lookup_user_for_invite(TEXT) TO authenticated;

CREATE TABLE IF NOT EXISTS public.team_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    invited_email TEXT NOT NULL,
    invited_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL,
    invited_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending | accepted | declined
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    responded_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own invites (sent or received)" ON public.team_invitations
    FOR SELECT USING (auth.uid() = invited_user_id OR auth.uid() = invited_by);

CREATE POLICY "Users can create invites they're sending" ON public.team_invitations
    FOR INSERT WITH CHECK (auth.uid() = invited_by);

CREATE POLICY "Invited user can respond to their own invite" ON public.team_invitations
    FOR UPDATE USING (auth.uid() = invited_user_id);

CREATE INDEX IF NOT EXISTS idx_team_invitations_invited_user ON public.team_invitations(invited_user_id) WHERE status = 'pending';
