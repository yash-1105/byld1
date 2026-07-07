import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function refreshAccessToken(refreshToken: string) {
  const clientId = Deno.env.get('GOOGLE_DRIVE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_DRIVE_CLIENT_SECRET');

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  return response.json();
}

function buildUrl(timeMin: string, timeMax: string) {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '50',
  });
  return `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, timeMin, timeMax } = await req.json();
    if (!userId) throw new Error('User ID is required');

    const now = new Date();
    const min = timeMin || now.toISOString();
    const max = timeMax || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: connection, error: connError } = await supabaseClient
      .from('calendar_connections')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (connError || !connection) {
      throw new Error('Google Calendar connection not found.');
    }

    let accessToken = connection.access_token;

    let calRes = await fetch(buildUrl(min, max), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (calRes.status === 401) {
      // Token expired — refresh and retry (same pattern as google-drive-folders)
      const tokenData = await refreshAccessToken(connection.refresh_token);
      if (tokenData.error) throw new Error('Failed to refresh access token');

      accessToken = tokenData.access_token;
      await supabaseClient
        .from('calendar_connections')
        .update({ access_token: accessToken })
        .eq('id', connection.id);

      calRes = await fetch(buildUrl(min, max), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    }

    const calData = await calRes.json();
    if (calData.error) {
      throw new Error(calData.error.message || 'Calendar API error');
    }

    const events = (calData.items || [])
      .filter((e: any) => e.status !== 'cancelled')
      .map((e: any) => ({
        id: e.id,
        summary: e.summary || '(No title)',
        start: e.start || {},
        end: e.end || {},
        location: e.location || null,
        hangoutLink: e.hangoutLink || null,
        htmlLink: e.htmlLink || null,
        attendeesCount: Array.isArray(e.attendees) ? e.attendees.length : 0,
        description: e.description || null,
      }));

    return new Response(JSON.stringify({ events }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
