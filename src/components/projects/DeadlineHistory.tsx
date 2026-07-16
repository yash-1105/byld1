import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, X, Check, CalendarClock } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useData } from '@/contexts/DataContext';
import { formatDeadline } from '@/lib/utils';

interface Revision {
  id: string;
  project_id: string;
  previous_deadline: string;
  new_deadline: string;
  reason: string | null;
  changed_by: string | null;
  changed_at: string;
}

interface Props {
  projectId: string;
  currentDeadline: string;
  /** True only for architects — controls the edit affordance. History is visible to everyone. */
  canEdit: boolean;
  /** Compact card variant: deadline text + a "Revised" indicator only, no expand / no edit form. */
  compact?: boolean;
}

// A stored deadline is the first of a month ("2026-03-01"); the <input type="month"> wants "YYYY-MM".
function toMonthValue(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return format(d, 'yyyy-MM');
}

export default function DeadlineHistory({ projectId, currentDeadline, canEdit, compact = false }: Props) {
  const { users, reviseDeadline } = useData();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [monthValue, setMonthValue] = useState(() => toMonthValue(currentDeadline));
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: revisions = [] } = useQuery({
    queryKey: ['project_deadline_revisions', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_deadline_revisions')
        .select('*')
        .eq('project_id', projectId)
        .order('changed_at', { ascending: true });
      // Swallow "table does not exist" so the page still renders before the migration is applied.
      if (error && (error as { code?: string }).code !== '42P01') throw error;
      return (data || []) as Revision[];
    },
    enabled: !!projectId,
  });

  const hasHistory = revisions.length > 0;
  // The original deadline is whatever the first revision changed *away from*.
  const originalDeadline = hasHistory ? revisions[0].previous_deadline : currentDeadline;

  const nameOf = (id: string | null) => {
    const u = users.find((x: { id: string }) => x.id === id);
    return u?.full_name || u?.email || 'Unknown';
  };
  const roleOf = (id: string | null) => {
    const u = users.find((x: { id: string }) => x.id === id) as { role?: string } | undefined;
    return u?.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : '';
  };

  const openEditor = () => {
    setMonthValue(toMonthValue(currentDeadline));
    setReason('');
    setEditing(true);
  };

  const handleSave = async () => {
    if (!monthValue) { toast.error('Pick a month'); return; }
    const newDeadline = `${monthValue}-01`;
    if (newDeadline === currentDeadline) { toast.error("That's already the current deadline"); return; }
    setSaving(true);
    try {
      // Centralized in DataContext: records the revision, updates projects.end_date,
      // and emails the client(s) — all in one place, mirroring addApproval.
      await reviseDeadline(projectId, newDeadline, reason.trim() || undefined);
      await queryClient.invalidateQueries({ queryKey: ['project_deadline_revisions', projectId] });
      toast.success('Deadline revised');
      setEditing(false);
      setReason('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to revise deadline');
    } finally {
      setSaving(false);
    }
  };

  const revisedPill = hasHistory && (
    <span
      className="text-[10px] px-1.5 py-0.5 rounded-full bg-warning/10 text-warning font-medium"
      title={`Deadline revised ${revisions.length} time${revisions.length === 1 ? '' : 's'}`}
    >
      Revised
    </span>
  );

  // ── Compact (project-card) variant ───────────────────────────────
  if (compact) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span>{formatDeadline(currentDeadline)}</span>
        {revisedPill}
      </span>
    );
  }

  // ── Full variant (project detail) ────────────────────────────────
  return (
    <div className="soft-card p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <CalendarClock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Project Deadline</p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xl font-bold text-foreground">{formatDeadline(currentDeadline)}</p>
              {hasHistory && (
                <button
                  onClick={() => setExpanded(e => !e)}
                  className="text-[10px] px-1.5 py-0.5 rounded-full bg-warning/10 text-warning font-medium hover:bg-warning/20 transition-colors"
                  title="Show revision history"
                >
                  Revised · {revisions.length}
                </button>
              )}
            </div>
          </div>
        </div>
        {canEdit && !editing && (
          <button
            onClick={openEditor}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary px-3 py-1.5 rounded-lg border border-border hover:border-primary/30 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" /> Revise
          </button>
        )}
      </div>

      {/* Inline edit form (architect only) */}
      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="mt-4 pt-4 border-t border-border/50 flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground px-1">New deadline</label>
                  <input
                    type="month"
                    value={monthValue}
                    onChange={e => setMonthValue(e.target.value)}
                    className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground px-1">Reason for change (optional)</label>
                  <input
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="e.g. Client-requested scope addition"
                    className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="gradient-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-60 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-muted-foreground hover:text-foreground flex items-center gap-1.5"
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full revision trail — visible to everyone, including clients */}
      <AnimatePresence>
        {expanded && hasHistory && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/40 mt-1.5 shrink-0" />
                <p className="text-sm text-foreground">
                  <span className="text-muted-foreground">Original:</span> {formatDeadline(originalDeadline)}
                </p>
              </div>
              {revisions.map(r => (
                <div key={r.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-warning mt-1.5 shrink-0" />
                  <div>
                    <p className="text-sm text-foreground">
                      Revised to <span className="font-medium">{formatDeadline(r.new_deadline)}</span>
                      <span className="text-muted-foreground">
                        {' '}— by {nameOf(r.changed_by)}{roleOf(r.changed_by) ? ` (${roleOf(r.changed_by)})` : ''}, {format(new Date(r.changed_at), 'MMM d yyyy')}
                      </span>
                    </p>
                    {r.reason && <p className="text-xs text-muted-foreground italic mt-0.5">“{r.reason}”</p>}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
