import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Clock, AlertTriangle, DollarSign, ClipboardCheck, ListTodo, MessageSquare, Palette } from 'lucide-react';
import DesignBoard from './DesignBoard';

interface Segment {
  id: string;
  name: string;
  status: 'pending' | 'approved' | 'in_progress' | 'completed';
  progress: number;
  image: string;
  budget: number;
  spent: number;
  tasks: { title: string; status: string; assignee: string; priority: string }[];
  approvals: { title: string; status: string; date: string }[];
  issues: { title: string; severity: string }[];
  position: { top: string; left: string; width: string; height: string };
}

const segments: Segment[] = [
  {
    id: 'living', name: 'Living Room', status: 'in_progress', progress: 68,
    image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600&h=400&fit=crop',
    budget: 85000, spent: 57800,
    tasks: [
      { title: 'Flooring installation', status: 'in_progress', assignee: 'Mike J.', priority: 'high' },
      { title: 'Wall finishing', status: 'todo', assignee: 'Alex R.', priority: 'medium' },
      { title: 'Lighting fixtures', status: 'done', assignee: 'Mike J.', priority: 'low' },
    ],
    approvals: [
      { title: 'Italian marble selection', status: 'approved', date: 'Mar 15' },
      { title: 'Ceiling design revision', status: 'pending', date: 'Mar 28' },
    ],
    issues: [{ title: 'Marble delivery delayed by 5 days', severity: 'medium' }],
    position: { top: '5%', left: '3%', width: '46%', height: '44%' },
  },
  {
    id: 'kitchen', name: 'Kitchen', status: 'approved', progress: 42,
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop',
    budget: 120000, spent: 50400,
    tasks: [
      { title: 'Cabinet installation', status: 'in_progress', assignee: 'Alex R.', priority: 'high' },
      { title: 'Countertop fitting', status: 'todo', assignee: 'Mike J.', priority: 'medium' },
      { title: 'Plumbing rough-in', status: 'done', assignee: 'Mike J.', priority: 'high' },
    ],
    approvals: [
      { title: 'Appliance package', status: 'approved', date: 'Mar 10' },
      { title: 'Backsplash tile', status: 'pending', date: 'Mar 25' },
    ],
    issues: [],
    position: { top: '5%', left: '52%', width: '45%', height: '44%' },
  },
  {
    id: 'bedroom', name: 'Master Bedroom', status: 'in_progress', progress: 55,
    image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&h=400&fit=crop',
    budget: 65000, spent: 35750,
    tasks: [
      { title: 'Wardrobes built-in', status: 'in_progress', assignee: 'Alex R.', priority: 'medium' },
      { title: 'Paint finishing', status: 'todo', assignee: 'Mike J.', priority: 'low' },
    ],
    approvals: [{ title: 'Window treatment', status: 'approved', date: 'Mar 12' }],
    issues: [{ title: 'Custom wardrobe re-measurement', severity: 'low' }],
    position: { top: '53%', left: '3%', width: '30%', height: '42%' },
  },
  {
    id: 'bathroom', name: 'Bathroom', status: 'pending', progress: 20,
    image: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&h=400&fit=crop',
    budget: 45000, spent: 9000,
    tasks: [
      { title: 'Waterproofing', status: 'in_progress', assignee: 'Mike J.', priority: 'critical' },
      { title: 'Tile installation', status: 'todo', assignee: 'Alex R.', priority: 'high' },
    ],
    approvals: [{ title: 'Grohe premium fixtures', status: 'pending', date: 'Mar 20' }],
    issues: [{ title: 'Waterproofing inspection pending', severity: 'high' }],
    position: { top: '53%', left: '36%', width: '30%', height: '42%' },
  },
  {
    id: 'outdoor', name: 'Outdoor', status: 'pending', progress: 10,
    image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&h=400&fit=crop',
    budget: 35000, spent: 3500,
    tasks: [
      { title: 'Landscaping plan', status: 'todo', assignee: 'Sarah C.', priority: 'medium' },
      { title: 'Deck foundation', status: 'todo', assignee: 'Mike J.', priority: 'low' },
    ],
    approvals: [{ title: 'Landscape design', status: 'pending', date: 'Mar 22' }],
    issues: [],
    position: { top: '53%', left: '69%', width: '28%', height: '42%' },
  },
];

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending: { label: 'Pending', color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30' },
  approved: { label: 'Approved', color: 'text-success', bg: 'bg-success/10', border: 'border-success/30' },
  in_progress: { label: 'In Progress', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30' },
  completed: { label: 'Completed', color: 'text-success', bg: 'bg-success/10', border: 'border-success/30' },
};

type DetailTab = 'design' | 'tasks' | 'approvals' | 'budget' | 'issues';

export default function SegmentMapView({ projectId }: { projectId?: string } = {}) {
  const [activeSegment, setActiveSegment] = useState<typeof segments[0] | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('design');

  const priorityColors: Record<string, string> = {
    critical: 'bg-destructive/10 text-destructive',
    high: 'bg-warning/10 text-warning',
    medium: 'bg-primary/10 text-primary',
    low: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="space-y-6">
      {/* Floor Plan */}
      <div className="soft-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold text-foreground text-lg">Segment Map</h3>
            <p className="text-sm text-muted-foreground mt-0.5">Click any room to explore its workspace</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {Object.entries(statusConfig).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${cfg.bg} border ${cfg.border}`} />
                {cfg.label}
              </div>
            ))}
          </div>
        </div>

        <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-muted/30 border border-border">
          {/* Subtle grid */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

          {segments.map(seg => {
            const isActive = activeSegment?.id === seg.id;
            const sc = statusConfig[seg.status];
            return (
              <motion.button
                key={seg.id}
                onClick={() => { setActiveSegment(seg); setDetailTab('design'); }}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.99 }}
                className={`absolute rounded-2xl overflow-hidden transition-all duration-300 group ${
                  isActive
                    ? 'ring-2 ring-primary shadow-[0_0_30px_-5px_hsl(var(--primary)/0.3)] z-10'
                    : 'border border-border/60 hover:border-primary/40 hover:shadow-lg'
                }`}
                style={{ top: seg.position.top, left: seg.position.left, width: seg.position.width, height: seg.position.height }}
              >
                <img src={seg.image} alt={seg.name} className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${isActive ? 'opacity-40 scale-105' : 'opacity-25 group-hover:opacity-35 group-hover:scale-105'}`} />
                <div className={`absolute inset-0 ${isActive ? 'bg-primary/5' : 'bg-card/60 group-hover:bg-card/40'} transition-colors`} />
                <div className="relative flex flex-col items-center justify-center gap-2 h-full">
                  <span className={`text-sm font-bold ${isActive ? 'text-primary' : 'text-foreground'} transition-colors`}>
                    {seg.name}
                  </span>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${sc.bg} ${sc.color}`}>
                    {sc.label}
                  </span>
                  <div className="w-20 h-1.5 rounded-full bg-border overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${seg.progress}%` }}
                      transition={{ duration: 1.2, delay: 0.2 }}
                      className="h-full rounded-full gradient-primary"
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium">{seg.progress}%</span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Detail Panel */}
      <AnimatePresence mode="wait">
        {activeSegment && (
          <motion.div
            key={activeSegment.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="soft-card overflow-hidden"
          >
            {/* Header with image */}
            <div className="relative h-40 overflow-hidden">
              <img src={activeSegment.image} alt={activeSegment.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
              <button onClick={() => setActiveSegment(null)} className="absolute top-4 right-4 p-2 rounded-xl bg-card/80 backdrop-blur-sm text-foreground hover:bg-card transition-colors">
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-4 left-6 right-6">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-primary-foreground">{activeSegment.name}</h3>
                  <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${statusConfig[activeSegment.status].bg} ${statusConfig[activeSegment.status].color}`}>
                    {statusConfig[activeSegment.status].label}
                  </span>
                </div>
                <p className="text-primary-foreground/70 text-sm mt-1">
                  {activeSegment.progress}% complete · ${(activeSegment.spent / 1000).toFixed(0)}k of ${(activeSegment.budget / 1000).toFixed(0)}k budget
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border px-6 overflow-x-auto">
              {([
                { key: 'design' as const, icon: Palette, label: 'Design Board' },
                { key: 'tasks' as const, icon: ListTodo, label: 'Tasks' },
                { key: 'approvals' as const, icon: ClipboardCheck, label: 'Approvals' },
                { key: 'budget' as const, icon: DollarSign, label: 'Budget' },
                { key: 'issues' as const, icon: AlertTriangle, label: 'Issues', count: activeSegment.issues.length },
              ]).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setDetailTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    detailTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {'count' in tab && tab.count! > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive">{tab.count}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {detailTab === 'design' && <DesignBoard />}

              {detailTab === 'tasks' && (
                <div className="space-y-3">
                  {/* Kanban-style grouped by status */}
                  {['in_progress', 'todo', 'done'].map(status => {
                    const statusTasks = activeSegment.tasks.filter(t => t.status === status);
                    if (statusTasks.length === 0) return null;
                    return (
                      <div key={status} className="space-y-2">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {status === 'in_progress' ? '🔵 In Progress' : status === 'todo' ? '⚪ To Do' : '✅ Done'}
                        </h4>
                        {statusTasks.map((task, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors"
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              task.status === 'done' ? 'bg-success/10' : task.status === 'in_progress' ? 'bg-primary/10' : 'bg-muted'
                            }`}>
                              {task.status === 'done' ? <CheckCircle className="w-4 h-4 text-success" /> : <Clock className="w-4 h-4 text-primary" />}
                            </div>
                            <div className="flex-1">
                              <div className={`text-sm font-medium ${task.status === 'done' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{task.title}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">{task.assignee}</div>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${priorityColors[task.priority]}`}>{task.priority}</span>
                          </motion.div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}

              {detailTab === 'approvals' && (
                <div className="space-y-3">
                  {activeSegment.approvals.map((a, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${a.status === 'approved' ? 'bg-success/10' : 'bg-warning/10'}`}>
                        {a.status === 'approved' ? <CheckCircle className="w-4 h-4 text-success" /> : <Clock className="w-4 h-4 text-warning" />}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-foreground">{a.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{a.date}</div>
                      </div>
                      <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${a.status === 'approved' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                        {a.status === 'approved' ? 'Approved' : 'Pending'}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}

              {detailTab === 'budget' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Total Budget', value: `$${(activeSegment.budget / 1000).toFixed(0)}k`, color: 'text-foreground' },
                      { label: 'Spent', value: `$${(activeSegment.spent / 1000).toFixed(0)}k`, color: 'text-primary' },
                      { label: 'Remaining', value: `$${((activeSegment.budget - activeSegment.spent) / 1000).toFixed(0)}k`, color: 'text-success' },
                    ].map(s => (
                      <div key={s.label} className="p-4 rounded-xl bg-muted/30 border border-border/50">
                        <div className="text-xs text-muted-foreground">{s.label}</div>
                        <div className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-2">
                      <span>Budget utilization</span>
                      <span className="font-medium">{Math.round((activeSegment.spent / activeSegment.budget) * 100)}%</span>
                    </div>
                    <div className="h-3 rounded-full bg-muted overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(activeSegment.spent / activeSegment.budget) * 100}%` }} transition={{ duration: 1 }} className="h-full rounded-full gradient-primary" />
                    </div>
                  </div>
                </div>
              )}

              {detailTab === 'issues' && (
                <div className="space-y-3">
                  {activeSegment.issues.length > 0 ? activeSegment.issues.map((issue, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${issue.severity === 'high' ? 'bg-destructive/10' : issue.severity === 'medium' ? 'bg-warning/10' : 'bg-muted'}`}>
                        <AlertTriangle className={`w-4 h-4 ${issue.severity === 'high' ? 'text-destructive' : issue.severity === 'medium' ? 'text-warning' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-foreground">{issue.title}</div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${issue.severity === 'high' ? 'bg-destructive/10 text-destructive' : issue.severity === 'medium' ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground'}`}>{issue.severity}</span>
                    </motion.div>
                  )) : (
                    <div className="text-center py-16 text-muted-foreground">
                      <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No issues reported</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
