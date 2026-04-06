import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Clock, AlertTriangle, CheckCircle,
  Filter, Layers
} from 'lucide-react';

interface GanttTask {
  id: string;
  name: string;
  room: string;
  startWeek: number;
  duration: number;
  status: 'completed' | 'in_progress' | 'at_risk' | 'delayed' | 'pending';
  assignees: string[];
  dependencies?: string[];
  delayReason?: string;
}

const ganttTasks: GanttTask[] = [
  { id: 'g1', name: 'Floor Plan Finalization', room: 'Living Room', startWeek: 0, duration: 3, status: 'completed', assignees: ['SC'] },
  { id: 'g2', name: 'Wall Treatment Selection', room: 'Living Room', startWeek: 3, duration: 2, status: 'completed', assignees: ['SC'], dependencies: ['g1'] },
  { id: 'g3', name: 'Furniture Procurement', room: 'Living Room', startWeek: 5, duration: 4, status: 'in_progress', assignees: ['MJ', 'SC'], dependencies: ['g2'] },
  { id: 'g4', name: 'Lighting Installation', room: 'Living Room', startWeek: 8, duration: 2, status: 'pending', assignees: ['MJ'], dependencies: ['g3'] },

  { id: 'g5', name: 'Cabinet Design', room: 'Kitchen', startWeek: 1, duration: 3, status: 'completed', assignees: ['SC'] },
  { id: 'g6', name: 'Countertop Selection', room: 'Kitchen', startWeek: 4, duration: 2, status: 'at_risk', assignees: ['SC', 'DP'], dependencies: ['g5'], delayReason: 'Supplier availability — marble shipment delayed' },
  { id: 'g7', name: 'Appliance Installation', room: 'Kitchen', startWeek: 6, duration: 3, status: 'delayed', assignees: ['MJ'], dependencies: ['g6'], delayReason: 'Blocked by countertop delay' },
  { id: 'g8', name: 'Backsplash Tiling', room: 'Kitchen', startWeek: 9, duration: 2, status: 'pending', assignees: ['MJ'], dependencies: ['g7'] },

  { id: 'g9', name: 'Plumbing Rough-In', room: 'Bathroom', startWeek: 2, duration: 2, status: 'completed', assignees: ['MJ'] },
  { id: 'g10', name: 'Tile Installation', room: 'Bathroom', startWeek: 4, duration: 3, status: 'in_progress', assignees: ['MJ'], dependencies: ['g9'] },
  { id: 'g11', name: 'Fixtures Installation', room: 'Bathroom', startWeek: 7, duration: 2, status: 'pending', assignees: ['MJ'], dependencies: ['g10'] },

  { id: 'g12', name: 'Wardrobe Design', room: 'Bedroom', startWeek: 3, duration: 2, status: 'completed', assignees: ['SC'] },
  { id: 'g13', name: 'Bed Frame + Headboard', room: 'Bedroom', startWeek: 5, duration: 3, status: 'in_progress', assignees: ['SC', 'MJ'], dependencies: ['g12'] },
  { id: 'g14', name: 'Curtain & Soft Furnishing', room: 'Bedroom', startWeek: 8, duration: 2, status: 'pending', assignees: ['SC'], dependencies: ['g13'] },

  { id: 'g15', name: 'Landscape Design', room: 'Outdoor', startWeek: 0, duration: 4, status: 'completed', assignees: ['SC'] },
  { id: 'g16', name: 'Hardscape Construction', room: 'Outdoor', startWeek: 4, duration: 4, status: 'in_progress', assignees: ['MJ'], dependencies: ['g15'] },
  { id: 'g17', name: 'Planting & Irrigation', room: 'Outdoor', startWeek: 8, duration: 3, status: 'pending', assignees: ['MJ'], dependencies: ['g16'] },
];

const rooms = ['Living Room', 'Kitchen', 'Bathroom', 'Bedroom', 'Outdoor'];
const totalWeeks = 12;
const weekLabels = Array.from({ length: totalWeeks }, (_, i) => `W${i + 1}`);

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  completed: { color: 'bg-success', bg: 'bg-success/10', label: 'Completed' },
  in_progress: { color: 'bg-primary', bg: 'bg-primary/10', label: 'In Progress' },
  at_risk: { color: 'bg-warning', bg: 'bg-warning/10', label: 'At Risk' },
  delayed: { color: 'bg-destructive', bg: 'bg-destructive/10', label: 'Delayed' },
  pending: { color: 'bg-muted-foreground/30', bg: 'bg-muted/30', label: 'Pending' },
};

export default function TimelinePage() {
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const scrollRef = useRef<HTMLDivElement>(null);

  const filteredRooms = activeFilter === 'all' ? rooms : rooms.filter(r => r === activeFilter);

  const stats = {
    completed: ganttTasks.filter(t => t.status === 'completed').length,
    inProgress: ganttTasks.filter(t => t.status === 'in_progress').length,
    atRisk: ganttTasks.filter(t => t.status === 'at_risk' || t.status === 'delayed').length,
    pending: ganttTasks.filter(t => t.status === 'pending').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Project Timeline</h1>
          <p className="text-muted-foreground text-sm mt-1">Gantt chart · Skyline Tower Interior</p>
        </div>
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

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground" />
        {['all', ...rooms].map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
              activeFilter === f
                ? 'gradient-primary text-primary-foreground shadow-md shadow-primary/15'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {f === 'all' ? 'All Rooms' : f}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 text-xs text-muted-foreground">
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
                {weekLabels.map((w, i) => (
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
            {filteredRooms.map(room => {
              const roomTasks = ganttTasks.filter(t => t.room === room);
              return (
                <div key={room}>
                  {/* Room header */}
                  <div className="flex items-center px-5 py-2.5 bg-muted/10 border-b border-border/30">
                    <span className="text-xs font-bold text-foreground uppercase tracking-wider">{room}</span>
                    <span className="text-[10px] text-muted-foreground ml-2">({roomTasks.length} tasks)</span>
                  </div>
                  {/* Tasks */}
                  {roomTasks.map((task, ti) => {
                    const cfg = statusConfig[task.status];
                    const leftPct = (task.startWeek / totalWeeks) * 100;
                    const widthPct = (task.duration / totalWeeks) * 100;
                    const isHovered = hoveredTask === task.id;
                    const _depTask = task.dependencies?.[0] ? ganttTasks.find(t => t.id === task.dependencies![0]) : null;

                    return (
                      <div
                        key={task.id}
                        className="flex items-center border-b border-border/20 hover:bg-muted/10 transition-colors"
                        onMouseEnter={() => setHoveredTask(task.id)}
                        onMouseLeave={() => setHoveredTask(null)}
                      >
                        {/* Task name */}
                        <div className="w-48 flex-shrink-0 px-5 py-3 border-r border-border/30">
                          <div className="text-xs font-medium text-foreground truncate">{task.name}</div>
                          <div className="flex items-center gap-1.5 mt-1">
                            {task.assignees.map(a => (
                              <div key={a} className="w-5 h-5 rounded-full gradient-primary flex items-center justify-center text-[7px] font-bold text-primary-foreground">
                                {a}
                              </div>
                            ))}
                            {task.status === 'delayed' && (
                              <AlertTriangle className="w-3 h-3 text-destructive ml-1" />
                            )}
                          </div>
                        </div>
                        {/* Bar */}
                        <div className="flex-1 relative h-12">
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
                            className={`absolute top-2.5 h-7 rounded-lg ${cfg.color} cursor-pointer transition-all duration-300 ${
                              isHovered ? 'shadow-lg scale-y-110 z-10' : ''
                            }`}
                            style={{ left: `${leftPct}%` }}
                          >
                            <div className="absolute inset-0 flex items-center px-2.5">
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
                              className="absolute z-20 bg-card border border-border rounded-xl shadow-xl p-3 text-xs min-w-[200px]"
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
                  <div className="text-sm font-medium text-foreground">{t.name} <span className="text-muted-foreground">· {t.room}</span></div>
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
