import { useData } from '@/contexts/DataContext';
import { motion } from 'framer-motion';
import { FolderKanban, CheckSquare, DollarSign, AlertTriangle, ArrowUpRight, CheckCircle, XCircle, Activity, ClipboardCheck, Layers, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const fadeIn = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

export default function ArchitectDashboard() {
  const { projects, tasks, siteUpdates, updateTask } = useData();

  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const totalSpent = projects.reduce((s, p) => s + p.spent, 0);
  const tasksDone = tasks.filter(t => t.status === 'done').length;
  const tasksTotal = tasks.length;
  const overdueTasks = tasks.filter(t => t.status !== 'done' && t.deadline && new Date(t.deadline) < new Date()).length;

  const stats = [
    { label: 'Active Projects', value: projects.filter(p => p.status !== 'completed').length, icon: FolderKanban, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Tasks Complete', value: `${tasksDone}/${tasksTotal}`, icon: CheckSquare, color: 'text-success', bg: 'bg-success/10' },
    { label: 'Budget Utilized', value: `${totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}%`, icon: DollarSign, color: 'text-warning', bg: 'bg-warning/10' },
    { label: 'Overdue Tasks', value: overdueTasks, icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' },
  ];

  const projectProgress = projects.map(p => ({ name: p.name.split(' ').slice(0, 2).join(' '), progress: p.progress }));
  const budgetByProject = projects.map(p => ({ name: p.name.split(' ').slice(0, 2).join(' '), budget: p.budget / 1000000, spent: p.spent / 1000000 }));
  const statusColors = ['hsl(30, 25%, 62%)', 'hsl(150, 35%, 55%)', 'hsl(38, 70%, 65%)', 'hsl(220, 20%, 65%)'];
  const tasksByStatus = [
    { name: 'To Do', value: tasks.filter(t => t.status === 'todo').length },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'in_progress').length },
    { name: 'Review', value: tasks.filter(t => t.status === 'review').length },
    { name: 'Done', value: tasks.filter(t => t.status === 'done').length },
  ];

  // Map approvals to tasks in 'review' status
  const approvals = tasks.filter(t => t.status === 'review');

  const handleApproval = (id: string, action: 'approved' | 'rejected') => {
    updateTask(id, { status: action === 'approved' ? 'done' : 'in_progress' });
    toast.success(`Task ${action}`);
  };

  // Generate dynamic timeline from site updates and recent tasks
  const timeline = [...siteUpdates.map(u => ({
    id: u.id,
    time: new Date(u.createdAt).toLocaleDateString(),
    timestamp: new Date(u.createdAt).getTime(),
    event: `Update: ${u.title}`,
    type: 'info' as const
  })), ...tasks.slice(0, 5).map(t => ({
    id: t.id,
    time: new Date(t.createdAt).toLocaleDateString(),
    timestamp: new Date(t.createdAt).getTime(),
    event: `Task created: ${t.title}`,
    type: t.priority === 'urgent' ? 'error' as const : 'success' as const
  }))].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);

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
            {projects.length > 0 ? projects.slice(0, 3).map(p => {
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
            }) : (
              <div className="text-sm text-muted-foreground">No projects found.</div>
            )}
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
              {approvals.map(a => {
                const project = projects.find(p => p.id === a.projectId);
                return (
                  <div key={a.id} className="flex items-center justify-between p-3.5 rounded-xl bg-muted/40 border border-border/50">
                    <div>
                      <div className="text-sm font-medium text-foreground">{a.title}</div>
                      <div className="text-xs text-muted-foreground">{project?.name || 'Unknown Project'}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleApproval(a.id, 'approved')} className="p-1.5 rounded-lg text-success hover:bg-success/10 transition-colors"><CheckCircle className="w-4 h-4" /></button>
                      <button onClick={() => handleApproval(a.id, 'rejected')} className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"><XCircle className="w-4 h-4" /></button>
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

      {/* Activity Timeline */}
      <motion.div {...fadeIn} transition={{ delay: 0.25 }} className="soft-card p-5">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> Activity Timeline
          </h3>
          <Link to="/timeline" className="text-xs text-primary hover:underline">Full timeline</Link>
        </div>
        <div className="relative">
          <div className="absolute left-2.5 top-2 bottom-2 w-px bg-border/50" />
          <div className="space-y-5">
            {timeline.length > 0 ? timeline.map((item, i) => (
              <div key={item.id} className="relative flex items-start gap-4">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center mt-0.5 z-10 ${
                  item.type === 'success' ? 'bg-success/10 text-success' :
                  item.type === 'error' ? 'bg-destructive/10 text-destructive' :
                  item.type === 'warning' ? 'bg-warning/10 text-warning' :
                  'bg-primary/10 text-primary'
                }`}>
                  <div className="w-2 h-2 rounded-full bg-current" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{item.event}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.time}</p>
                </div>
              </div>
            )) : (
              <div className="text-sm text-muted-foreground">No recent activity.</div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div {...fadeIn} transition={{ delay: 0.3 }} className="soft-card p-5">
          <h3 className="font-semibold text-foreground mb-4">Project Progress</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={projectProgress} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(33 18% 88%)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid hsl(36 20% 90%)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} cursor={{ fill: 'hsl(33 18% 96%)' }} />
              <Bar dataKey="progress" fill="hsl(30, 25%, 62%)" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div {...fadeIn} transition={{ delay: 0.35 }} className="soft-card p-5">
          <h3 className="font-semibold text-foreground mb-4">Tasks by Status</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={tasksByStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value">
                {tasksByStatus.map((_, i) => <Cell key={i} fill={statusColors[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid hsl(36 20% 90%)' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {tasksByStatus.map((t, i) => (
              <div key={t.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: statusColors[i] }} />
                {t.name} ({t.value})
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div {...fadeIn} transition={{ delay: 0.4 }} className="soft-card p-5">
        <h3 className="font-semibold text-foreground mb-4">Budget Overview (M)</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={budgetByProject} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(33 18% 88%)" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid hsl(36 20% 90%)' }} cursor={{ fill: 'hsl(33 18% 96%)' }} />
            <Bar dataKey="budget" name="Total Budget" fill="hsl(30, 25%, 62%)" radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Bar dataKey="spent" name="Amount Spent" fill="hsl(38, 70%, 65%)" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
