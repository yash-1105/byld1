import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Sparkles, ChevronLeft, ArrowUpRight, Stamp, HardHat, Package } from 'lucide-react';
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem,
} from '@/components/ui/command';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { getModel, parseAIJson, isAIConfigured } from '@/lib/ai';
import { compactContext, computePortfolioMetrics, type WorkspaceSlices } from '@/lib/aiContext';
import { navForRole } from './navConfig';

const GROUP_CAP = 50;

interface AIAnswer {
  answer: string;
  links: { label: string; path: string }[];
}

const answerSchema = {
  type: 'object',
  properties: {
    answer: { type: 'string' },
    links: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          path: { type: 'string' },
        },
        required: ['label', 'path'],
      },
    },
  },
  required: ['answer', 'links'],
};

export default function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    projects, tasks, siteUpdates, budgetItems,
    approvals, purchaseOrders, reimbursements, users, projectMembers,
  } = useData();

  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'search' | 'ask'>('search');
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState<AIAnswer | null>(null);
  const [askError, setAskError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setMode('search');
      setAnswer(null);
      setAskError(null);
      setAsking(false);
      requestIdRef.current++;
    }
  }, [open]);

  if (!user) return null;

  const nav = navForRole(user.role);
  const allowedPaths = new Set(nav.map(n => n.path));
  const projectName = (id: string) => projects.find(p => p.id === id)?.name ?? '';
  const go = (path: string) => { onOpenChange(false); navigate(path); };

  const validateLinks = (links: AIAnswer['links']) =>
    links.filter(l => {
      if (/^\/projects\/[\w-]+$/.test(l.path)) {
        const id = l.path.split('/')[2];
        return allowedPaths.has('/projects') && projects.some(p => p.id === id);
      }
      return allowedPaths.has(l.path);
    }).slice(0, 4);

  const ask = async (q: string) => {
    const requestId = ++requestIdRef.current;
    setMode('ask');
    setQuestion(q);
    setAnswer(null);
    setAskError(null);
    setAsking(true);
    try {
      const slices: WorkspaceSlices = {
        projects, tasks, siteUpdates, budgetItems,
        approvals, purchaseOrders, reimbursements, users, projectMembers,
      };
      const metrics = computePortfolioMetrics(slices);
      const compact = compactContext(slices);

      const prompt = `You are BYLD AI inside a construction project-management app, answering a quick search-bar
question for ${user.name} (role: ${user.role}). Answer the question using ONLY the data below, in
concise markdown, at most 120 words. Monetary amounts are USD base — repeat them as given, labeled
USD. Then provide 1-4 links to the records that support the answer. Allowed path formats ONLY:
/projects/{id} (use the exact project id from the data), /tasks, /approvals, /budget, /procurement,
/site-updates, /timeline, /team, /chat, /documents. Never invent ids. If the data cannot answer the
question, say so and return links: [].

QUESTION: ${q}

METRICS: ${JSON.stringify(metrics)}
DATA: ${JSON.stringify(compact)}`;

      const result = await getModel({ responseSchema: answerSchema }).generateContent(prompt);
      if (requestId !== requestIdRef.current) return;
      const parsed = parseAIJson<AIAnswer>(result.response.text());
      setAnswer({ answer: parsed.answer, links: validateLinks(parsed.links ?? []) });
    } catch {
      if (requestId !== requestIdRef.current) return;
      setAskError("Couldn't get an answer — try rephrasing");
    } finally {
      if (requestId === requestIdRef.current) setAsking(false);
    }
  };

  const backToSearch = () => {
    requestIdRef.current++;
    setMode('search');
    setAnswer(null);
    setAskError(null);
    setAsking(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      {mode === 'search' ? (
        <>
          <CommandInput
            placeholder="Search or ask anything…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {isAIConfigured() && query.trim().length > 0 && (
              <CommandGroup heading="Ask AI" forceMount>
                <CommandItem forceMount value={`ask-ai ${query}`} onSelect={() => ask(query.trim())}>
                  <Sparkles className="mr-2 h-4 w-4 text-primary" />
                  <span>Ask BYLD AI: <span className="font-medium">"{query.trim()}"</span></span>
                </CommandItem>
              </CommandGroup>
            )}
            <CommandGroup heading="Navigate">
              {nav.map(n => (
                <CommandItem key={n.path} value={`go ${n.label}`} onSelect={() => go(n.path)}>
                  <n.icon className="mr-2 h-4 w-4" />
                  {n.label}
                </CommandItem>
              ))}
            </CommandGroup>
            {projects.length > 0 && (
              <CommandGroup heading="Projects">
                {projects.slice(0, GROUP_CAP).map(p => (
                  <CommandItem key={p.id} value={`project ${p.name} ${p.status}`} onSelect={() => go(`/projects/${p.id}`)}>
                    {p.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {allowedPaths.has('/tasks') && tasks.length > 0 && (
              <CommandGroup heading="Tasks">
                {tasks.slice(0, GROUP_CAP).map(t => (
                  <CommandItem key={t.id} value={`task ${t.title} ${projectName(t.projectId)}`} onSelect={() => go('/tasks')}>
                    {t.title}
                    <span className="ml-auto text-xs text-muted-foreground">{projectName(t.projectId)}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {allowedPaths.has('/approvals') && approvals.length > 0 && (
              <CommandGroup heading="Approvals">
                {approvals.slice(0, GROUP_CAP).map(a => (
                  <CommandItem key={a.id} value={`approval ${a.title} ${a.status} ${projectName(a.projectId)}`} onSelect={() => go('/approvals')}>
                    <Stamp className="mr-2 h-4 w-4 text-muted-foreground" />
                    {a.title}
                    <span className="ml-auto text-xs text-muted-foreground capitalize">{a.status}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {allowedPaths.has('/site-updates') && siteUpdates.length > 0 && (
              <CommandGroup heading="Site Updates">
                {siteUpdates.slice(0, GROUP_CAP).map(u => (
                  <CommandItem key={u.id} value={`site update ${u.title} ${projectName(u.projectId)}`} onSelect={() => go('/site-updates')}>
                    <HardHat className="mr-2 h-4 w-4 text-muted-foreground" />
                    {u.title}
                    <span className="ml-auto text-xs text-muted-foreground">{projectName(u.projectId)}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {allowedPaths.has('/procurement') && purchaseOrders.length > 0 && (
              <CommandGroup heading="Purchase Orders">
                {purchaseOrders.slice(0, GROUP_CAP).map(po => (
                  <CommandItem key={po.id} value={`po ${po.item} ${po.supplierName} ${projectName(po.projectId)}`} onSelect={() => go('/procurement')}>
                    <Package className="mr-2 h-4 w-4 text-muted-foreground" />
                    {po.item}
                    <span className="ml-auto text-xs text-muted-foreground">{po.supplierName}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </>
      ) : (
        <div className="p-4 space-y-3 max-h-[420px] overflow-y-auto">
          <div className="flex items-center gap-2">
            <button
              onClick={backToSearch}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Back to search"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <Sparkles className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm font-medium truncate">{question}</span>
          </div>

          {asking && (
            <div className="space-y-2 pl-8">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          )}

          {!asking && askError && (
            <p className="text-sm text-destructive pl-8">{askError}</p>
          )}

          {!asking && answer && (
            <div className="pl-8 space-y-3">
              <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-ol:my-1">
                <ReactMarkdown>{answer.answer}</ReactMarkdown>
              </div>
              {answer.links.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {answer.links.map((l, i) => (
                    <Button key={i} variant="outline" size="sm" className="h-7 text-xs" onClick={() => go(l.path)}>
                      {l.label} <ArrowUpRight className="w-3 h-3" />
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </CommandDialog>
  );
}
