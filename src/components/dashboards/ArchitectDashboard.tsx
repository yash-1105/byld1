import { useData } from '@/contexts/DataContext';
import { motion } from 'framer-motion';
import { FolderKanban, CheckSquare, DollarSign, Users, TrendingUp, AlertTriangle, Clock, ArrowUpRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { Link } from 'react-router-dom';

const fadeIn = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

export default function ArchitectDashboard() {
  const { projects, tasks, budgetItems, siteUpdates } = useData();

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
  const weeklyActivity = [
    { day: 'Mon', tasks: 5 }, { day: 'Tue', tasks: 8 }, { day: 'Wed', tasks: 12 },
    { day: 'Thu', tasks: 7 }, { day: 'Fri', tasks: 10 }, { day: 'Sat', tasks: 3 }, { day: 'Sun', tasks: 1 },
  ];
  const statusColors = ['#3B82F6', '#22C55E', '#F59E0B', '#8B5CF6'];
  const tasksByStatus = [
    { name: 'To Do', value: tasks.filter(t => t.status === 'todo').length },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'in_progress').length },
    { name: 'Review', value: tasks.filter(t => t.status === 'review').length },
    { name: 'Done', value: tasks.filter(t => t.status === 'done').length },
  ];

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
          <motion.div key={s.label} {...fadeIn} transition={{ delay: i * 0.05 }} className="glass-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div {...fadeIn} transition={{ delay: 0.2 }} className="glass-card p-5">
          <h3 className="font-semibold text-foreground mb-4">Project Progress</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={projectProgress}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid hsl(220 13% 91%)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
              <Bar dataKey="progress" fill="hsl(217, 91%, 60%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div {...fadeIn} transition={{ delay: 0.25 }} className="glass-card p-5">
          <h3 className="font-semibold text-foreground mb-4">Tasks by Status</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={tasksByStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                {tasksByStatus.map((_, i) => <Cell key={i} fill={statusColors[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid hsl(220 13% 91%)' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {tasksByStatus.map((s, i) => (
              <div key={s.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColors[i] }} />
                {s.name} ({s.value})
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div {...fadeIn} transition={{ delay: 0.3 }} className="glass-card p-5">
          <h3 className="font-semibold text-foreground mb-4">Budget Overview (M)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={budgetByProject}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid hsl(220 13% 91%)' }} />
              <Bar dataKey="budget" fill="hsl(217, 91%, 60%)" radius={[6, 6, 0, 0]} name="Budget" />
              <Bar dataKey="spent" fill="hsl(38, 92%, 50%)" radius={[6, 6, 0, 0]} name="Spent" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div {...fadeIn} transition={{ delay: 0.35 }} className="glass-card p-5">
          <h3 className="font-semibold text-foreground mb-4">Weekly Activity</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={weeklyActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 93%)" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid hsl(220 13% 91%)' }} />
              <Line type="monotone" dataKey="tasks" stroke="hsl(217, 91%, 60%)" strokeWidth={2.5} dot={{ fill: 'hsl(217, 91%, 60%)', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div {...fadeIn} transition={{ delay: 0.4 }} className="glass-card p-5">
        <h3 className="font-semibold text-foreground mb-4">Recent Site Updates</h3>
        <div className="space-y-3">
          {siteUpdates.slice(0, 4).map(u => (
            <div key={u.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                u.type === 'milestone' ? 'bg-success' : u.type === 'issue' ? 'bg-destructive' : 'bg-primary'
              }`} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground">{u.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{u.author} · {new Date(u.createdAt).toLocaleDateString()}</div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                u.type === 'milestone' ? 'bg-success/10 text-success' : u.type === 'issue' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
              }`}>
                {u.type}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
