import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Sparkles, Loader2, Send, Copy, Calendar as CalendarIcon, RefreshCw, AlertTriangle } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { toast } from 'sonner';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getModel } from '@/lib/ai';
import { buildClientUpdateDigest, type WorkspaceSlices } from '@/lib/aiContext';
import { findProjectClients, sendClientUpdate } from '@/services/clientUpdateService';

type Range = '7d' | '14d' | 'custom';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultProjectId?: string;
}

const STORAGE_PREFIX = 'byld.ai.clientupdate.v1:';

export default function ClientUpdateComposer({ open, onOpenChange, defaultProjectId }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    projects, tasks, siteUpdates, budgetItems,
    approvals, purchaseOrders, reimbursements, users, projectMembers,
  } = useData();

  const [projectId, setProjectId] = useState(defaultProjectId ?? '');
  const [range, setRange] = useState<Range>('7d');
  const [from, setFrom] = useState<Date | undefined>();
  const [to, setTo] = useState<Date | undefined>();
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');
  const [clientId, setClientId] = useState('');
  const [littleActivity, setLittleActivity] = useState(false);

  useEffect(() => {
    if (open) setProjectId(prev => prev || defaultProjectId || projects[0]?.id || '');
  }, [open, defaultProjectId, projects]);

  const draftKey = user && projectId ? `${STORAGE_PREFIX}${user.id}:${projectId}` : null;

  // Restore an unsent draft for this project; clear the editor when switching projects.
  useEffect(() => {
    if (!draftKey) return;
    try {
      setDraft(localStorage.getItem(draftKey) ?? '');
    } catch {
      setDraft('');
    }
  }, [draftKey]);

  useEffect(() => {
    if (!draftKey) return;
    try {
      if (draft) localStorage.setItem(draftKey, draft);
      else localStorage.removeItem(draftKey);
    } catch {
      // quota exceeded — draft not persisted
    }
  }, [draft, draftKey]);

  const clients = useMemo(
    () => (projectId ? findProjectClients(projectId, users, projectMembers) : []),
    [projectId, users, projectMembers],
  );

  useEffect(() => {
    setClientId(prev => (clients.some(c => c.id === prev) ? prev : clients[0]?.id ?? ''));
  }, [clients]);

  const client = clients.find(c => c.id === clientId);
  const project = projects.find(p => p.id === projectId);

  const resolveRange = (): { fromDate: Date; toDate: Date } | null => {
    const now = new Date();
    if (range === '7d') return { fromDate: subDays(now, 7), toDate: now };
    if (range === '14d') return { fromDate: subDays(now, 14), toDate: now };
    if (from && to) return { fromDate: from, toDate: to };
    return null;
  };

  const generate = async () => {
    if (!projectId || !project) {
      toast.error('Pick a project first');
      return;
    }
    const r = resolveRange();
    if (!r) {
      toast.error('Pick both a start and end date');
      return;
    }
    setGenerating(true);
    setLittleActivity(false);
    try {
      const slices: WorkspaceSlices = {
        projects, tasks, siteUpdates, budgetItems,
        approvals, purchaseOrders, reimbursements, users, projectMembers,
      };
      const digest = buildClientUpdateDigest(slices, projectId, r.fromDate, r.toDate);
      if (!digest) throw new Error('Project not found');

      const isQuiet =
        digest.recentlyCompletedTasks.length + digest.siteUpdates.length + digest.budgetMovement.length === 0;
      setLittleActivity(isQuiet);

      const prompt = `You are writing a weekly progress update FROM the project team TO their client${client ? `, ${client.name}` : ''},
for the project "${project.name}" covering ${digest.range.from} to ${digest.range.to}.
The audience is a non-technical client: warm, confident, plain language, no jargon, no internal ids.
Structure exactly:
**Progress this week** (2-4 bullets) / **Coming up** (bullets with dates) /
**Budget** (one or two sentences; amounts are USD base — state them as given, labeled USD) /
**Needs your attention** (only if there are pending approvals; otherwise omit the section).
120-220 words total. No greeting line, no sign-off (the app adds those).
If the data shows little activity, say it was a quieter week and focus on what's next.

DATA: ${JSON.stringify(digest)}`;

      const result = await getModel().generateContent(prompt);
      setDraft(result.response.text().trim());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to generate update');
    } finally {
      setGenerating(false);
    }
  };

  const finalMessage = () => {
    const r = resolveRange();
    const rangeLabel = r ? `${format(r.fromDate, 'MMM d')} – ${format(r.toDate, 'MMM d')}` : '';
    return `**Weekly update — ${project?.name ?? ''}** (${rangeLabel})\n\n${draft.trim()}\n\n— ${user?.name ?? ''}`;
  };

  const copyDraft = async () => {
    try {
      await navigator.clipboard.writeText(finalMessage());
      toast.success('Update copied to clipboard');
    } catch {
      toast.error('Could not copy — select and copy manually');
    }
  };

  const send = async () => {
    if (!user || !projectId || !clientId || !draft.trim()) return;
    setSending(true);
    try {
      const convId = await sendClientUpdate(user.id, projectId, clientId, finalMessage());
      if (draftKey) localStorage.removeItem(draftKey);
      setDraft('');
      onOpenChange(false);
      toast.success(`Update sent to ${client?.name}`, {
        action: { label: 'Open chat', onClick: () => navigate(`/chat?conversation=${convId}`) },
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to send — your draft is saved');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> Client update
          </DialogTitle>
          <DialogDescription>
            AI drafts a progress summary from tasks, site updates, and budget — you review and send it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Setup */}
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="h-9 w-[200px] text-xs">
                <SelectValue placeholder="Project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={range} onValueChange={(v) => setRange(v as Range)}>
              <SelectTrigger className="h-9 w-[140px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">This week</SelectItem>
                <SelectItem value="14d">Last 14 days</SelectItem>
                <SelectItem value="custom">Custom range</SelectItem>
              </SelectContent>
            </Select>

            {range === 'custom' && (
              <>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn('h-9 text-xs', !from && 'text-muted-foreground')}>
                      <CalendarIcon className="w-3.5 h-3.5 mr-1.5" />
                      {from ? format(from, 'MMM d') : 'From'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={from} onSelect={setFrom} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn('h-9 text-xs', !to && 'text-muted-foreground')}>
                      <CalendarIcon className="w-3.5 h-3.5 mr-1.5" />
                      {to ? format(to, 'MMM d') : 'To'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={to} onSelect={setTo} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </>
            )}

            <Button onClick={generate} disabled={generating || !projectId} size="sm" className="gradient-primary text-primary-foreground h-9 text-xs">
              {generating ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Drafting</>
              ) : draft ? (
                <><RefreshCw className="w-3.5 h-3.5" /> Regenerate</>
              ) : (
                <><Sparkles className="w-3.5 h-3.5" /> Generate draft</>
              )}
            </Button>
          </div>

          {/* Recipient */}
          {projectId && (
            clients.length === 0 ? (
              <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                No client is on this project's team — you can still copy the draft.
              </div>
            ) : clients.length === 1 ? (
              <p className="text-xs text-muted-foreground">
                Will be sent to <span className="font-medium text-foreground">{clients[0].name}</span> via chat.
              </p>
            ) : (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                Send to
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger className="h-8 w-[180px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                via chat
              </div>
            )
          )}

          {littleActivity && draft && (
            <p className="text-xs text-muted-foreground">Little activity found in this range — the draft focuses on what's next.</p>
          )}

          {/* Draft */}
          {generating && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          )}

          {!generating && draft && (
            <Tabs defaultValue="edit">
              <TabsList className="h-8">
                <TabsTrigger value="edit" className="text-xs">Edit</TabsTrigger>
                <TabsTrigger value="preview" className="text-xs">Preview</TabsTrigger>
              </TabsList>
              <TabsContent value="edit">
                <Textarea
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  className="min-h-[280px] text-sm font-mono"
                />
              </TabsContent>
              <TabsContent value="preview">
                <div className="rounded-xl border border-border/60 bg-background/40 p-4 min-h-[280px]">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{finalMessage()}</ReactMarkdown>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}

          {!generating && !draft && (
            <div className="text-xs text-muted-foreground border border-dashed border-border rounded-xl p-6 text-center">
              Pick a project and range, then click <span className="font-medium text-foreground">Generate draft</span>.
            </div>
          )}

          {/* Actions */}
          {draft && !generating && (
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" className="h-9 text-xs" onClick={copyDraft}>
                <Copy className="w-3.5 h-3.5" /> Copy
              </Button>
              <Button
                size="sm"
                className="gradient-primary text-primary-foreground h-9 text-xs"
                disabled={!client || sending || !draft.trim()}
                onClick={send}
              >
                {sending ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending</>
                ) : (
                  <><Send className="w-3.5 h-3.5" /> Send to {client?.name ?? 'client'}</>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
