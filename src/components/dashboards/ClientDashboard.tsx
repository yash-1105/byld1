import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Camera, ClipboardCheck, Calendar, MapPin, CheckCircle, AlertCircle, Clock, ArrowUpRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Link } from 'react-router-dom';

const fadeIn = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  planning:     { label: 'Planning',     color: 'text-blue-600',         bg: 'bg-blue-50' },
  design:       { label: 'Design',       color: 'text-primary',          bg: 'bg-primary/10' },
  approval:     { label: 'Approval',     color: 'text-warning',          bg: 'bg-warning/10' },
  construction: { label: 'Construction', color: 'text-orange-600',       bg: 'bg-orange-50' },
  finishing:    { label: 'Finishing',    color: 'text-success',          bg: 'bg-success/10' },
  completed:    { label: 'Completed',    color: 'text-muted-foreground', bg: 'bg-muted' },
};

export default function ClientDashboard() {
  const { projects, siteUpdates, tasks, approvals } = useData();
  const { formatCurrencyCompact } = usePreferences();
  const { user } = useAuth();

  const today = new Date();
  const hour = today.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const clientProjects = projects.filter(p => p.team.includes(user?.name || ''));
  const myProjects = clientProjects.length > 0 ? clientProjects : projects.slice(0, 1);
  const projectIds = new Set(myProjects.map(p => p.id));
  const myUpdates = siteUpdates.filter(u => projectIds.has(u.projectId));
  const myTasks = tasks.filter(t => projectIds.has(t.projectId));


  const totalBudget = myProjects.reduce((s, p) => s + p.budget, 0);
  const totalSpent  = myProjects.reduce((s, p) => s + p.spent, 0);
  const budgetPct   = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  const mainProject = myProjects[0] || null;
  const daysLeft = mainProject?.deadline
    ? Math.ceil((new Date(mainProject.deadline).getTime() - today.getTime()) / 86400000)
    : null;

  const pendingApprovals = approvals.filter(a => a.status === 'pending' && projectIds.has(a.projectId)).length;
  const milestones = myUpdates.filter(u => u.type === 'milestone');
  const issues = myUpdates.filter(u => u.type === 'issue');

  const stats = [
    {
      label: 'Project Progress', value: `${mainProject?.progress ?? 0}%`,
      icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10',
      sub: mainProject ? STATUS_CONFIG[mainProject.status]?.label : 'No project',
    },
    {
      label: 'Budget Spent', value: formatCurrencyCompact(totalSpent),
      icon: DollarSign,
      color: budgetPct > 85 ? 'text-destructive' : 'text-warning',
      bg:    budgetPct > 85 ? 'bg-destructive/10' : 'bg-warning/10',
      sub: `${budgetPct}% of ${formatCurrencyCompact(totalBudget)}`,
    },
    {
      label: 'Site Updates', value: myUpdates.length,
      icon: Camera, color: 'text-success', bg: 'bg-success/10',
      sub: `${milestones.length} milestone${milestones.length !== 1 ? 's' : ''} reached`,
    },
    {
      label: 'Pending Approvals', value: pendingApprovals,
      icon: ClipboardCheck,
      color: pendingApprovals > 0 ? 'text-destructive' : 'text-success',
      bg:    pendingApprovals > 0 ? 'bg-destructive/10' : 'bg-success/10',
      sub: pendingApprovals > 0 ? 'Your review needed' : 'Nothing pending',
    },
  ];

  const budgetData = [
    { name: 'Spent',     value: totalSpent },
    { name: 'Remaining', value: Math.max(totalBudget - totalSpent, 0) },
  ];
  const budgetColors = ['hsl(30,25%,62%)', 'hsl(36,22%,92%)'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide">
          {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <h1 className="text-2xl font-bold text-foreground mt-0.5">
          {greeting}, {user?.name?.split(' ')[0] || 'there'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {mainProject
            ? `${mainProject.name} is ${mainProject.progress}% complete${daysLeft !== null ? ` · ${daysLeft > 0 ? `${daysLeft} days remaining` : 'deadline passed'}` : ''}`
            : 'No active project'}
        </p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Project Overview + Budget */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Project Progress */}
        <motion.div {...fadeIn} transition={{ delay: 0.15 }} className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Your Project</h3>
            <Link to="/projects" className="text-xs text-primary hover:underline flex items-center gap-1">
              Details <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-5">
            {myProjects.map(p => {
              const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.planning;
              const days = p.deadline
                ? Math.ceil((new Date(p.deadline).getTime() - today.getTime()) / 86400000)
                : null;
              return (
                <div key={p.id}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-sm font-semibold text-foreground">{p.name}</div>
                      {p.address && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <MapPin className="w-3 h-3" /> {p.address}
                        </div>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-2 ${cfg.bg} ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                    <span>Overall progress</span>
                    <span className="font-medium text-foreground">{p.progress}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${p.progress}%` }}
                      transition={{ duration: 1, delay: 0.3 }}
                      className="h-full rounded-full gradient-primary"
                    />
                  </div>
                  {days !== null && (
                    <div className={`flex items-center gap-1.5 text-xs mt-2 ${days < 14 && days > 0 ? 'text-warning' : days <= 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      <Calendar className="w-3 h-3" />
                      {days > 0 ? `${days} days until deadline` : days === 0 ? 'Deadline is today' : `${Math.abs(days)} days past deadline`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Budget Breakdown */}
        <motion.div {...fadeIn} transition={{ delay: 0.2 }} className="glass-card p-5">
          <h3 className="font-semibold text-foreground mb-1">Budget Breakdown</h3>
          <p className="text-xs text-muted-foreground mb-4">Total allocation: {formatCurrencyCompact(totalBudget)}</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={budgetData} cx="50%" cy="50%" innerRadius={48} outerRadius={70} paddingAngle={4} dataKey="value">
                {budgetData.map((_, i) => <Cell key={i} fill={budgetColors[i]} />)}
              </Pie>
              <Tooltip
                formatter={(v: number) => [formatCurrencyCompact(v)]}
                contentStyle={{ borderRadius: 12, border: '1px solid hsl(130 11% 89%)' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-6 mt-2 text-sm">
            {budgetData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: budgetColors[i] }} />
                <div>
                  <div className="font-semibold text-foreground">{formatCurrencyCompact(d.value)}</div>
                  <div className="text-xs text-muted-foreground">{d.name}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full gradient-primary rounded-full" style={{ width: `${budgetPct}%` }} />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>0%</span>
            <span className={budgetPct > 85 ? 'text-destructive font-semibold' : 'text-foreground'}>{budgetPct}% used</span>
            <span>100%</span>
          </div>
        </motion.div>
      </div>

      {/* Issues + Milestones highlights */}
      {(issues.length > 0 || milestones.length > 0) && (
        <motion.div {...fadeIn} transition={{ delay: 0.25 }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {issues.length > 0 && (
            <div className="glass-card p-4 border border-destructive/10">
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3 text-sm">
                <AlertCircle className="w-4 h-4 text-destructive" /> Open Issues ({issues.length})
              </h3>
              <div className="space-y-2">
                {issues.slice(0, 3).map(u => (
                  <div key={u.id} className="flex items-start gap-2 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 shrink-0" />
                    <div>
                      <div className="font-medium text-foreground">{u.title}</div>
                      <div className="text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {milestones.length > 0 && (
            <div className="glass-card p-4 border border-success/10">
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3 text-sm">
                <CheckCircle className="w-4 h-4 text-success" /> Milestones Reached ({milestones.length})
              </h3>
              <div className="space-y-2">
                {milestones.slice(0, 3).map(u => (
                  <div key={u.id} className="flex items-start gap-2 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-success mt-1.5 shrink-0" />
                    <div>
                      <div className="font-medium text-foreground">{u.title}</div>
                      <div className="text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Latest Site Updates */}
      <motion.div {...fadeIn} transition={{ delay: 0.3 }} className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Latest Site Updates</h3>
          <Link to="/site-updates" className="text-xs text-primary hover:underline flex items-center gap-1">
            View all <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
        {myUpdates.length > 0 ? (
          <div className="space-y-3">
            {myUpdates.slice(0, 5).map(u => (
              <div key={u.id} className="flex items-start gap-3 p-3.5 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  u.type === 'milestone' ? 'bg-success/10' : u.type === 'issue' ? 'bg-destructive/10' : 'bg-primary/10'
                }`}>
                  {u.type === 'milestone'
                    ? <CheckCircle className="w-4 h-4 text-success" />
                    : u.type === 'issue'
                    ? <AlertCircle className="w-4 h-4 text-destructive" />
                    : <Camera className="w-4 h-4 text-primary" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground">{u.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{u.description}</div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(u.createdAt).toLocaleDateString()}
                    </span>
                    <span className={`text-xs capitalize px-1.5 py-0.5 rounded font-medium ${
                      u.type === 'milestone' ? 'bg-success/10 text-success' :
                      u.type === 'issue' ? 'bg-destructive/10 text-destructive' :
                      'bg-primary/10 text-primary'
                    }`}>{u.type}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground text-center py-8 border border-dashed border-border rounded-xl">
            No site updates yet.
          </div>
        )}
      </motion.div>
    </div>
  );
}
