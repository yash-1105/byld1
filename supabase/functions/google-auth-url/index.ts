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

    const clientId = Deno.env.get('GOOGLE_DRIVE_CLIENT_ID');
    const redirectUri = Deno.env.get('GOOGLE_DRIVE_REDIRECT_URI');

    if (!clientId || !redirectUri) {
      throw new Error('Google OAuth credentials not configured.');
    }

    const scope = encodeURIComponent('https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.email');
    // Carry the originating site in state so the callback can return the user
    // to where they started (localhost during dev, prod otherwise).
    const state = origin ? `${userId}|${encodeURIComponent(origin)}` : `${userId}`;
    // include_granted_scopes keeps any previously-granted scopes (e.g. Calendar) so the
    // shared OAuth client's grants don't clobber each other.
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
