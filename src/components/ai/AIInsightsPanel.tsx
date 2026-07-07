import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Loader2, AlertTriangle, TrendingUp, Clock, DollarSign, ShieldCheck, Users, Lightbulb, ArrowUpRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getModel, parseAIJson } from '@/lib/ai';
import { compactContext, computePortfolioMetrics, dataFingerprint, type WorkspaceSlices } from '@/lib/aiContext';

interface Insight {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  category?: string;
  projectName?: string | null;
  recommendation?: string;
}

interface CachedInsights {
  generatedAt: string;
  fingerprint: string;
  insights: Insight[];
}

const STORAGE_PREFIX = 'byld.ai.insights.v1:';

const severityStyles: Record<string, { border: string; chip: string; dot: string }> = {
  high: { border: 'border-l-destructive', chip: 'bg-destructive/10 text-destructive', dot: 'bg-destructive' },
  medium: { border: 'border-l-warning', chip: 'bg-warning/10 text-warning', dot: 'bg-warning' },
  low: { border: 'border-l-primary', chip: 'bg-primary/10 text-primary', dot: 'bg-primary' },
};

const categoryIcon = (c?: string) => {
  switch (c) {
    case 'schedule': return Clock;
    case 'budget': return DollarSign;
    case 'quality': return ShieldCheck;
    case 'approval': return AlertTriangle;
    case 'resource': return Users;
    case 'opportunity': return Lightbulb;
    default: return TrendingUp;
  }
};

const responseSchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      description: { type: 'string' },
      severity: { type: 'string', enum: ['low', 'medium', 'high'] },
      category: { type: 'string', enum: ['schedule', 'budget', 'quality', 'approval', 'resource', 'opportunity', 'other'] },
      projectName: { type: 'string', nullable: true },
      recommendation: { type: 'string' },
    },
    required: ['title', 'description', 'severity', 'category', 'recommendation'],
  },
};

export default function AIInsightsPanel({ onNavigate }: { onNavigate?: () => void }) {
  const {
    projects, tasks, siteUpdates, budgetItems,
    approvals, purchaseOrders, reimbursements, users, projectMembers,
  } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [cached, setCached] = useState<CachedInsights | null>(null);

  const storageKey = user ? `${STORAGE_PREFIX}${user.id}` : null;

  const slices: WorkspaceSlices = {
    projects, tasks, siteUpdates, budgetItems,
    approvals, purchaseOrders, reimbursements, users, projectMembers,
  };
  const currentFingerprint = dataFingerprint(slices);

  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as CachedInsights;
        if (parsed && Array.isArray(parsed.insights)) {
          setCached(parsed);
          return;
        }
      }
    } catch {
      localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  const analyze = async () => {
    if (projects.length === 0) {
      toast.error('Not enough data to analyze — add a project first');
      return;
    }
    setLoading(true);
    try {
      const metrics = computePortfolioMetrics(slices);
      const compact = compactContext(slices);

      const model = getModel({ responseSchema });

      const prompt = `You are a construction risk analyst. Using the PRE-COMPUTED METRICS (authoritative —
do not recalculate any numbers) and supporting data, produce 3-6 insights that PREDICT problems
before they occur: schedule slippage risk (overdue + due-soon clustering), budget overrun trajectory
(utilization % vs progress %), approval bottlenecks (pending approvals older than 5 days),
procurement delivery risk, resource overload (one assignee holding many open tasks), and at most
one opportunity. Every insight must cite specific names and numbers from the data. Monetary amounts
are USD base — repeat them as given, labeled USD. projectName must exactly match a project name from
the data, or null for portfolio-wide insights. recommendation is one concrete next action. Severity:
high = money or deadline impact within 7 days.

METRICS: ${JSON.stringify(metrics)}
DATA: ${JSON.stringify(compact)}`;

      const result = await model.generateContent(prompt);
      const parsed = parseAIJson<Insight[]>(result.response.text());
      if (!Array.isArray(parsed)) throw new Error('Invalid response format');

      const next: CachedInsights = {
        generatedAt: new Date().toISOString(),
        fingerprint: currentFingerprint,
        insights: parsed,
      };
      setCached(next);
      if (storageKey) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          // quota exceeded — cache skipped
        }
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to generate insights');
    } finally {
      setLoading(false);
    }
  };

  const insights = cached?.insights ?? null;
  const isStale = !!cached && cached.fingerprint !== currentFingerprint;

  const projectFor = (name?: string | null) =>
    name ? projects.find(p => p.name.toLowerCase() === name.toLowerCase()) : undefined;

  const openProject = (id: string) => {
    onNavigate?.();
    navigate(`/projects/${id}`);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
            <Brain className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">AI Smart Insights</h3>
            <p className="text-xs text-muted-foreground">Predictive risk analysis across your portfolio</p>
          </div>
        </div>
        <Button onClick={analyze} disabled={loading} size="sm" className="gradient-primary text-primary-foreground h-9 text-xs">
          {loading ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing</>
          ) : insights ? (
            <><Brain className="w-3.5 h-3.5" /> Re-analyze</>
          ) : (
            <><Brain className="w-3.5 h-3.5" /> Analyze Project</>
          )}
        </Button>
      </div>

      {!loading && cached && (
        <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
          <span>Generated {formatDistanceToNow(new Date(cached.generatedAt), { addSuffix: true })}</span>
          {isStale && (
            <span className="px-2 py-0.5 rounded-full bg-warning/10 text-warning font-medium">
              Data changed since last analysis
            </span>
          )}
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-border/60 bg-background/40 p-4 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          ))}
        </div>
      )}

      {!loading && insights && insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {insights.map((ins, i) => {
            const s = severityStyles[ins.severity] ?? severityStyles.low;
            const Icon = categoryIcon(ins.category);
            const project = projectFor(ins.projectName);
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={project ? () => openProject(project.id) : undefined}
                className={cn(
                  'rounded-xl border border-border/60 bg-background/40 p-4 border-l-4',
                  s.border,
                  project && 'cursor-pointer hover:bg-background/70 transition-colors',
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <h4 className="font-semibold text-sm text-foreground leading-tight">{ins.title}</h4>
                  </div>
                  <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wide flex items-center gap-1', s.chip)}>
                    <span className={cn('w-1.5 h-1.5 rounded-full', s.dot)} />
                    {ins.severity}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{ins.description}</p>
                {ins.recommendation && (
                  <p className="text-xs text-foreground/80 leading-relaxed mt-2">
                    <span className="font-medium">Do next:</span> {ins.recommendation}
                  </p>
                )}
                <div className="flex items-center justify-between mt-2">
                  {ins.category && (
                    <div className="text-[10px] text-muted-foreground capitalize">{ins.category}</div>
                  )}
                  {project && (
                    <span className="text-[10px] text-primary flex items-center gap-0.5">
                      {project.name} <ArrowUpRight className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {!loading && insights && insights.length === 0 && (
        <div className="text-xs text-muted-foreground border border-dashed border-border rounded-xl p-4 text-center">
          No insights generated. Add more project data and try again.
        </div>
      )}

      {!loading && !insights && (
        <div className="text-xs text-muted-foreground border border-dashed border-border rounded-xl p-4 text-center">
          Click <span className="font-medium text-foreground">Analyze Project</span> to surface predicted risks, blockers, and opportunities.
        </div>
      )}
    </motion.div>
  );
}
