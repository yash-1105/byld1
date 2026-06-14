import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  // This is a GET request from Google's redirect.
  // state carries "userId" or "userId|<origin>"; return the user to that origin
  // (allowlisted) so connecting from localhost stays on localhost. Falls back to APP_URL.
  const defaultUrl = (Deno.env.get('APP_URL') ?? 'http://localhost:5173').replace(/\/+$/, '');
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:8080',
    'https://byld1.vercel.app',
  ];
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const rawState = url.searchParams.get('state') ?? '';
    const [userId, encOrigin] = rawState.split('|');

    let appUrl = defaultUrl;
    if (encOrigin) {
      try {
        const o = decodeURIComponent(encOrigin).replace(/\/+$/, '');
        if (allowedOrigins.includes(o)) appUrl = o;
      } catch { /* keep default */ }
    }

    if (!code || !userId) {
      return Response.redirect(`${appUrl}/dashboard?error=missing_oauth_params`, 302);
    }

    const clientId = Deno.env.get('GOOGLE_DRIVE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_DRIVE_CLIENT_SECRET');
    const redirectUri = Deno.env.get('GOOGLE_CALENDAR_REDIRECT_URI');

    if (!clientId || !clientSecret || !redirectUri) {
      return Response.redirect(`${appUrl}/dashboard?error=missing_env`, 302);
    }

    // Exchange code for token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return Response.redirect(`${appUrl}/dashboard?error=token_exchange_failed`, 302);
    }

    // Get user email
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userResponse.json();

    // Store in Supabase using Service Role to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error: dbError } = await supabaseClient
      .from('calendar_connections')
      .upsert({
        user_id: userId,
        google_account_email: userData.email,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || '',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (dbError) {
      console.error('DB Error:', dbError);
      return Response.redirect(`${appUrl}/dashboard?error=database_error`, 302);
    }

    // Successfully connected, redirect back to the dashboard
    return Response.redirect(`${appUrl}/dashboard?success=calendar_connected`, 302);
  } catch (error: any) {
    console.error('Callback error:', error);
    return Response.redirect(`${defaultUrl}/dashboard?error=unknown_error`, 302);
  }
});
