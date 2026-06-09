import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { MessageSquare, FileText, Clock, CheckCircle, ArrowUpRight, AlertCircle, TrendingUp, Calendar, BarChart3, Zap } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Link } from 'react-router-dom';

const fadeIn = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

const STATUS_CONFIG = {
  todo:        { label: 'To Do',       color: 'text-muted-foreground', bg: 'bg-muted',         dot: 'bg-muted-foreground' },
  in_progress: { label: 'In Progress', color: 'text-primary',          bg: 'bg-primary/10',    dot: 'bg-primary' },
  review:      { label: 'Review',      color: 'text-warning',          bg: 'bg-warning/10',    dot: 'bg-warning' },
  done:        { label: 'Done',        color: 'text-success',          bg: 'bg-success/10',    dot: 'bg-success' },
} as const;

const PRIORITY_CONFIG = {
  urgent: { label: 'Urgent', color: 'text-destructive', bg: 'bg-destructive/10' },
  high:   { label: 'High',   color: 'text-warning',     bg: 'bg-warning/10' },
  medium: { label: 'Medium', color: 'text-primary',     bg: 'bg-primary/10' },
  low:    { label: 'Low',    color: 'text-muted-foreground', bg: 'bg-muted' },
} as const;

export default function ConsultantDashboard() {
  const { tasks, projects } = useData();
  const { user } = useAuth();

  const today = new Date();
  const hour = today.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const myTasks = tasks.filter(t => t.assignee === user?.id);
  const activeRequests = myTasks.filter(t => t.status === 'todo' || t.status === 'in_progress');
  const pendingReview  = myTasks.filter(t => t.status === 'review');
  const completed      = myTasks.filter(t => t.status === 'done');
  const urgent         = myTasks.filter(t => t.priority === 'urgent' && t.status !== 'done');

  const weekAhead = new Date(today.getTime() + 7 * 86400000);
  const dueSoon = myTasks.filter(t =>
    t.status !== 'done' && t.deadline &&
    new Date(t.deadline) >= today && new Date(t.deadline) <= weekAhead
  );

  const completionRate = myTasks.length > 0 ? Math.round((completed.length / myTasks.length) * 100) : 0;

  // Unique projects this consultant is involved in
  const myProjectIds = [...new Set(myTasks.map(t => t.projectId))];
  const myProjects = projects.filter(p => myProjectIds.includes(p.id));

  const stats = [
    {
      label: 'Active Requests', value: activeRequests.length,
      icon: MessageSquare, color: 'text-primary', bg: 'bg-primary/10',
      sub: `${dueSoon.length} due this week`,
    },
    {
      label: 'Pending Review', value: pendingReview.length,
      icon: Clock,
      color: pendingReview.length > 0 ? 'text-warning' : 'text-success',
      bg:    pendingReview.length > 0 ? 'bg-warning/10' : 'bg-success/10',
      sub: pendingReview.length > 0 ? 'Awaiting decision' : 'None pending',
    },
    {
      label: 'Completed', value: completed.length,
      icon: CheckCircle, color: 'text-success', bg: 'bg-success/10',
      sub: `${completionRate}% success rate`,
    },
    {
      label: 'Projects', value: myProjects.length,
      icon: FileText, color: 'text-primary', bg: 'bg-primary/10',
      sub: `${myProjects.filter(p => p.status !== 'completed').length} active`,
    },
  ];

  const statusData = [
    { name: 'Active',  value: activeRequests.length },
    { name: 'Review',  value: pendingReview.length },
    { name: 'Done',    value: completed.length },
  ];
  const statusColors = ['hsl(30,25%,62%)', 'hsl(38,70%,65%)', 'hsl(150,35%,55%)'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide">
          {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <h1 className="text-2xl font-bold text-foreground mt-0.5">
          {greeting}, {user?.name?.split(' ')[0] || 'Consultant'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {activeRequests.length > 0
            ? `${activeRequests.length} active request${activeRequests.length !== 1 ? 's' : ''}${urgent.length > 0 ? ` · ${urgent.length} urgent` : ''}`
            : 'No active requests right now'}
          {' · '}{myProjects.length} project{myProjects.length !== 1 ? 's' : ''} assigned
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

      {/* Urgent items */}
      {urgent.length > 0 && (
        <motion.div {...fadeIn} transition={{ delay: 0.1 }} className="glass-card p-5 border border-destructive/15">
          <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-destructive" /> Urgent Requests ({urgent.length})
          </h3>
          <div className="space-y-2">
            {urgent.map(t => {
              const project = projects.find(p => p.id === t.projectId);
              return (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-destructive/5 border border-destructive/10">
                  <div className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{t.title}</div>
                    <div className="text-xs text-muted-foreground">{project?.name}</div>
                  </div>
                  {t.deadline && (
                    <span className="text-xs text-destructive font-medium shrink-0">
                      Due {new Date(t.deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Consultation Queue + Status chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div {...fadeIn} transition={{ delay: 0.15 }} className="glass-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Consultation Queue
            </h3>
            <Link to="/tasks" className="text-xs text-primary hover:underline flex items-center gap-1">
              All tasks <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          {myTasks.length > 0 ? (
            <div className="space-y-2">
              {myTasks.slice(0, 6).map(t => {
                const project = projects.find(p => p.id === t.projectId);
                const sCfg = STATUS_CONFIG[t.status];
                const pCfg = PRIORITY_CONFIG[t.priority];
                const isOverdue = t.deadline && new Date(t.deadline) < today && t.status !== 'done';
                return (
                  <div key={t.id} className="flex items-center gap-3 p-3.5 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${sCfg.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{t.title}</div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {project && <span className="text-xs text-primary/70">{project.name}</span>}
                        {t.deadline && (
                          <span className={`text-xs flex items-center gap-0.5 ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                            <Calendar className="w-3 h-3" />
                            {new Date(t.deadline).toLocaleDateString()}
                            {isOverdue && ' (overdue)'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pCfg.bg} ${pCfg.color}`}>
                        {pCfg.label}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${sCfg.bg} ${sCfg.color}`}>
                        {sCfg.label}
                      </span>
                    </div>
                  </div>
                );
              })}
              {myTasks.length > 6 && (
                <Link to="/tasks" className="text-xs text-primary hover:underline block text-center pt-1">
                  +{myTasks.length - 6} more tasks
                </Link>
              )}
            </div>
          ) : (
            <div className="h-36 flex flex-col items-center justify-center text-center bg-muted/20 rounded-xl border border-dashed border-border">
              <CheckCircle className="w-8 h-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No consultation requests assigned.</p>
            </div>
          )}

          {/* Completion bar */}
          {myTasks.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border/40">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>Completion rate</span>
                <span className="font-semibold text-foreground">{completionRate}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full gradient-primary rounded-full" style={{ width: `${completionRate}%` }} />
              </div>
            </div>
          )}
        </motion.div>

        {/* Status Distribution + Due Soon */}
        <div className="flex flex-col gap-4">
          <motion.div {...fadeIn} transition={{ delay: 0.2 }} className="glass-card p-5">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" /> Status Split
            </h3>
            {myTasks.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={130}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={38} outerRadius={55} paddingAngle={3} dataKey="value">
                      {statusData.map((_, i) => <Cell key={i} fill={statusColors[i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid hsl(36 20% 90%)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-1">
                  {statusData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: statusColors[i] }} />
                      <span>{d.name}</span>
                      <span className="font-semibold text-foreground ml-auto">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-4">No data yet</div>
            )}
          </motion.div>

          <motion.div {...fadeIn} transition={{ delay: 0.25 }} className="glass-card p-5">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-warning" /> Due This Week
            </h3>
            {dueSoon.length > 0 ? (
              <div className="space-y-2">
                {dueSoon.slice(0, 4).map(t => {
                  const daysLeft = Math.ceil((new Date(t.deadline).getTime() - today.getTime()) / 86400000);
                  return (
                    <div key={t.id} className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${daysLeft <= 2 ? 'bg-destructive' : 'bg-warning'}`} />
                      <span className="text-xs text-foreground truncate flex-1">{t.title}</span>
                      <span className={`text-xs font-medium shrink-0 ${daysLeft <= 2 ? 'text-destructive' : 'text-warning'}`}>
                        {daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft}d`}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-success">
                <CheckCircle className="w-4 h-4" />
                <span>Nothing due soon</span>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Assigned Projects */}
      {myProjects.length > 0 && (
        <motion.div {...fadeIn} transition={{ delay: 0.3 }} className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Assigned Projects</h3>
            <Link to="/projects" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {myProjects.map(p => {
              const pMyTasks  = myTasks.filter(t => t.projectId === p.id);
              const pDone     = pMyTasks.filter(t => t.status === 'done').length;
              const pPending  = pMyTasks.filter(t => t.status !== 'done').length;
              return (
                <div key={p.id} className="p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/20 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-sm font-semibold text-foreground flex-1 truncate mr-2">{p.name}</div>
                    <span className="text-xs text-primary/70 shrink-0 capitalize">{p.status}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-2">
                    <div className="h-full gradient-primary rounded-full" style={{ width: `${p.progress}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{p.progress}% complete</span>
                    <span>{pDone} done · {pPending} pending</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
