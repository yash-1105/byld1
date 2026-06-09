import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { CheckSquare, Clock, AlertTriangle, Camera, ArrowUpRight, Zap, BarChart3, TrendingUp, CheckCircle, Circle, Truck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Link } from 'react-router-dom';

const fadeIn = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

const PRIORITY_CONFIG = {
  urgent: { label: 'Urgent',  color: 'text-destructive', bg: 'bg-destructive/10', dot: 'bg-destructive' },
  high:   { label: 'High',    color: 'text-warning',     bg: 'bg-warning/10',     dot: 'bg-warning' },
  medium: { label: 'Medium',  color: 'text-primary',     bg: 'bg-primary/10',     dot: 'bg-primary' },
  low:    { label: 'Low',     color: 'text-muted-foreground', bg: 'bg-muted',     dot: 'bg-muted-foreground' },
};

const STATUS_STYLE = {
  todo:        'bg-muted text-muted-foreground',
  in_progress: 'bg-primary/10 text-primary',
  review:      'bg-warning/10 text-warning',
  done:        'bg-success/10 text-success',
};

export default function ContractorDashboard() {
  const { tasks, siteUpdates, projects, purchaseOrders } = useData();
  const { user } = useAuth();

  const today = new Date();
  const hour = today.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const myTasks = tasks.filter(t => t.assignee === user?.id);
  const pending   = myTasks.filter(t => t.status !== 'done');
  const urgent    = myTasks.filter(t => t.priority === 'urgent' && t.status !== 'done');
  const done      = myTasks.filter(t => t.status === 'done');
  const inReview  = myTasks.filter(t => t.status === 'review');
  const completionRate = myTasks.length > 0 ? Math.round((done.length / myTasks.length) * 100) : 0;

  const weekAhead = new Date(today.getTime() + 7 * 86400000);
  const dueThisWeek = pending.filter(t => t.deadline && new Date(t.deadline) <= weekAhead);
  const overdue     = pending.filter(t => t.deadline && new Date(t.deadline) < today);

  // Procurement: orders committed but not yet delivered
  const projectIds = new Set(projects.map(p => p.id));
  const pendingDeliveries = purchaseOrders.filter(po =>
    projectIds.has(po.projectId) && ['approved', 'ordered', 'in_transit'].includes(po.status));
  const overdueDeliveries = pendingDeliveries.filter(po =>
    po.expectedDelivery && new Date(po.expectedDelivery) < today);

  const stats = [
    {
      label: 'Pending Tasks', value: pending.length,
      icon: Clock,
      color: pending.length > 0 ? 'text-warning' : 'text-success',
      bg:    pending.length > 0 ? 'bg-warning/10'  : 'bg-success/10',
      sub: `${dueThisWeek.length} due this week`,
    },
    {
      label: 'Urgent', value: urgent.length,
      icon: AlertTriangle,
      color: urgent.length > 0 ? 'text-destructive' : 'text-success',
      bg:    urgent.length > 0 ? 'bg-destructive/10' : 'bg-success/10',
      sub: urgent.length > 0 ? 'Requires immediate action' : 'None flagged',
    },
    {
      label: 'Completed', value: done.length,
      icon: CheckSquare, color: 'text-success', bg: 'bg-success/10',
      sub: `${completionRate}% completion rate`,
    },
    {
      label: 'Site Updates', value: siteUpdates.length,
      icon: Camera, color: 'text-primary', bg: 'bg-primary/10',
      sub: `${siteUpdates.filter(u => {
        const d = new Date(u.createdAt);
        return d >= new Date(today.getTime() - 7 * 86400000);
      }).length} this week`,
    },
    {
      label: 'Pending Deliveries', value: pendingDeliveries.length,
      icon: Truck,
      color: overdueDeliveries.length > 0 ? 'text-destructive' : pendingDeliveries.length > 0 ? 'text-warning' : 'text-success',
      bg:    overdueDeliveries.length > 0 ? 'bg-destructive/10' : pendingDeliveries.length > 0 ? 'bg-warning/10' : 'bg-success/10',
      sub: overdueDeliveries.length > 0 ? `${overdueDeliveries.length} overdue` : 'On track',
    },
  ];

  // Group tasks by priority for display
  const tasksByPriority = (['urgent', 'high', 'medium', 'low'] as const).map(p => ({
    priority: p,
    tasks: pending.filter(t => t.priority === p),
  })).filter(g => g.tasks.length > 0);

  // Task progress bar data by project
  const myProjectIds = [...new Set(myTasks.map(t => t.projectId))];
  const projectProgress = myProjectIds.map(pid => {
    const proj = projects.find(p => p.id === pid);
    const pTasks = myTasks.filter(t => t.projectId === pid);
    const pDone  = pTasks.filter(t => t.status === 'done').length;
    return {
      name: proj?.name?.split(' ').slice(0, 2).join(' ') || 'Unknown',
      Done:    pDone,
      Pending: pTasks.length - pDone,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide">
          {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <h1 className="text-2xl font-bold text-foreground mt-0.5">
          {greeting}, {user?.name?.split(' ')[0] || 'Contractor'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {pending.length > 0
            ? `${pending.length} task${pending.length !== 1 ? 's' : ''} pending${overdue.length > 0 ? ` · ${overdue.length} overdue` : ''}`
            : 'No pending tasks — great work!'}
        </p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} {...fadeIn} transition={{ delay: i * 0.05 }} className="glass-card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{s.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1.5">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Overdue alert */}
      {overdue.length > 0 && (
        <motion.div {...fadeIn} transition={{ delay: 0.1 }} className="glass-card p-4 border border-destructive/20">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-destructive" />
            <span className="text-sm font-semibold text-foreground">
              {overdue.length} overdue task{overdue.length !== 1 ? 's' : ''} — action needed
            </span>
          </div>
          <div className="space-y-2">
            {overdue.slice(0, 3).map(t => {
              const project = projects.find(p => p.id === t.projectId);
              const daysLate = Math.abs(Math.ceil((new Date(t.deadline).getTime() - today.getTime()) / 86400000));
              return (
                <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-destructive/5 border border-destructive/10">
                  <div className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{t.title}</div>
                    <div className="text-xs text-muted-foreground">{project?.name}</div>
                  </div>
                  <span className="text-xs text-destructive font-medium shrink-0">{daysLate}d late</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* My Task Queue + Progress chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Task Queue by priority */}
        <motion.div {...fadeIn} transition={{ delay: 0.15 }} className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> My Task Queue
            </h3>
            <Link to="/tasks" className="text-xs text-primary hover:underline flex items-center gap-1">
              All tasks <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          {tasksByPriority.length > 0 ? (
            <div className="space-y-4">
              {tasksByPriority.map(({ priority, tasks: ptasks }) => {
                const cfg = PRIORITY_CONFIG[priority];
                return (
                  <div key={priority}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                      <span className={`text-xs font-semibold uppercase tracking-wide ${cfg.color}`}>{cfg.label}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{ptasks.length} task{ptasks.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="space-y-1.5">
                      {ptasks.slice(0, 3).map(t => (
                        <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 border border-border/40 hover:bg-muted/50 transition-colors">
                          <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot} shrink-0`} />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-foreground truncate">{t.title}</div>
                            {t.deadline && (
                              <div className="text-xs text-muted-foreground">
                                Due {new Date(t.deadline).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 capitalize ${STATUS_STYLE[t.status]}`}>
                            {t.status.replace('_', ' ')}
                          </span>
                        </div>
                      ))}
                      {ptasks.length > 3 && (
                        <p className="text-xs text-muted-foreground pl-4">+{ptasks.length - 3} more</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-32 flex flex-col items-center justify-center text-center bg-muted/20 rounded-xl border border-dashed border-border">
              <CheckCircle className="w-8 h-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No tasks in your queue.</p>
            </div>
          )}

          {/* Completion rate */}
          {myTasks.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border/40">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>Overall completion</span>
                <span className="font-semibold text-foreground">{completionRate}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full gradient-primary rounded-full" style={{ width: `${completionRate}%` }} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
                <span>{done.length} done</span>
                <span>{inReview.length} in review</span>
                <span>{pending.length} pending</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Tasks per Project */}
        <motion.div {...fadeIn} transition={{ delay: 0.2 }} className="glass-card p-5">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" /> My Work by Project
          </h3>
          {projectProgress.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={projectProgress} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(33 18% 88%)" />
                <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid hsl(36 20% 90%)' }}
                  cursor={{ fill: 'hsl(33 18% 96%)' }}
                />
                <Bar dataKey="Done"    fill="hsl(150,35%,55%)" radius={[0,4,4,0]} maxBarSize={20} stackId="a" />
                <Bar dataKey="Pending" fill="hsl(30,25%,62%)"  radius={[0,4,4,0]} maxBarSize={20} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
              No projects assigned yet.
            </div>
          )}
          {projectProgress.length > 0 && (
            <div className="flex items-center justify-center gap-6 mt-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-2.5 h-2.5 rounded-full bg-[hsl(150,35%,55%)]" /> Done
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-2.5 h-2.5 rounded-full bg-[hsl(30,25%,62%)]" /> Pending
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent Site Updates */}
      <motion.div {...fadeIn} transition={{ delay: 0.3 }} className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Recent Site Updates</h3>
          <Link to="/site-updates" className="text-xs text-primary hover:underline flex items-center gap-1">
            View all <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
        {siteUpdates.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {siteUpdates.slice(0, 4).map(u => (
              <div key={u.id} className="p-3.5 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    u.type === 'milestone' ? 'bg-success' : u.type === 'issue' ? 'bg-destructive' : 'bg-primary'
                  }`} />
                  <span className={`text-xs capitalize px-1.5 py-0.5 rounded font-medium ${
                    u.type === 'milestone' ? 'bg-success/10 text-success' :
                    u.type === 'issue' ? 'bg-destructive/10 text-destructive' :
                    'bg-primary/10 text-primary'
                  }`}>{u.type}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{new Date(u.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="text-sm font-medium text-foreground">{u.title}</div>
                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{u.description}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground text-center py-6 border border-dashed border-border rounded-xl">
            No site updates yet.
          </div>
        )}
      </motion.div>
    </div>
  );
}
