import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

const columns = [
  { key: 'todo' as const, label: 'To Do', color: 'border-muted-foreground/30' },
  { key: 'in_progress' as const, label: 'In Progress', color: 'border-primary' },
  { key: 'review' as const, label: 'Review', color: 'border-warning' },
  { key: 'done' as const, label: 'Done', color: 'border-success' },
];

const priorityColors: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-primary/10 text-primary',
  high: 'bg-warning/10 text-warning',
  urgent: 'bg-destructive/10 text-destructive',
};

export default function TasksPage() {
  const { tasks, addTask, updateTask } = useData();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', assignee: '', deadline: '', projectId: '1' });
  const [draggedTask, setDraggedTask] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    addTask({ ...form, status: 'todo', priority: form.priority as any });
    setForm({ title: '', description: '', priority: 'medium', assignee: '', deadline: '', projectId: '1' });
    setShowForm(false);
    toast.success('Task created');
  };

  const handleDrop = (status: typeof columns[number]['key']) => {
    if (draggedTask) {
      updateTask(draggedTask, { status });
      setDraggedTask(null);
      toast.success(`Task moved to ${status.replace('_', ' ')}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
          <p className="text-muted-foreground text-sm mt-1">Kanban board — drag tasks between columns</p>
        </div>
        <button onClick={() => setShowForm(true)} className="gradient-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">New Task</h3>
                <button type="button" onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Task title" className="px-4 py-2.5 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" required />
                <input value={form.assignee} onChange={e => setForm(f => ({ ...f, assignee: e.target.value }))} placeholder="Assignee" className="px-4 py-2.5 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                <input value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} type="date" className="px-4 py-2.5 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="flex gap-4">
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className="px-4 py-2.5 rounded-lg border border-border bg-background text-sm outline-none">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
                <button type="submit" className="gradient-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-medium hover:opacity-90">Create</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map(col => (
          <div
            key={col.key}
            onDragOver={e => e.preventDefault()}
            onDrop={() => handleDrop(col.key)}
            className={`rounded-xl bg-muted/50 p-3 min-h-[400px] border-t-2 ${col.color}`}
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-sm font-semibold text-foreground">{col.label}</span>
              <span className="text-xs text-muted-foreground bg-card px-2 py-0.5 rounded-full">{tasks.filter(t => t.status === col.key).length}</span>
            </div>
            <div className="space-y-2">
              {tasks.filter(t => t.status === col.key).map(t => (
                <motion.div
                  key={t.id}
                  layout
                  draggable
                  onDragStart={() => setDraggedTask(t.id)}
                  className="glass-card p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-2">
                    <GripVertical className="w-3.5 h-3.5 text-muted-foreground/50 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">{t.title}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${priorityColors[t.priority]}`}>{t.priority}</span>
                        {t.assignee && (
                          <span className="text-[10px] text-muted-foreground">{t.assignee.split(' ')[0]}</span>
                        )}
                      </div>
                      {t.deadline && <div className="text-[10px] text-muted-foreground mt-1">Due {new Date(t.deadline).toLocaleDateString()}</div>}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
