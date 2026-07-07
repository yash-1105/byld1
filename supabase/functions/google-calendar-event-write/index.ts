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

interface EventInput {
  summary: string;
  description?: string | null;
  location?: string | null;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
}

function eventsUrl(eventId?: string) {
  const base = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
  return eventId ? `${base}/${eventId}` : base;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, action, eventId, event } = (await req.json()) as {
      userId: string;
      action: 'create' | 'update' | 'delete';
      eventId?: string;
      event?: EventInput;
    };

    if (!userId) throw new Error('User ID is required');
    if (!action) throw new Error('Action is required');
    if ((action === 'update' || action === 'delete') && !eventId) {
      throw new Error('Event ID is required for update/delete');
    }
    if ((action === 'create' || action === 'update') && !event) {
      throw new Error('Event payload is required');
    }

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

    const method = action === 'create' ? 'POST' : action === 'update' ? 'PATCH' : 'DELETE';
    const url = action === 'create' ? eventsUrl() : eventsUrl(eventId);

    const doRequest = (token: string) =>
      fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(action !== 'delete' ? { 'Content-Type': 'application/json' } : {}),
        },
        ...(action !== 'delete' ? { body: JSON.stringify(event) } : {}),
      });

    let res = await doRequest(accessToken);

    if (res.status === 401) {
      const tokenData = await refreshAccessToken(connection.refresh_token);
      if (tokenData.error) throw new Error('Failed to refresh access token');

      accessToken = tokenData.access_token;
      await supabaseClient
        .from('calendar_connections')
        .update({ access_token: accessToken })
        .eq('id', connection.id);

      res = await doRequest(accessToken);
    }

    if (res.status === 403) {
      // The stored token predates the write scope (calendar.events) — the user
      // must reconnect and re-grant permission before they can write events.
      return new Response(JSON.stringify({ error: 'insufficient_scope' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    if (action === 'delete') {
      if (!res.ok && res.status !== 410) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message || 'Failed to delete event');
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message || 'Google Calendar API error');
    }

    return new Response(JSON.stringify({
      event: {
        id: data.id,
        summary: data.summary || '(No title)',
        start: data.start || {},
        end: data.end || {},
        location: data.location || null,
        hangoutLink: data.hangoutLink || null,
        htmlLink: data.htmlLink || null,
        attendeesCount: Array.isArray(data.attendees) ? data.attendees.length : 0,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
