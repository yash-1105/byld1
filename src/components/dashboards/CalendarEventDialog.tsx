import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import type { CalendarEvent, CalendarEventDraft } from '@/types/calendar';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  event?: CalendarEvent | null;
  onSave: (draft: CalendarEventDraft) => Promise<unknown>;
  saving: boolean;
}

const emptyDraft = (): CalendarEventDraft => ({
  summary: '',
  description: '',
  location: '',
  allDay: false,
  date: format(new Date(), 'yyyy-MM-dd'),
  startTime: '09:00',
  endTime: '10:00',
});

function eventToDraft(e: CalendarEvent): CalendarEventDraft {
  const allDay = !e.start.dateTime;
  const start = e.start.dateTime ? new Date(e.start.dateTime) : new Date(`${e.start.date}T00:00:00`);
  const end = e.end.dateTime ? new Date(e.end.dateTime) : null;
  return {
    summary: e.summary,
    description: e.description || '',
    location: e.location || '',
    allDay,
    date: format(start, 'yyyy-MM-dd'),
    startTime: allDay ? '09:00' : format(start, 'HH:mm'),
    endTime: allDay ? '10:00' : format(end ?? start, 'HH:mm'),
  };
}

export default function CalendarEventDialog({ open, onOpenChange, event, onSave, saving }: Props) {
  const [draft, setDraft] = useState<CalendarEventDraft>(emptyDraft());
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!event;

  useEffect(() => {
    if (open) {
      setDraft(event ? eventToDraft(event) : emptyDraft());
      setError(null);
    }
  }, [open, event]);

  const handleSave = async () => {
    if (!draft.summary.trim()) {
      setError('Give the meeting a title');
      return;
    }
    if (!draft.allDay && draft.endTime <= draft.startTime) {
      setError('End time must be after start time');
      return;
    }
    setError(null);
    try {
      await onSave(draft);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save meeting');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit meeting' : 'Schedule a meeting'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="meeting-title">Title</Label>
            <Input
              id="meeting-title"
              value={draft.summary}
              onChange={e => setDraft(d => ({ ...d, summary: e.target.value }))}
              placeholder="e.g. Site walkthrough with client"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="meeting-allday">All day</Label>
            <Switch
              id="meeting-allday"
              checked={draft.allDay}
              onCheckedChange={v => setDraft(d => ({ ...d, allDay: v }))}
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1.5 col-span-3">
              <Label htmlFor="meeting-date">Date</Label>
              <Input
                id="meeting-date"
                type="date"
                value={draft.date}
                onChange={e => setDraft(d => ({ ...d, date: e.target.value }))}
              />
            </div>
            {!draft.allDay && (
              <>
                <div className="space-y-1.5 col-span-3 sm:col-span-1">
                  <Label htmlFor="meeting-start">Starts</Label>
                  <Input
                    id="meeting-start"
                    type="time"
                    value={draft.startTime}
                    onChange={e => setDraft(d => ({ ...d, startTime: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5 col-span-3 sm:col-span-1">
                  <Label htmlFor="meeting-end">Ends</Label>
                  <Input
                    id="meeting-end"
                    type="time"
                    value={draft.endTime}
                    onChange={e => setDraft(d => ({ ...d, endTime: e.target.value }))}
                  />
                </div>
              </>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="meeting-location">Location (optional)</Label>
            <Input
              id="meeting-location"
              value={draft.location}
              onChange={e => setDraft(d => ({ ...d, location: e.target.value }))}
              placeholder="Site address, video link, etc."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="meeting-description">Notes (optional)</Label>
            <Textarea
              id="meeting-description"
              value={draft.description}
              onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
              className="min-h-[70px]"
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="gradient-primary text-primary-foreground">
            {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving</> : isEdit ? 'Save changes' : 'Schedule meeting'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
