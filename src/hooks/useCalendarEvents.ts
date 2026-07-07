import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { CalendarConnection, CalendarEvent, CalendarEventDraft } from '@/types/calendar';

const WINDOW_DAYS = 7;

/** Thrown when the stored Google token predates the calendar.events write scope. */
export class InsufficientCalendarScopeError extends Error {
  constructor() {
    super('Reconnect Google Calendar to enable scheduling — your last connection only allows viewing events.');
    this.name = 'InsufficientCalendarScopeError';
  }
}

function draftToGoogleEvent(draft: CalendarEventDraft) {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return {
    summary: draft.summary,
    description: draft.description || undefined,
    location: draft.location || undefined,
    start: draft.allDay
      ? { date: draft.date }
      : { dateTime: `${draft.date}T${draft.startTime}:00`, timeZone },
    end: draft.allDay
      ? { date: draft.date }
      : { dateTime: `${draft.date}T${draft.endTime}:00`, timeZone },
  };
}

async function invokeEventWrite(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('google-calendar-event-write', { body });
  if (error) {
    let detail = error.message;
    let isScopeError = false;
    try {
      const ctx = (error as { context?: Response }).context;
      if (ctx && typeof ctx.json === 'function') {
        const parsedBody = await ctx.json();
        if (parsedBody?.error === 'insufficient_scope') isScopeError = true;
        else if (parsedBody?.error) detail = parsedBody.error;
      }
    } catch { /* keep generic message */ }
    if (isScopeError) throw new InsufficientCalendarScopeError();
    throw new Error(detail);
  }
  if (data?.error === 'insufficient_scope') throw new InsufficientCalendarScopeError();
  if (data?.error) throw new Error(data.error);
  return data;
}

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

  const invalidateEvents = () => queryClient.invalidateQueries({ queryKey: ['calendar-events', user?.id] });

  const createEventMutation = useMutation({
    mutationFn: (draft: CalendarEventDraft) =>
      invokeEventWrite({ userId: user!.id, action: 'create', event: draftToGoogleEvent(draft) }),
    onSuccess: invalidateEvents,
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ eventId, draft }: { eventId: string; draft: CalendarEventDraft }) =>
      invokeEventWrite({ userId: user!.id, action: 'update', eventId, event: draftToGoogleEvent(draft) }),
    onSuccess: invalidateEvents,
  });

  const deleteEventMutation = useMutation({
    mutationFn: (eventId: string) =>
      invokeEventWrite({ userId: user!.id, action: 'delete', eventId }),
    onSuccess: invalidateEvents,
  });

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
      invalidateEvents();
    },
    createEvent: createEventMutation.mutateAsync,
    updateEvent: (eventId: string, draft: CalendarEventDraft) => updateEventMutation.mutateAsync({ eventId, draft }),
    deleteEvent: deleteEventMutation.mutateAsync,
    creatingEvent: createEventMutation.isPending,
    updatingEvent: updateEventMutation.isPending,
    deletingEvent: deleteEventMutation.isPending,
  };
}
