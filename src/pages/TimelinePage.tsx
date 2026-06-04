import { useState, useRef, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Clock, AlertTriangle, CheckCircle,
  Filter, Layers, Folder
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';

interface GanttTask {
  id: string;
  name: string;
  group: string;
  startWeek: number;
  duration: number;
  status: 'completed' | 'in_progress' | 'at_risk' | 'delayed' | 'pending';
  assignees: string[];
  delayReason?: string;
}

const totalWeeks = 12;
const weekLabels = Array.from({ length: totalWeeks }, (_, i) => `W${i + 1}`);

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  completed: { color: 'bg-success', bg: 'bg-success/10', label: 'Completed' },
  in_progress: { color: 'bg-primary', bg: 'bg-primary/10', label: 'In Progress' },
  at_risk: { color: 'bg-warning', bg: 'bg-warning/10', label: 'At Risk' },
  delayed: { color: 'bg-destructive', bg: 'bg-destructive/10', label: 'Delayed' },
  pending: { color: 'bg-muted-foreground/30', bg: 'bg-muted/30', label: 'Pending' },
};

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function TimelinePage() {
  const { projects, tasks, users } = useData();
  const [activeProjectId, setActiveProjectId] = useState<string>('');

  useEffect(() => {
    if (projects.length > 0 && !activeProjectId) {
      setActiveProjectId(projects[0].id);
    }
  }, [projects, activeProjectId]);

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];

  const ganttTasks = useMemo(() => {
    if (!activeProject) return [];
    
    const projectTasks = tasks.filter(t => t.projectId === activeProject.id);
    if (projectTasks.length === 0) return [];

    // Find project start date
    const startDateStr = activeProject.createdAt || projectTasks[0]?.createdAt || new Date().toISOString();
    const projectStart = new Date(startDateStr).getTime();

    return projectTasks.map(task => {
      const taskCreate = new Date(task.createdAt || new Date().toISOString()).getTime();
      const taskDeadline = task.deadline ? new Date(task.deadline).getTime() : taskCreate + 14 * 24 * 60 * 60 * 1000; // default 2 weeks

      // Calculate weeks relative to project start
      let startWeek = Math.max(0, Math.floor((taskCreate - projectStart) / (7 * 24 * 60 * 60 * 1000)));
      // Cap at 11 weeks so it fits
      startWeek = Math.min(startWeek, 11);

      let duration = Math.max(1, Math.ceil((taskDeadline - taskCreate) / (7 * 24 * 60 * 60 * 1000)));
      // Cap duration so it doesn't overflow W12
      duration = Math.min(duration, 12 - startWeek);

      let status: GanttTask['status'] = 'pending';
      let delayReason = undefined;

      const now = Date.now();
      if (task.status === 'done') {
        status = 'completed';
      } else if (task.status === 'in_progress') {
        status = 'in_progress';
        if (taskDeadline < now) {
          status = 'delayed';
          delayReason = 'Deadline passed while in progress';
        }
      } else {
        if (taskDeadline < now) {
          status = 'delayed';
          delayReason = 'Deadline passed before starting';
        } else if (taskDeadline - now < 3 * 24 * 60 * 60 * 1000) {
          status = 'at_risk';
        }
      }

      // Group by assignee, or "General"
      let group = 'General Tasks';
      const user = users.find(u => u.id === task.assignee);
      if (user?.full_name) group = `${user.full_name}'s Tasks`;
      else if (task.assignee) group = `Assignee: ${task.assignee}`;

      return {
        id: task.id,
        name: task.title,
        group,
        startWeek,
        duration,
        status,
        assignees: user ? [getInitials(user.full_name)] : [],
        delayReason
      };
    });
  }, [tasks, activeProject, users]);

  const groups = useMemo(() => {
    const uniqueGroups = new Set(ganttTasks.map(t => t.group));
    return Array.from(uniqueGroups).sort();
  }, [ganttTasks]);

  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const scrollRef = useRef<HTMLDivElement>(null);

  const filteredGroups = activeFilter === 'all' ? groups : groups.filter(g => g === activeFilter);

  const stats = {
    completed: ganttTasks.filter(t => t.status === 'completed').length,
    inProgress: ganttTasks.filter(t => t.status === 'in_progress').length,
    atRisk: ganttTasks.filter(t => t.status === 'at_risk' || t.status === 'delayed').length,
    pending: ganttTasks.filter(t => t.status === 'pending').length,
  };

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
        <Folder className="w-12 h-12 mb-4 opacity-30" />
        <p>No projects found. Create a project first to view timelines.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Project Timeline</h1>
          <p className="text-muted-foreground text-sm mt-1">Gantt chart overview across projects</p>
        </div>
      </div>

      {/* Project Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {projects.map(p => (
          <button 
            key={p.id} 
            onClick={() => setActiveProjectId(p.id)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              activeProjectId === p.id 
                ? 'bg-foreground text-background shadow-md' 
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Completed', value: stats.completed, color: 'text-success', bg: 'bg-success/10', icon: CheckCircle },
          { label: 'In Progress', value: stats.inProgress, color: 'text-primary', bg: 'bg-primary/10', icon: Clock },
          { label: 'At Risk / Delayed', value: stats.atRisk, color: 'text-destructive', bg: 'bg-destructive/10', icon: AlertTriangle },
          { label: 'Pending', value: stats.pending, color: 'text-muted-foreground', bg: 'bg-muted/50', icon: Layers },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card rounded-2xl border border-border/40 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {ganttTasks.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border/40 p-12 text-center text-muted-foreground shadow-sm">
          No tasks found for this project. Create tasks to see the timeline.
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <Filter className="w-4 h-4 text-muted-foreground" />
            {['all', ...groups].map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                  activeFilter === f
                    ? 'gradient-primary text-primary-foreground shadow-md shadow-primary/15'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {f === 'all' ? 'All Groups' : f}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5 text-xs text-muted-foreground flex-wrap">
            {Object.entries(statusConfig).map(([key, cfg]) => (
              <span key={key} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-sm ${cfg.color}`} />
                {cfg.label}
              </span>
            ))}
          </div>

          {/* Gantt Chart */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-card rounded-2xl border border-border/40 shadow-sm overflow-hidden"
          >
            <div className="overflow-x-auto" ref={scrollRef}>
              <div className="min-w-[900px]">
                {/* Header */}
                <div className="flex border-b border-border/50 bg-muted/20">
                  <div className="w-48 flex-shrink-0 px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-r border-border/30">
                    Task
                  </div>
                  <div className="flex-1 flex">
                    {weekLabels.map((w) => (
                      <div
                        key={w}
                        className="flex-1 text-center py-3 text-[10px] font-medium text-muted-foreground border-r border-border/20 last:border-0"
                        style={{ minWidth: 60 }}
                      >
                        {w}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Body */}
                {filteredGroups.map(group => {
                  const roomTasks = ganttTasks.filter(t => t.group === group);
                  return (
                    <div key={group}>
                      {/* Group header */}
                      <div className="flex items-center px-5 py-2.5 bg-muted/10 border-b border-border/30">
                        <span className="text-xs font-bold text-foreground uppercase tracking-wider">{group}</span>
                        <span className="text-[10px] text-muted-foreground ml-2">({roomTasks.length} tasks)</span>
                      </div>
                      {/* Tasks */}
                      {roomTasks.map((task, ti) => {
                        const cfg = statusConfig[task.status];
                        const leftPct = (task.startWeek / totalWeeks) * 100;
                        const widthPct = (task.duration / totalWeeks) * 100;
                        const isHovered = hoveredTask === task.id;

                        return (
                          <div
                            key={task.id}
                            className="flex items-center border-b border-border/20 hover:bg-muted/10 transition-colors relative"
                            onMouseEnter={() => setHoveredTask(task.id)}
                            onMouseLeave={() => setHoveredTask(null)}
                          >
                            {/* Task name */}
                            <div className="w-48 flex-shrink-0 px-5 py-3 border-r border-border/30 relative z-20 bg-card">
                              <div className="text-xs font-medium text-foreground truncate">{task.name}</div>
                              <div className="flex items-center gap-1.5 mt-1">
                                {task.assignees.map((a, idx) => (
                                  <div key={idx} className="w-5 h-5 rounded-full gradient-primary flex items-center justify-center text-[7px] font-bold text-primary-foreground">
                                    {a}
                                  </div>
                                ))}
                                {task.status === 'delayed' && (
                                  <AlertTriangle className="w-3 h-3 text-destructive ml-1" />
                                )}
                              </div>
                            </div>
                            {/* Bar */}
                            <div className="flex-1 relative h-12 z-0">
                              {/* Grid lines */}
                              <div className="absolute inset-0 flex">
                                {weekLabels.map((_, i) => (
                                  <div key={i} className="flex-1 border-r border-border/10" />
                                ))}
                              </div>
                              {/* Task bar */}
                              <motion.div
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: `${widthPct}%`, opacity: 1 }}
                                transition={{ duration: 0.6, delay: ti * 0.08, ease: [0.16, 1, 0.3, 1] }}
                                className={`absolute top-2.5 h-7 rounded-lg ${cfg.color} cursor-pointer transition-all duration-300 z-10 ${
                                  isHovered ? 'shadow-lg scale-y-110 z-30' : ''
                                }`}
                                style={{ left: `${leftPct}%` }}
                              >
                                <div className="absolute inset-0 flex items-center px-2.5 overflow-hidden">
                                  <span className="text-[9px] font-semibold text-white truncate drop-shadow-sm">
                                    {task.name}
                                  </span>
                                </div>
                              </motion.div>

                              {/* Tooltip */}
                              {isHovered && (
                                <motion.div
                                  initial={{ opacity: 0, y: -4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="absolute z-50 bg-card border border-border rounded-xl shadow-xl p-3 text-xs min-w-[200px]"
                                  style={{ left: `${leftPct + widthPct / 2}%`, top: -70, transform: 'translateX(-50%)' }}
                                >
                                  <div className="font-semibold text-foreground mb-1">{task.name}</div>
                                  <div className="text-muted-foreground">W{task.startWeek + 1} → W{task.startWeek + task.duration} · {task.duration}w</div>
                                  <span className={`inline-block mt-1 text-[9px] px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color.replace('bg-', 'text-').replace('/30', '')}`}>{cfg.label}</span>
                                  {task.delayReason && (
                                    <div className="mt-1.5 text-[10px] text-destructive flex items-start gap-1">
                                      <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                      {task.delayReason}
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* Delay alerts */}
      {ganttTasks.filter(t => t.delayReason).length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-destructive/5 border border-destructive/10 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive" /> Delay Alerts
          </h3>
          <div className="space-y-2">
            {ganttTasks.filter(t => t.delayReason).map(t => (
              <div key={t.id} className="flex items-start gap-3 p-3 rounded-xl bg-card border border-destructive/10">
                <div className="w-2 h-2 rounded-full bg-destructive mt-1.5" />
                <div>
                  <div className="text-sm font-medium text-foreground">{t.name} <span className="text-muted-foreground">· {t.group}</span></div>
                  <div className="text-xs text-muted-foreground mt-0.5">{t.delayReason}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
