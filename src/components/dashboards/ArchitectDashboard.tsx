import { useData } from '@/contexts/DataContext';
import { motion } from 'framer-motion';
import { FolderKanban, CheckSquare, DollarSign, AlertTriangle, ArrowUpRight, CheckCircle, XCircle, Activity, ClipboardCheck, Layers, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';

const fadeIn = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

export default function ArchitectDashboard() {
  const { projects, tasks, siteUpdates } = useData();

  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const totalSpent = projects.reduce((s, p) => s + p.spent, 0);
  const tasksDone = tasks.filter(t => t.status === 'done').length;
  const tasksTotal = tasks.length;
  const overdueTasks = tasks.filter(t => t.status !== 'done' && new Date(t.deadline) < new Date()).length;

  const stats = [
    { label: 'Active Projects', value: projects.filter(p => p.status !== 'completed').length, icon: FolderKanban, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Tasks Complete', value: `${tasksDone}/${tasksTotal}`, icon: CheckSquare, color: 'text-success', bg: 'bg-success/10' },
    { label: 'Budget Utilized', value: `${Math.round((totalSpent / totalBudget) * 100)}%`, icon: DollarSign, color: 'text-warning', bg: 'bg-warning/10' },
    { label: 'Overdue Tasks', value: overdueTasks, icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' },
  ];

  const projectProgress = projects.map(p => ({ name: p.name.split(' ')[0], progress: p.progress }));
  const budgetByProject = projects.map(p => ({ name: p.name.split(' ')[0], budget: p.budget / 1000000, spent: p.spent / 1000000 }));
  const statusColors = ['hsl(28, 60%, 48%)', 'hsl(158, 50%, 42%)', 'hsl(38, 85%, 52%)', 'hsl(262, 60%, 55%)'];
  const tasksByStatus = [
    { name: 'To Do', value: tasks.filter(t => t.status === 'todo').length },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'in_progress').length },
    { name: 'Review', value: tasks.filter(t => t.status === 'review').length },
    { name: 'Done', value: tasks.filter(t => t.status === 'done').length },
  ];

  const [approvals, setApprovals] = useState([
    { id: 'a1', title: 'Change Order #12 — Additional Steel', project: 'Skyline Tower', amount: '$45,000' },
    { id: 'a2', title: 'Landscape Design Revision', project: 'Harbor View', amount: '-' },
  ]);

  const handleApproval = (id: string, action: 'approved' | 'rejected') => {
    setApprovals(prev => prev.filter(a => a.id !== id));
    toast.success(`Item ${action}`);
  };

  const timeline = [
    { time: '2h ago', event: 'Concrete pour completed — Level 28', type: 'success' as const },
    { time: '5h ago', event: 'Budget alert: Skyline Tower at 65%', type: 'warning' as const },
    { time: '1d ago', event: 'New task assigned to Mike Johnson', type: 'info' as const },
    { time: '1d ago', event: 'Weather delay reported — High winds', type: 'error' as const },
    { time: '2d ago', event: 'Foundation inspection passed', type: 'success' as const },
  ];

  const stageMap: Record<string, number> = { planning: 0, design: 0, approval: 1, construction: 2, finishing: 3, completed: 4 };
  const workflowStages = ['Design', 'Approval', 'Construction', 'Finishing'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Welcome back, here's your project overview</p>
        </div>
        <Link to="/projects" className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
          View all projects <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} {...fadeIn} transition={{ delay: i * 0.05 }} className="soft-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
              </div>
              <div className={`w-11 h-11 rounded-2xl ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Status Panel */}
      <motion.div {...fadeIn} transition={{ delay: 0.1 }} className="soft-card p-5">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" /> Quick Status
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-warning/5 border border-warning/10">
            <div className="text-xs text-muted-foreground">Pending Approvals</div>
            <div className="text-xl font-bold text-warning mt-1">{approvals.length}</div>
          </div>
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
            <div className="text-xs text-muted-foreground">Active Tasks</div>
            <div className="text-xl font-bold text-primary mt-1">{tasks.filter(t => t.status === 'in_progress').length}</div>
          </div>
          <div className="p-4 rounded-xl bg-success/5 border border-success/10">
            <div className="text-xs text-muted-foreground">Procurement</div>
            <div className="text-xl font-bold text-success mt-1">On Track</div>
          </div>
          <div className="p-4 rounded-xl bg-muted/50 border border-border">
            <div className="text-xs text-muted-foreground">Remaining Budget</div>
            <div className="text-xl font-bold text-foreground mt-1">${((totalBudget - totalSpent) / 1000000).toFixed(1)}M</div>
          </div>
        </div>
      </motion.div>

      {/* Workflow + Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div {...fadeIn} transition={{ delay: 0.15 }} className="soft-card p-5">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" /> Project Workflows
          </h3>
          <div className="space-y-4">
            {projects.slice(0, 3).map(p => {
              const stage = stageMap[p.status] ?? 0;
              return (
                <div key={p.id} className="flex items-center gap-4">
                  <div className="w-28 text-sm font-medium text-foreground truncate">{p.name.split(' ').slice(0, 2).join(' ')}</div>
                  <div className="flex-1 flex items-center gap-1">
                    {workflowStages.map((_, i) => (
                      <div key={i} className={`h-2.5 flex-1 rounded-full ${i <= stage ? 'gradient-primary' : 'bg-muted'} transition-all`} />
                    ))}
                  </div>
                  <span className="text-xs text-primary font-medium w-20 text-right">{workflowStages[Math.min(stage, 3)]}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div {...fadeIn} transition={{ delay: 0.2 }} className="soft-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-warning" /> Pending Approvals
            </h3>
            <Link to="/approvals" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          {approvals.length > 0 ? (
            <div className="space-y-3">
              {approvals.map(a => (
                <div key={a.id} className="flex items-center justify-between p-3.5 rounded-xl bg-muted/40 border border-border/50">
                  <div>
                    <div className="text-sm font-medium text-foreground">{a.title}</div>
                    <div className="text-xs text-muted-foreground">{a.project} {a.amount !== '-' ? `· ${a.amount}` : ''}</div>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => handleApproval(a.id, 'approved')} className="p-2 rounded-xl bg-success/10 text-success hover:bg-success/20 transition-colors">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleApproval(a.id, 'rejected')} className="p-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
              All caught up!
            </div>
          )}
        </motion.div>
      </div>

      {/* Activity Timeline */}
      <motion.div {...fadeIn} transition={{ delay: 0.25 }} className="soft-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Activity Timeline</h3>
        </div>
        <div className="space-y-3">
          {timeline.map((t, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors">
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                t.type === 'success' ? 'bg-success' : t.type === 'warning' ? 'bg-warning' : t.type === 'error' ? 'bg-destructive' : 'bg-primary'
              }`} />
              <div className="flex-1">
                <div className="text-sm text-foreground">{t.event}</div>
                <div className="text-xs text-muted-foreground">{t.time}</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div {...fadeIn} transition={{ delay: 0.3 }} className="soft-card p-5">
          <h3 className="font-semibold text-foreground mb-4">Project Progress</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={projectProgress}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 16, border: '1px solid hsl(36 20% 90%)', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
              <Bar dataKey="progress" fill="hsl(217, 91%, 60%)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div {...fadeIn} transition={{ delay: 0.35 }} className="soft-card p-5">
          <h3 className="font-semibold text-foreground mb-4">Tasks by Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={tasksByStatus} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                {tasksByStatus.map((_, i) => <Cell key={i} fill={statusColors[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 16 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-1">
            {tasksByStatus.map((s, i) => (
              <div key={s.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: statusColors[i] }} />
                {s.name} ({s.value})
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div {...fadeIn} transition={{ delay: 0.4 }} className="soft-card p-5">
        <h3 className="font-semibold text-foreground mb-4">Budget Overview (M)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={budgetByProject}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 16 }} />
            <Bar dataKey="budget" fill="hsl(217, 91%, 60%)" radius={[8, 8, 0, 0]} name="Budget" />
            <Bar dataKey="spent" fill="hsl(38, 92%, 50%)" radius={[8, 8, 0, 0]} name="Spent" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Recent Updates */}
      <motion.div {...fadeIn} transition={{ delay: 0.45 }} className="soft-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Recent Site Updates</h3>
          <Link to="/site-updates" className="text-xs text-primary hover:underline">View all</Link>
        </div>
        <div className="space-y-2">
          {siteUpdates.slice(0, 4).map(u => (
            <div key={u.id} className="flex items-start gap-3 p-3.5 rounded-xl hover:bg-muted/30 transition-colors">
              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                u.type === 'milestone' ? 'bg-success' : u.type === 'issue' ? 'bg-destructive' : 'bg-primary'
              }`} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground">{u.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{u.author} · {new Date(u.createdAt).toLocaleDateString()}</div>
              </div>
              <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                u.type === 'milestone' ? 'bg-success/10 text-success' : u.type === 'issue' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
              }`}>{u.type}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
