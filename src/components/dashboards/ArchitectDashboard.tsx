import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FolderKanban, CheckSquare, DollarSign, AlertTriangle, ArrowUpRight,
  CheckCircle, XCircle, Activity, ClipboardCheck, Layers, TrendingUp,
  Users, Zap, Target, Building2, AlertCircle, Calendar, BarChart3, Truck
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Legend } from 'recharts';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const fadeIn = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  planning:     { label: 'Planning',     color: 'text-blue-600',          bg: 'bg-blue-50' },
  design:       { label: 'Design',       color: 'text-primary',           bg: 'bg-primary/10' },
  approval:     { label: 'Approval',     color: 'text-warning',           bg: 'bg-warning/10' },
  construction: { label: 'Construction', color: 'text-orange-600',        bg: 'bg-orange-50' },
  finishing:    { label: 'Finishing',    color: 'text-success',           bg: 'bg-success/10' },
  completed:    { label: 'Completed',    color: 'text-muted-foreground',  bg: 'bg-muted' },
};

const WORKFLOW_STAGES = ['Planning', 'Design', 'Approval', 'Construction', 'Finishing'];
const STAGE_MAP: Record<string, number> = { planning: 0, design: 1, approval: 2, construction: 3, finishing: 4, completed: 5 };
const STATUS_COLORS = ['hsl(220,15%,70%)', 'hsl(30,25%,62%)', 'hsl(38,70%,65%)', 'hsl(150,35%,55%)'];

export default function ArchitectDashboard() {
  const { projects, tasks, siteUpdates, approvals, purchaseOrders, updateApproval } = useData();
  const { user } = useAuth();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');

  const today = new Date();
  const hour = today.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const fp = selectedProjectId === 'all' ? projects : projects.filter(p => p.id === selectedProjectId);
  const ft = selectedProjectId === 'all' ? tasks : tasks.filter(t => t.projectId === selectedProjectId);
  const fu = selectedProjectId === 'all' ? siteUpdates : siteUpdates.filter(u => u.projectId === selectedProjectId);

  const totalBudget = fp.reduce((s, p) => s + p.budget, 0);
  const totalSpent  = fp.reduce((s, p) => s + p.spent, 0);
  const budgetPct   = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  const tasksDone   = ft.filter(t => t.status === 'done').length;
  const overdueTasks = ft.filter(t => t.status !== 'done' && t.deadline && new Date(t.deadline) < today).length;
  const activeProjects = fp.filter(p => p.status !== 'completed').length;
  const pendingApprovals = approvals.filter(a =>
    a.status === 'pending' &&
    (selectedProjectId === 'all' || a.projectId === selectedProjectId)
  );
  const urgentTasks = ft.filter(t => t.priority === 'urgent' && t.status !== 'done');
  const pendingDeliveries = purchaseOrders.filter(po =>
    (selectedProjectId === 'all' || po.projectId === selectedProjectId) &&
    ['approved', 'ordered', 'in_transit'].includes(po.status));
  const overdueDeliveries = pendingDeliveries.filter(po =>
    po.expectedDelivery && new Date(po.expectedDelivery) < today);

  const weekAhead = new Date(today.getTime() + 7 * 86400000);
  const dueSoon = ft.filter(t =>
    t.status !== 'done' && t.deadline &&
    new Date(t.deadline) >= today && new Date(t.deadline) <= weekAhead &&
    !urgentTasks.find(u => u.id === t.id)
  );

  const attentionItems = [...urgentTasks, ...dueSoon].slice(0, 5);

  const stats = [
    {
      label: 'Active Projects', value: activeProjects,
      icon: FolderKanban, color: 'text-primary', bg: 'bg-primary/10',
      sub: `${fp.filter(p => p.status === 'completed').length} completed`,
    },
    {
      label: 'Tasks Complete', value: `${tasksDone}/${ft.length}`,
      icon: CheckSquare, color: 'text-success', bg: 'bg-success/10',
      sub: `${ft.length - tasksDone} remaining`,
    },
    {
      label: 'Budget Utilized', value: `${budgetPct}%`,
      icon: DollarSign,
      color: budgetPct > 85 ? 'text-destructive' : 'text-warning',
      bg:    budgetPct > 85 ? 'bg-destructive/10' : 'bg-warning/10',
      sub: `$${((totalBudget - totalSpent) / 1000000).toFixed(1)}M remaining`,
    },
    {
      label: 'Overdue Tasks', value: overdueTasks,
      icon: AlertTriangle,
      color: overdueTasks > 0 ? 'text-destructive' : 'text-success',
      bg:    overdueTasks > 0 ? 'bg-destructive/10' : 'bg-success/10',
      sub: overdueTasks > 0 ? 'Needs attention' : 'All on schedule',
    },
    {
      label: 'Pending Deliveries', value: pendingDeliveries.length,
      icon: Truck,
      color: overdueDeliveries.length > 0 ? 'text-destructive' : pendingDeliveries.length > 0 ? 'text-warning' : 'text-success',
      bg:    overdueDeliveries.length > 0 ? 'bg-destructive/10' : pendingDeliveries.length > 0 ? 'bg-warning/10' : 'bg-success/10',
      sub: overdueDeliveries.length > 0 ? `${overdueDeliveries.length} overdue` : 'On track',
    },
  ];

  const handleApproval = (id: string, action: 'approved' | 'rejected') => {
    updateApproval(id, {
      status: action,
      decidedBy: user?.id,
      decidedAt: new Date().toISOString(),
    });
    toast.success(`Approval ${action}`);
  };

  const timeline = [
    ...fu.map(u => ({
      id: u.id,
      time: new Date(u.createdAt).toLocaleDateString(),
      ts: new Date(u.createdAt).getTime(),
      event: `Update: ${u.title}`,
      project: projects.find(p => p.id === u.projectId)?.name || '',
      type: 'info' as const,
    })),
    ...ft.slice(0, 6).map(t => ({
      id: `t-${t.id}`,
      time: new Date(t.createdAt).toLocaleDateString(),
      ts: new Date(t.createdAt).getTime(),
      event: `Task created: ${t.title}`,
      project: projects.find(p => p.id === t.projectId)?.name || '',
      type: t.priority === 'urgent' ? 'error' as const : 'success' as const,
    })),
  ].sort((a, b) => b.ts - a.ts).slice(0, 6);

  const tasksByStatus = [
    { name: 'To Do',       value: ft.filter(t => t.status === 'todo').length },
    { name: 'In Progress', value: ft.filter(t => t.status === 'in_progress').length },
    { name: 'Review',      value: ft.filter(t => t.status === 'review').length },
    { name: 'Done',        value: ft.filter(t => t.status === 'done').length },
  ];

  const budgetByProject = fp.map(p => ({
    name: p.name.split(' ').slice(0, 2).join(' '),
    Budget: +(p.budget / 1000000).toFixed(2),
    Spent:  +(p.spent  / 1000000).toFixed(2),
    pct: p.budget > 0 ? Math.round((p.spent / p.budget) * 100) : 0,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{dateStr}</p>
          <h1 className="text-2xl font-bold text-foreground mt-0.5">
            {greeting}, {user?.name?.split(' ')[0] || 'Architect'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {activeProjects} active {activeProjects === 1 ? 'project' : 'projects'}
            {overdueTasks > 0
              ? ` · ${overdueTasks} overdue task${overdueTasks > 1 ? 's' : ''}`
              : ' · all tasks on track'}
            {pendingApprovals.length > 0 ? ` · ${pendingApprovals.length} pending approval${pendingApprovals.length !== 1 ? 's' : ''}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedProjectId}
            onChange={e => setSelectedProjectId(e.target.value)}
            className="bg-background border rounded-xl px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <Link to="/projects" className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
            View all <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} {...fadeIn} transition={{ delay: i * 0.05 }} className="soft-card p-5">
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

      {/* Project Health Cards */}
      {fp.length > 0 && (
        <motion.div {...fadeIn} transition={{ delay: 0.1 }} className="soft-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" /> Project Health
            </h3>
            <Link to="/projects" className="text-xs text-primary hover:underline">Manage all</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {fp.map(p => {
              const pTasks   = tasks.filter(t => t.projectId === p.id);
              const pDone    = pTasks.filter(t => t.status === 'done').length;
              const pOverdue = pTasks.filter(t => t.status !== 'done' && t.deadline && new Date(t.deadline) < today).length;
              const budgPct  = p.budget > 0 ? (p.spent / p.budget) * 100 : 0;
              const cfg      = STATUS_CONFIG[p.status] || STATUS_CONFIG.planning;
              const daysLeft = p.deadline
                ? Math.ceil((new Date(p.deadline).getTime() - today.getTime()) / 86400000)
                : null;
              return (
                <div key={p.id} className="p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/20 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0 mr-2">
                      <div className="text-sm font-semibold text-foreground truncate">{p.name}</div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>
                    {pOverdue > 0 && <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />}
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Progress</span>
                        <span className="font-medium text-foreground">{p.progress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full gradient-primary rounded-full" style={{ width: `${p.progress}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Budget used</span>
                        <span className={`font-medium ${budgPct > 85 ? 'text-destructive' : budgPct > 65 ? 'text-warning' : 'text-foreground'}`}>
                          {Math.round(budgPct)}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${budgPct > 85 ? 'bg-destructive' : budgPct > 65 ? 'bg-warning' : 'gradient-primary'}`}
                          style={{ width: `${Math.min(budgPct, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CheckSquare className="w-3 h-3" /> {pDone}/{pTasks.length}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {p.team?.length || 0}
                    </span>
                    {daysLeft !== null && (
                      <span className={`flex items-center gap-1 ${daysLeft < 14 ? 'text-destructive font-medium' : ''}`}>
                        <Calendar className="w-3 h-3" />
                        {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                      </span>
                    )}
                    {pOverdue > 0 && <span className="text-destructive font-medium">{pOverdue} overdue</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Needs Attention */}
      {attentionItems.length > 0 && (
        <motion.div {...fadeIn} transition={{ delay: 0.15 }} className="soft-card p-5 border border-destructive/15">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Zap className="w-4 h-4 text-destructive" /> Needs Attention
            </h3>
            <span className="text-xs text-muted-foreground">{attentionItems.length} item{attentionItems.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="space-y-2">
            {attentionItems.map(t => {
              const project = projects.find(p => p.id === t.projectId);
              const isOverdue = t.deadline && new Date(t.deadline) < today;
              return (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${t.priority === 'urgent' ? 'bg-destructive' : 'bg-warning'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{t.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {project?.name}{t.deadline ? ` · Due ${new Date(t.deadline).toLocaleDateString()}` : ''}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                    t.priority === 'urgent' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'
                  }`}>
                    {t.priority === 'urgent' ? 'Urgent' : isOverdue ? 'Overdue' : 'Due soon'}
                  </span>
                </div>
              );
            })}
          </div>
          <Link to="/tasks" className="text-xs text-primary hover:underline mt-3 block">View all tasks →</Link>
        </motion.div>
      )}

      {/* Project Phases + Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div {...fadeIn} transition={{ delay: 0.2 }} className="soft-card p-5">
          <h3 className="font-semibold text-foreground mb-5 flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" /> Project Phases
          </h3>
          <div className="space-y-5">
            {fp.length > 0 ? fp.slice(0, 4).map(p => {
              const stage = STAGE_MAP[p.status] ?? 0;
              return (
                <div key={p.id}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground truncate max-w-[150px]">{p.name}</span>
                    <span className="text-xs text-muted-foreground">{p.progress}% complete</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {WORKFLOW_STAGES.map((stageName, i) => (
                      <div key={i} className="flex-1">
                        <div className={`h-2 rounded-full mb-1 transition-all ${
                          i < stage ? 'gradient-primary' : i === stage ? 'bg-primary/40' : 'bg-muted'
                        }`} />
                        {i === stage && (
                          <div className="text-center">
                            <span className="text-[10px] text-primary font-semibold">{stageName}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            }) : <div className="text-sm text-muted-foreground">No projects found.</div>}
          </div>
        </motion.div>

        <motion.div {...fadeIn} transition={{ delay: 0.25 }} className="soft-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-warning" /> Pending Approvals
            </h3>
            <Link to="/approvals" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          {pendingApprovals.length > 0 ? (
            <div className="space-y-3">
              {pendingApprovals.slice(0, 4).map(a => {
                const project = projects.find(p => p.id === a.projectId);
                return (
                  <div key={a.id} className="flex items-center justify-between p-3.5 rounded-xl bg-muted/40 border border-border/50">
                    <div className="flex-1 min-w-0 mr-3">
                      <div className="text-sm font-medium text-foreground truncate">{a.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {project?.name || 'Unknown Project'}
                        {a.createdAt ? ` · ${new Date(a.createdAt).toLocaleDateString()}` : ''}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleApproval(a.id, 'approved')}
                        className="p-1.5 rounded-lg text-success hover:bg-success/10 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleApproval(a.id, 'rejected')}
                        className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-32 flex flex-col items-center justify-center text-center bg-muted/20 rounded-xl border border-border/40 border-dashed">
              <CheckCircle className="w-8 h-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">All caught up!<br />No pending approvals.</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Budget vs Spend + Task Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div {...fadeIn} transition={{ delay: 0.3 }} className="soft-card p-5 lg:col-span-2">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-warning" /> Budget vs Spend (M)
          </h3>
          {budgetByProject.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={budgetByProject} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(33 18% 88%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid hsl(36 20% 90%)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                    cursor={{ fill: 'hsl(33 18% 96%)' }}
                    formatter={(v: number) => [`$${v}M`]}
                  />
                  <Legend iconType="circle" iconSize={8} />
                  <Bar dataKey="Budget" fill="hsl(30,25%,62%)"  radius={[4,4,0,0]} maxBarSize={36} />
                  <Bar dataKey="Spent"  fill="hsl(38,70%,65%)"  radius={[4,4,0,0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2.5">
                {budgetByProject.map(p => (
                  <div key={p.name} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-24 truncate">{p.name}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${p.pct > 85 ? 'bg-destructive' : p.pct > 65 ? 'bg-warning' : 'gradient-primary'}`}
                        style={{ width: `${Math.min(p.pct, 100)}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium w-10 text-right ${p.pct > 85 ? 'text-destructive' : p.pct > 65 ? 'text-warning' : 'text-muted-foreground'}`}>
                      {p.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">No budget data available</div>
          )}
        </motion.div>

        <motion.div {...fadeIn} transition={{ delay: 0.35 }} className="soft-card p-5">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" /> Task Status
          </h3>
          <ResponsiveContainer width="100%" height={175}>
            <PieChart>
              <Pie data={tasksByStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={3} dataKey="value">
                {tasksByStatus.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid hsl(36 20% 90%)' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 mt-2">
            {tasksByStatus.map((t, i) => (
              <div key={t.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS[i] }} />
                <span className="truncate">{t.name}</span>
                <span className="font-semibold text-foreground ml-auto">{t.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Activity Timeline */}
      <motion.div {...fadeIn} transition={{ delay: 0.4 }} className="soft-card p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> Recent Activity
          </h3>
          <Link to="/timeline" className="text-xs text-primary hover:underline">Full timeline</Link>
        </div>
        {timeline.length > 0 ? (
          <div className="relative">
            <div className="absolute left-3 top-2 bottom-2 w-px bg-border/50" />
            <div className="space-y-4">
              {timeline.map(item => (
                <div key={item.id} className="relative flex items-start gap-4 pl-8">
                  <div className={`absolute left-1 top-1.5 w-4 h-4 rounded-full flex items-center justify-center ${
                    item.type === 'error' ? 'bg-destructive/15' : item.type === 'success' ? 'bg-success/15' : 'bg-primary/15'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      item.type === 'error' ? 'bg-destructive' : item.type === 'success' ? 'bg-success' : 'bg-primary'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{item.event}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {item.project && <span className="text-xs text-primary/70">{item.project}</span>}
                      <span className="text-xs text-muted-foreground">{item.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground text-center py-8">No recent activity.</div>
        )}
      </motion.div>
    </div>
  );
}
