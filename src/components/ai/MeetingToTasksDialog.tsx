import { useEffect, useMemo, useState } from 'react';
import { NotebookPen, Loader2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useData } from '@/contexts/DataContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getModel, parseAIJson } from '@/lib/ai';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultProjectId?: string;
}

interface RawExtractedTask {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeName?: string | null;
  deadline?: string | null;
}

interface ExtractedTask {
  include: boolean;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId: string;
  unmatchedName: string | null;
  deadline: string;
  expanded: boolean;
}

const responseSchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      description: { type: 'string' },
      priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
      assigneeName: { type: 'string', nullable: true },
      deadline: { type: 'string', nullable: true },
    },
    required: ['title', 'priority'],
  },
};

const isValidDate = (s?: string | null) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s).getTime());

export default function MeetingToTasksDialog({ open, onOpenChange, defaultProjectId }: Props) {
  const { projects, users, projectMembers, addTask } = useData();
  const [projectId, setProjectId] = useState(defaultProjectId ?? '');
  const [notes, setNotes] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedTask[] | null>(null);

  useEffect(() => {
    if (open) setProjectId(prev => prev || defaultProjectId || projects[0]?.id || '');
  }, [open, defaultProjectId, projects]);

  const roster = useMemo(() => {
    const memberIds = new Set(
      projectMembers.filter(m => m.project_id === projectId).map(m => m.user_id),
    );
    return users
      .filter(u => memberIds.has(u.id) && u.role !== 'client')
      .map(u => ({ id: u.id, name: u.full_name || u.email || 'Member', role: u.role }));
  }, [projectId, users, projectMembers]);

  const resolveAssignee = (name?: string | null): { id: string; unmatched: string | null } => {
    if (!name) return { id: '', unmatched: null };
    const lower = name.toLowerCase().trim();
    const exact = roster.find(m => m.name.toLowerCase() === lower);
    if (exact) return { id: exact.id, unmatched: null };
    const firstNameMatches = roster.filter(m => m.name.toLowerCase().split(/\s+/)[0] === lower.split(/\s+/)[0]);
    if (firstNameMatches.length === 1) return { id: firstNameMatches[0].id, unmatched: null };
    return { id: '', unmatched: name };
  };

  const extract = async () => {
    if (!notes.trim() || !projectId) return;
    setExtracting(true);
    try {
      const teamForPrompt = roster.map(m => ({ name: m.name, role: m.role }));
      const now = new Date();

      const prompt = `Extract every concrete action item from these construction-project meeting notes.
Today is ${format(now, 'yyyy-MM-dd')} (${format(now, 'EEEE')}) — resolve relative dates ("by Friday",
"next week") to absolute YYYY-MM-DD dates. Only assign a person if the notes clearly name someone;
assigneeName must exactly match a TEAM name below, or be null. Do not invent tasks that are not in
the notes. Decisions and FYIs are not tasks. title is imperative and at most 80 characters;
description carries useful context from the notes (may be empty). priority is 'urgent' only if the
notes say ASAP or blocking.

TEAM: ${JSON.stringify(teamForPrompt)}
NOTES:
"""${notes}"""`;

      const result = await getModel({ responseSchema }).generateContent(prompt);
      const parsed = parseAIJson<RawExtractedTask[]>(result.response.text());
      if (!Array.isArray(parsed)) throw new Error('Invalid response format');

      setExtracted(parsed.map(t => {
        const { id, unmatched } = resolveAssignee(t.assigneeName);
        return {
          include: true,
          title: (t.title || '').slice(0, 120),
          description: t.description || '',
          priority: (['low', 'medium', 'high', 'urgent'] as const).includes(t.priority) ? t.priority : 'medium',
          assigneeId: id,
          unmatchedName: unmatched,
          deadline: isValidDate(t.deadline) ? t.deadline! : '',
          expanded: false,
        };
      }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to extract tasks — try again');
    } finally {
      setExtracting(false);
    }
  };

  const updateRow = (i: number, patch: Partial<ExtractedTask>) =>
    setExtracted(prev => prev?.map((t, idx) => (idx === i ? { ...t, ...patch } : t)) ?? null);

  const included = extracted?.filter(t => t.include && t.title.trim()) ?? [];

  const createTasks = async () => {
    if (!included.length || !projectId) return;
    setCreating(true);
    let created = 0;
    const failed: string[] = [];
    for (const t of included) {
      try {
        await addTask({
          title: t.title.trim(),
          description: t.description,
          status: 'todo',
          priority: t.priority,
          assignee: t.assigneeId,
          projectId,
          deadline: t.deadline,
        });
        created++;
      } catch {
        failed.push(t.title);
      }
    }
    setCreating(false);
    if (created > 0) toast.success(`Created ${created} task${created === 1 ? '' : 's'}`);
    if (failed.length) {
      toast.error(`Failed to create: ${failed.join(', ')}`);
      setExtracted(prev => prev?.filter(t => t.include && failed.includes(t.title)) ?? null);
    } else {
      setExtracted(null);
      setNotes('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <NotebookPen className="w-4 h-4 text-primary" /> Meeting notes to tasks
          </DialogTitle>
          <DialogDescription>
            Paste your meeting notes — AI extracts action items with assignees and deadlines for you to review.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="h-9 w-[220px] text-xs">
                <SelectValue placeholder="Project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={extract}
              disabled={extracting || !notes.trim() || !projectId}
              size="sm"
              className="gradient-primary text-primary-foreground h-9 text-xs"
            >
              {extracting ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Extracting</>
              ) : (
                <><Sparkles className="w-3.5 h-3.5" /> Extract action items</>
              )}
            </Button>
          </div>

          <Textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder={'Paste meeting notes…\n\ne.g. "Discussed kitchen tiling — Ravi to order grout by Friday. Priya will chase the electrical approval, it\'s blocking. Decided to keep the walnut finish."'}
            className="min-h-[160px] text-sm"
          />

          {extracted && extracted.length === 0 && (
            <div className="text-xs text-muted-foreground border border-dashed border-border rounded-xl p-4 text-center">
              No action items found in these notes.
            </div>
          )}

          {extracted && extracted.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Review the extracted tasks — untick anything that shouldn't be created.
              </p>
              {extracted.map((t, i) => (
                <div key={i} className="rounded-xl border border-border/60 bg-background/40 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={t.include}
                      onCheckedChange={v => updateRow(i, { include: !!v })}
                    />
                    <Input
                      value={t.title}
                      onChange={e => updateRow(i, { title: e.target.value })}
                      className="h-8 text-sm flex-1"
                    />
                    <button
                      onClick={() => updateRow(i, { expanded: !t.expanded })}
                      className="text-muted-foreground hover:text-foreground p-1"
                      title={t.expanded ? 'Hide details' : 'Show details'}
                    >
                      {t.expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap pl-6">
                    <Select value={t.priority} onValueChange={v => updateRow(i, { priority: v as ExtractedTask['priority'] })}>
                      <SelectTrigger className="h-8 w-[110px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(['low', 'medium', 'high', 'urgent'] as const).map(p => (
                          <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={t.assigneeId || 'unassigned'}
                      onValueChange={v => updateRow(i, { assigneeId: v === 'unassigned' ? '' : v, unmatchedName: null })}
                    >
                      <SelectTrigger className="h-8 w-[160px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {roster.map(m => (
                          <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {t.unmatchedName && (
                      <span className="text-[10px] text-warning">(unmatched: {t.unmatchedName})</span>
                    )}
                    <Input
                      type="date"
                      value={t.deadline}
                      onChange={e => updateRow(i, { deadline: e.target.value })}
                      className="h-8 w-[140px] text-xs"
                    />
                  </div>
                  {t.expanded && (
                    <div className="pl-6">
                      <Textarea
                        value={t.description}
                        onChange={e => updateRow(i, { description: e.target.value })}
                        placeholder="Description"
                        className="min-h-[60px] text-xs"
                      />
                    </div>
                  )}
                </div>
              ))}
              <div className="flex justify-end">
                <Button
                  onClick={createTasks}
                  disabled={creating || included.length === 0}
                  size="sm"
                  className="gradient-primary text-primary-foreground h-9 text-xs"
                >
                  {creating ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Creating</>
                  ) : (
                    <>Create {included.length} task{included.length === 1 ? '' : 's'}</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
