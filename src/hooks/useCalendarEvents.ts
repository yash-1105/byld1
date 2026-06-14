import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { CalendarConnection, CalendarEvent } from '@/types/calendar';

const WINDOW_DAYS = 7;

/**
 * Per-user Google Calendar access for the dashboard widget / settings card.
 * Mirrors the Drive integration: connection state lives in `calendar_connections`,
 * events are fetched live via the `google-calendar-events` edge function and cached.
 */
export function useCalendarEvents() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const connectionQuery = useQuery({
    queryKey: ['calendar-connection', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calendar_connections')
        .select('id, user_id, google_account_email, created_at, updated_at')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      return (data as CalendarConnection | null) ?? null;
    },
    enabled: !!user,
  });

  const isConnected = !!connectionQuery.data;

  const eventsQuery = useQuery({
    queryKey: ['calendar-events', user?.id],
    queryFn: async () => {
      const now = new Date();
      const timeMin = now.toISOString();
      const timeMax = new Date(now.getTime() + WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase.functions.invoke('google-calendar-events', {
        body: { userId: user!.id, timeMin, timeMax },
      });
      if (error) {
        // Surface the real message from the function body (e.g. a Google 403 scope error),
        // not the generic "non-2xx status code" that supabase-js throws.
        let detail = error.message;
        try {
          const ctx = (error as { context?: Response }).context;
          if (ctx && typeof ctx.json === 'function') {
            const body = await ctx.json();
            if (body?.error) detail = body.error;
          }
        } catch { /* keep generic message */ }
        console.error('[calendar] events fetch failed:', detail);
        throw new Error(detail);
      }
      if (data?.error) throw new Error(data.error);
      return (data?.events ?? []) as CalendarEvent[];
    },
    enabled: !!user && isConnected,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const connect = async () => {
    if (!user) return;
    const { data, error } = await supabase.functions.invoke('google-calendar-auth-url', {
      body: { userId: user.id, origin: window.location.origin },
    });
    if (error) throw error;
    if (data?.url) window.location.href = data.url;
  };

  const disconnect = async () => {
    if (!user) return;
    const { error } = await supabase
      .from('calendar_connections')
      .delete()
      .eq('user_id', user.id);
    if (error) throw error;
    await queryClient.invalidateQueries({ queryKey: ['calendar-connection', user.id] });
    queryClient.removeQueries({ queryKey: ['calendar-events', user.id] });
  };

  return {
    connection: connectionQuery.data ?? null,
    isConnected,
    connectionLoading: connectionQuery.isLoading,
    events: eventsQuery.data ?? [],
    eventsLoading: eventsQuery.isLoading,
    eventsError: eventsQuery.isError,
    eventsErrorMessage: (eventsQuery.error as Error | null)?.message ?? null,
    windowDays: WINDOW_DAYS,
    connect,
    disconnect,
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-connection', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events', user?.id] });
    },
  };
}
