import { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Loader2, AlertTriangle, TrendingUp, Clock, DollarSign, ShieldCheck, Users, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface Insight {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  category?: string;
}

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

export default function AIInsightsPanel() {
  const { tasks, projects, budgetItems, siteUpdates } = useData();
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<Insight[] | null>(null);

  const analyze = async () => {
    setLoading(true);
    try {
      const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
      const totalSpent = projects.reduce((s, p) => s + p.spent, 0);
      const approvals = budgetItems.filter((b) => b.status === 'pending').map((b) => ({
        title: `${b.category}: ${b.description}`,
        status: b.status,
      }));

      const { data, error } = await supabase.functions.invoke('ai-insights', {
        body: {
          tasks,
          approvals,
          budget: {
            total: totalBudget,
            spent: totalSpent,
            utilization: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
          },
          projects,
          siteUpdates,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setInsights((data as any)?.insights ?? []);
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to generate insights');
    } finally {
      setLoading(false);
    }
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
            <p className="text-xs text-muted-foreground">Risk and opportunity analysis across your portfolio</p>
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
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn('rounded-xl border border-border/60 bg-background/40 p-4 border-l-4', s.border)}
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
                {ins.category && (
                  <div className="text-[10px] text-muted-foreground mt-2 capitalize">{ins.category}</div>
                )}
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
          Click <span className="font-medium text-foreground">Analyze Project</span> to surface risks, blockers, and opportunities.
        </div>
      )}
    </motion.div>
  );
}