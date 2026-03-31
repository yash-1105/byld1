import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Clock, AlertTriangle, DollarSign, ClipboardCheck, ListTodo, MessageSquare } from 'lucide-react';
import livingRoomImg from '@/assets/living-room.jpg';
import kitchenImg from '@/assets/kitchen.jpg';
import bedroomImg from '@/assets/bedroom.jpg';
import bathroomImg from '@/assets/bathroom.jpg';

interface Segment {
  id: string;
  name: string;
  status: 'pending' | 'approved' | 'in_progress' | 'completed';
  progress: number;
  image?: string;
  budget: number;
  spent: number;
  tasks: { title: string; status: string; assignee: string }[];
  approvals: { title: string; status: string; date: string }[];
  issues: { title: string; severity: string }[];
  position: { top: string; left: string; width: string; height: string };
  color: string;
}

const segments: Segment[] = [
  {
    id: 'living',
    name: 'Living Room',
    status: 'in_progress',
    progress: 68,
    budget: 85000,
    spent: 57800,
    image: livingRoomImg,
    tasks: [
      { title: 'Flooring installation', status: 'in_progress', assignee: 'Mike J.' },
      { title: 'Wall finishing', status: 'todo', assignee: 'Alex R.' },
      { title: 'Lighting fixtures', status: 'done', assignee: 'Mike J.' },
    ],
    approvals: [
      { title: 'Material selection — Italian marble', status: 'approved', date: '2025-03-15' },
      { title: 'Ceiling design revision', status: 'pending', date: '2025-03-28' },
    ],
    issues: [{ title: 'Marble delivery delayed by 5 days', severity: 'medium' }],
    position: { top: '8%', left: '4%', width: '45%', height: '44%' },
    color: 'hsl(217 91% 60%)',
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    status: 'approved',
    progress: 42,
    budget: 120000,
    spent: 50400,
    image: kitchenImg,
    tasks: [
      { title: 'Cabinet installation', status: 'in_progress', assignee: 'Alex R.' },
      { title: 'Countertop fitting', status: 'todo', assignee: 'Mike J.' },
      { title: 'Plumbing rough-in', status: 'done', assignee: 'Mike J.' },
    ],
    approvals: [
      { title: 'Appliance package — Premium set', status: 'approved', date: '2025-03-10' },
      { title: 'Backsplash tile selection', status: 'pending', date: '2025-03-25' },
    ],
    issues: [],
    position: { top: '8%', left: '52%', width: '44%', height: '44%' },
    color: 'hsl(152 60% 42%)',
  },
  {
    id: 'bedroom',
    name: 'Master Bedroom',
    status: 'in_progress',
    progress: 55,
    budget: 65000,
    spent: 35750,
    tasks: [
      { title: 'Wardrobes built-in', status: 'in_progress', assignee: 'Alex R.' },
      { title: 'Paint finishing', status: 'todo', assignee: 'Mike J.' },
    ],
    approvals: [
      { title: 'Window treatment selection', status: 'approved', date: '2025-03-12' },
    ],
    issues: [{ title: 'Custom wardrobe dimensions need re-measurement', severity: 'low' }],
    position: { top: '56%', left: '4%', width: '30%', height: '38%' },
    color: 'hsl(262 83% 58%)',
  },
  {
    id: 'bathroom',
    name: 'Bathroom',
    status: 'pending',
    progress: 20,
    budget: 45000,
    spent: 9000,
    tasks: [
      { title: 'Waterproofing', status: 'in_progress', assignee: 'Mike J.' },
      { title: 'Tile installation', status: 'todo', assignee: 'Alex R.' },
      { title: 'Vanity installation', status: 'todo', assignee: 'Mike J.' },
    ],
    approvals: [
      { title: 'Fixture selection — Grohe premium', status: 'pending', date: '2025-03-20' },
    ],
    issues: [{ title: 'Waterproofing inspection pending', severity: 'high' }],
    position: { top: '56%', left: '37%', width: '28%', height: '38%' },
    color: 'hsl(38 92% 50%)',
  },
  {
    id: 'outdoor',
    name: 'Outdoor Area',
    status: 'pending',
    progress: 10,
    budget: 35000,
    spent: 3500,
    tasks: [
      { title: 'Landscaping plan', status: 'todo', assignee: 'Sarah C.' },
      { title: 'Deck foundation', status: 'todo', assignee: 'Mike J.' },
    ],
    approvals: [
      { title: 'Landscape design approval', status: 'pending', date: '2025-03-22' },
    ],
    issues: [],
    position: { top: '56%', left: '68%', width: '28%', height: '38%' },
    color: 'hsl(152 60% 42%)',
  },
];

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: 'text-warning', bg: 'bg-warning/10' },
  approved: { label: 'Approved', color: 'text-success', bg: 'bg-success/10' },
  in_progress: { label: 'In Progress', color: 'text-primary', bg: 'bg-primary/10' },
  completed: { label: 'Completed', color: 'text-success', bg: 'bg-success/10' },
};

export default function SegmentMapView() {
  const [activeSegment, setActiveSegment] = useState<Segment | null>(null);
  const [detailTab, setDetailTab] = useState<'tasks' | 'approvals' | 'budget' | 'issues'>('tasks');

  return (
    <div className="space-y-6">
      {/* Floor Plan */}
      <div className="soft-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold text-foreground text-lg">Floor Plan — Segment View</h3>
            <p className="text-sm text-muted-foreground mt-0.5">Click a segment to see tasks, approvals, and budget</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {Object.entries(statusConfig).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${cfg.bg} border`} style={{ borderColor: 'transparent' }} />
                {cfg.label}
              </div>
            ))}
          </div>
        </div>

        <div className="relative w-full aspect-[16/9] bg-gradient-to-br from-muted/50 to-muted rounded-2xl border-2 border-dashed border-border overflow-hidden">
          {/* Grid lines for visual effect */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(hsl(220 20% 10%) 1px, transparent 1px), linear-gradient(90deg, hsl(220 20% 10%) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          
          {segments.map((seg) => {
            const isActive = activeSegment?.id === seg.id;
            const sc = statusConfig[seg.status];
            return (
              <motion.button
                key={seg.id}
                onClick={() => { setActiveSegment(seg); setDetailTab('tasks'); }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`absolute rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-1 cursor-pointer group ${
                  isActive ? 'segment-glow border-primary bg-primary/10 z-10' : 'border-border bg-card/80 hover:border-primary/40 hover:bg-card'
                }`}
                style={{ top: seg.position.top, left: seg.position.left, width: seg.position.width, height: seg.position.height }}
              >
                <span className={`text-sm font-semibold ${isActive ? 'text-primary' : 'text-foreground'} transition-colors`}>
                  {seg.name}
                </span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${sc.bg} ${sc.color}`}>
                  {sc.label}
                </span>
                <div className="w-16 h-1.5 rounded-full bg-muted mt-1 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${seg.progress}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: seg.color }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{seg.progress}%</span>
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
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3 }}
            className="soft-card overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-foreground">{activeSegment.name}</h3>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusConfig[activeSegment.status].bg} ${statusConfig[activeSegment.status].color}`}>
                    {statusConfig[activeSegment.status].label}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {activeSegment.progress}% complete · ${(activeSegment.spent / 1000).toFixed(0)}k of ${(activeSegment.budget / 1000).toFixed(0)}k spent
                </p>
              </div>
              <button onClick={() => setActiveSegment(null)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border px-6">
              {([
                { key: 'tasks' as const, icon: ListTodo, label: 'Tasks', count: activeSegment.tasks.length },
                { key: 'approvals' as const, icon: ClipboardCheck, label: 'Approvals', count: activeSegment.approvals.length },
                { key: 'budget' as const, icon: DollarSign, label: 'Budget', count: null },
                { key: 'issues' as const, icon: AlertTriangle, label: 'Issues', count: activeSegment.issues.length },
              ]).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setDetailTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                    detailTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {tab.count !== null && <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full">{tab.count}</span>}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {detailTab === 'tasks' && (
                <div className="space-y-3">
                  {activeSegment.tasks.map((task, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-muted/40 border border-border/50">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        task.status === 'done' ? 'bg-success/10' : task.status === 'in_progress' ? 'bg-primary/10' : 'bg-muted'
                      }`}>
                        {task.status === 'done' ? <CheckCircle className="w-4 h-4 text-success" /> :
                         task.status === 'in_progress' ? <Clock className="w-4 h-4 text-primary" /> :
                         <Clock className="w-4 h-4 text-muted-foreground" />}
                      </div>
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${task.status === 'done' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{task.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">Assigned to {task.assignee}</div>
                      </div>
                      <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${
                        task.status === 'done' ? 'bg-success/10 text-success' : task.status === 'in_progress' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                      }`}>{task.status === 'in_progress' ? 'In Progress' : task.status === 'done' ? 'Done' : 'To Do'}</span>
                    </div>
                  ))}
                </div>
              )}

              {detailTab === 'approvals' && (
                <div className="space-y-3">
                  {activeSegment.approvals.map((a, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-muted/40 border border-border/50">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        a.status === 'approved' ? 'bg-success/10' : 'bg-warning/10'
                      }`}>
                        {a.status === 'approved' ? <CheckCircle className="w-4 h-4 text-success" /> : <Clock className="w-4 h-4 text-warning" />}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-foreground">{a.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{a.date}</div>
                      </div>
                      <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${
                        a.status === 'approved' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                      }`}>{a.status === 'approved' ? 'Approved' : 'Pending'}</span>
                    </div>
                  ))}
                </div>
              )}

              {detailTab === 'budget' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
                      <div className="text-xs text-muted-foreground">Total Budget</div>
                      <div className="text-xl font-bold text-foreground mt-1">${(activeSegment.budget / 1000).toFixed(0)}k</div>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
                      <div className="text-xs text-muted-foreground">Spent</div>
                      <div className="text-xl font-bold text-primary mt-1">${(activeSegment.spent / 1000).toFixed(0)}k</div>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
                      <div className="text-xs text-muted-foreground">Remaining</div>
                      <div className="text-xl font-bold text-success mt-1">${((activeSegment.budget - activeSegment.spent) / 1000).toFixed(0)}k</div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-2">
                      <span>Budget utilization</span>
                      <span>{Math.round((activeSegment.spent / activeSegment.budget) * 100)}%</span>
                    </div>
                    <div className="h-3 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(activeSegment.spent / activeSegment.budget) * 100}%` }}
                        transition={{ duration: 0.8 }}
                        className="h-full rounded-full gradient-primary"
                      />
                    </div>
                  </div>
                </div>
              )}

              {detailTab === 'issues' && (
                <div className="space-y-3">
                  {activeSegment.issues.length > 0 ? activeSegment.issues.map((issue, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-muted/40 border border-border/50">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        issue.severity === 'high' ? 'bg-destructive/10' : issue.severity === 'medium' ? 'bg-warning/10' : 'bg-muted'
                      }`}>
                        <AlertTriangle className={`w-4 h-4 ${
                          issue.severity === 'high' ? 'text-destructive' : issue.severity === 'medium' ? 'text-warning' : 'text-muted-foreground'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-foreground">{issue.title}</div>
                      </div>
                      <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium capitalize ${
                        issue.severity === 'high' ? 'bg-destructive/10 text-destructive' : issue.severity === 'medium' ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground'
                      }`}>{issue.severity}</span>
                    </div>
                  )) : (
                    <div className="text-center py-10 text-sm text-muted-foreground">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      No issues reported for this segment
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
