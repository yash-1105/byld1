import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Video, Link as LinkIcon, RefreshCw, AlertCircle, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCalendarEvents, InsufficientCalendarScopeError } from '@/hooks/useCalendarEvents';
import CalendarEventDialog from '@/components/dashboards/CalendarEventDialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { CalendarEvent, CalendarEventDraft } from '@/types/calendar';

/* ---------- date helpers ---------- */
const startDate = (e: CalendarEvent) => new Date(e.start.dateTime || `${e.start.date}T00:00:00`);
const isAllDay = (e: CalendarEvent) => !e.start.dateTime;

function dayKey(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}
function dayLabel(d: Date) {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, today)) return 'Today';
  if (same(d, tomorrow)) return 'Tomorrow';
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}
function timeLabel(e: CalendarEvent) {
  if (isAllDay(e)) return 'All day';
  return startDate(e).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function WidgetShell({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="soft-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Calendar className="w-4.5 h-4.5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Upcoming Meetings</h3>
            <p className="text-[11px] text-muted-foreground">Your Google Calendar · next 7 days</p>
          </div>
        </div>
        {right}
      </div>
      {children}
    </motion.div>
  );
}

export default function GoogleCalendarWidget() {
  const {
    isConnected, connectionLoading, events, eventsLoading, eventsError, eventsErrorMessage,
    connect, disconnect, refetch,
    createEvent, updateEvent, deleteEvent, creatingEvent, updatingEvent, deletingEvent,
  } = useCalendarEvents();
  const [connecting, setConnecting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleInsufficientScope = async (e: unknown) => {
    if (e instanceof InsufficientCalendarScopeError) {
      toast.error(e.message, {
        action: { label: 'Reconnect', onClick: async () => { await disconnect(); handleConnect(); } },
      });
      return true;
    }
    return false;
  };

  const openCreate = () => { setEditingEvent(null); setDialogOpen(true); };
  const openEdit = (e: CalendarEvent) => { setEditingEvent(e); setDialogOpen(true); };

  const handleSave = async (draft: CalendarEventDraft) => {
    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, draft);
        toast.success('Meeting updated');
      } else {
        await createEvent(draft);
        toast.success('Meeting scheduled');
      }
    } catch (e) {
      if (await handleInsufficientScope(e)) throw new Error('Reconnect to schedule meetings');
      throw e;
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    const id = deletingId;
    setDeletingId(null);
    try {
      await deleteEvent(id);
      toast.success('Meeting cancelled');
    } catch (e) {
      if (!(await handleInsufficientScope(e))) {
        toast.error(e instanceof Error ? e.message : 'Failed to cancel meeting');
      }
    }
  };

  // React to the OAuth callback redirect (?success=calendar_connected / ?error=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'calendar_connected') {
      toast.success('Google Calendar connected');
      refetch();
      params.delete('success');
      window.history.replaceState({}, '', `${window.location.pathname}${params.toString() ? `?${params}` : ''}`);
    } else if (params.get('error') && params.get('error') !== 'missing_oauth_params') {
      // calendar callback errors are dashboard-scoped
      const err = params.get('error');
      if (err?.includes('token') || err?.includes('database') || err?.includes('env')) {
        toast.error('Could not connect Google Calendar. Please try again.');
        params.delete('error');
        window.history.replaceState({}, '', `${window.location.pathname}${params.toString() ? `?${params}` : ''}`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grouped = useMemo(() => {
    const sorted = [...events].sort((a, b) => startDate(a).getTime() - startDate(b).getTime());
    const map = new Map<string, { label: string; items: CalendarEvent[] }>();
    for (const e of sorted) {
      const d = startDate(e);
      const key = dayKey(d);
      if (!map.has(key)) map.set(key, { label: dayLabel(d), items: [] });
      map.get(key)!.items.push(e);
    }
    return Array.from(map.values());
  }, [events]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await connect();
    } catch {
      toast.error('Failed to start Google Calendar connection. Ensure Edge Functions are deployed.');
      setConnecting(false);
    }
  };

  const newMeetingButton = (
    <button
      onClick={openCreate}
      title="Schedule a meeting"
      className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors shrink-0"
    >
      <Plus className="w-4 h-4" />
    </button>
  );

  let body: React.ReactNode;

  // ---- loading ----
  if (connectionLoading) {
    body = (
      <WidgetShell>
        <div className="space-y-2">
          {[0, 1, 2].map((i) => <div key={i} className="h-12 bg-muted/60 animate-pulse rounded-xl" />)}
        </div>
      </WidgetShell>
    );
  } else if (!isConnected) {
    // ---- not connected ----
    body = (
      <WidgetShell>
        <div className="text-center py-6">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6 text-primary" />
          </div>
          <p className="text-sm font-semibold text-foreground">Connect your Google Calendar</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
            See your upcoming meetings, and schedule or edit new ones, right here on the dashboard.
          </p>
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium px-5 py-2 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-all shadow-sm disabled:opacity-60"
          >
            <LinkIcon className="w-4 h-4" /> {connecting ? 'Redirecting…' : 'Connect Google Calendar'}
          </button>
        </div>
      </WidgetShell>
    );
  } else if (eventsError) {
    // ---- connected: error (token revoked / fetch failed) ----
    body = (
      <WidgetShell>
        <div className="text-center py-6">
          <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6 text-destructive" />
          </div>
          <p className="text-sm font-semibold text-foreground">Couldn't load your calendar</p>
          <p className="text-xs text-muted-foreground mt-1">Your access may have expired. Reconnect to continue.</p>
          {eventsErrorMessage && (
            <p className="text-[11px] text-muted-foreground/80 mt-2 max-w-sm mx-auto break-words">
              {eventsErrorMessage}
            </p>
          )}
          <button
            onClick={async () => { await disconnect(); handleConnect(); }}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium px-5 py-2 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-all shadow-sm"
          >
            <RefreshCw className="w-4 h-4" /> Reconnect
          </button>
        </div>
      </WidgetShell>
    );
  } else if (eventsLoading) {
    // ---- connected: loading events ----
    body = (
      <WidgetShell right={newMeetingButton}>
        <div className="space-y-2">
          {[0, 1, 2].map((i) => <div key={i} className="h-12 bg-muted/60 animate-pulse rounded-xl" />)}
        </div>
      </WidgetShell>
    );
  } else if (events.length === 0) {
    // ---- connected: empty ----
    body = (
      <WidgetShell right={newMeetingButton}>
        <div className="text-center py-8">
          <Calendar className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No meetings in the next 7 days.</p>
          <button
            onClick={openCreate}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <Plus className="w-3.5 h-3.5" /> Schedule one
          </button>
        </div>
      </WidgetShell>
    );
  } else {
    // ---- connected: events ----
    let idx = 0;
    body = (
      <WidgetShell right={newMeetingButton}>
        <div className="space-y-4">
          {grouped.map((group) => (
            <div key={group.label}>
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-2">{group.label}</p>
              <div className="space-y-2">
                {group.items.map((e) => {
                  const delay = (idx++) * 0.04;
                  const row = (
                    <motion.div
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay }}
                      className="group flex items-center gap-3 p-2.5 rounded-xl border border-border/60 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center w-16 shrink-0">
                        <span className="text-xs font-bold text-foreground">{timeLabel(e)}</span>
                      </div>
                      <div className="w-px self-stretch bg-border/70" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate">{e.summary}</p>
                        <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted-foreground">
                          {e.location && (
                            <span className="flex items-center gap-1 truncate max-w-[10rem]">
                              <MapPin className="w-3 h-3 shrink-0" /> <span className="truncate">{e.location}</span>
                            </span>
                          )}
                          {e.hangoutLink && (
                            <span className="flex items-center gap-1 text-primary"><Video className="w-3 h-3" /> Meet</span>
                          )}
                          {!!e.attendeesCount && e.attendeesCount > 1 && (
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {e.attendeesCount} guests</span>
                          )}
                        </div>
                      </div>
                      <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                        <button
                          onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); openEdit(e); }}
                          title="Edit meeting"
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); setDeletingId(e.id); }}
                          title="Cancel meeting"
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                  return e.htmlLink ? (
                    <a key={e.id} href={e.htmlLink} target="_blank" rel="noopener noreferrer" className="block">
                      {row}
                    </a>
                  ) : (
                    <div key={e.id}>{row}</div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </WidgetShell>
    );
  }

  return (
    <>
      {body}
      <CalendarEventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        event={editingEvent}
        onSave={handleSave}
        saving={creatingEvent || updatingEvent}
      />
      <AlertDialog open={!!deletingId} onOpenChange={(v) => { if (!v) setDeletingId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this meeting?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the event from your Google Calendar. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deletingEvent} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deletingEvent ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Cancelling</> : 'Cancel meeting'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
