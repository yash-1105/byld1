import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, origin } = await req.json();

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Reuse the same Google OAuth client as Drive; only the redirect URI differs.
    const clientId = Deno.env.get('GOOGLE_DRIVE_CLIENT_ID');
    const redirectUri = Deno.env.get('GOOGLE_CALENDAR_REDIRECT_URI');

    if (!clientId || !redirectUri) {
      throw new Error('Google OAuth credentials not configured.');
    }

    // calendar.events grants read/write access to events (create, update, delete) —
    // a superset of calendar.readonly, so this single scope covers listing and mutating.
    const scope = encodeURIComponent(
      'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email'
    );
    // Carry the originating site in state so the callback can return the user
    // to where they started (localhost during dev, prod otherwise).
    const state = origin ? `${userId}|${encodeURIComponent(origin)}` : `${userId}`;
    // include_granted_scopes keeps the existing Drive grant so connecting Calendar
    // (same OAuth client) doesn't drop drive.readonly.
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent&include_granted_scopes=true&state=${encodeURIComponent(state)}`;

    return new Response(JSON.stringify({ url: authUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
