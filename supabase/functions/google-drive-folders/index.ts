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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: connection, error: connError } = await supabaseClient
      .from('drive_connections')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (connError || !connection) {
      throw new Error('Google Drive connection not found.');
    }

    let accessToken = connection.access_token;

    // Fetch files from Drive
    let driveResponse = await fetch(`https://www.googleapis.com/drive/v3/files?q=mimeType!='application/vnd.google-apps.folder'+and+trashed=false&fields=files(id,name,mimeType,webViewLink,iconLink,modifiedTime)&pageSize=50&orderBy=modifiedTime desc`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (driveResponse.status === 401) {
      // Token expired, refresh it
      const tokenData = await refreshAccessToken(connection.refresh_token);
      if (tokenData.error) throw new Error('Failed to refresh access token');
      
      accessToken = tokenData.access_token;
      
      // Update in DB
      await supabaseClient.from('drive_connections').update({ access_token: accessToken }).eq('id', connection.id);

      // Retry
      driveResponse = await fetch(`https://www.googleapis.com/drive/v3/files?q=mimeType!='application/vnd.google-apps.folder'+and+trashed=false&fields=files(id,name,mimeType,webViewLink,iconLink,modifiedTime)&pageSize=50&orderBy=modifiedTime desc`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    }

    const driveData = await driveResponse.json();

    if (driveData.error) {
      throw new Error(driveData.error.message);
    }

    return new Response(JSON.stringify({ files: driveData.files || [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
