import { useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, GripVertical, Folder } from 'lucide-react';
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

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function TasksPage() {
  const { tasks, addTask, updateTask, projects, users } = useData();
  const [activeProjectId, setActiveProjectId] = useState<string>('');

  useEffect(() => {
    if (projects.length > 0 && !activeProjectId) {
      setActiveProjectId(projects[0].id);
    }
  }, [projects, activeProjectId]);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', assignee: '', deadline: '' });
  const [draggedTask, setDraggedTask] = useState<string | null>(null);

  const activeProject = projects.find(p => p.id === activeProjectId);
  const projectTasks = tasks.filter(t => t.projectId === activeProjectId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !activeProjectId) return;
    addTask({ 
      ...form, 
      status: 'todo', 
      priority: form.priority as any,
      projectId: activeProjectId
    });
    setForm({ title: '', description: '', priority: 'medium', assignee: '', deadline: '' });
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

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
        <Folder className="w-12 h-12 mb-4 opacity-30" />
        <p>No projects found. Create a project first to manage tasks.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
          <p className="text-muted-foreground text-sm mt-1">Kanban board — drag tasks between columns</p>
        </div>
        <button onClick={() => setShowForm(true)} className="gradient-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 flex items-center gap-2 shadow-lg shadow-primary/20 shrink-0">
          <Plus className="w-4 h-4" /> Add Task
        </button>
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

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border/40 p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">New Task — {activeProject?.name}</h3>
                <button type="button" onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Task title" className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" required />
                <select value={form.assignee} onChange={e => setForm(f => ({ ...f, assignee: e.target.value }))} className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="">Unassigned</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.full_name || u.email}</option>
                  ))}
                </select>
                <input value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} type="date" className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="flex gap-4">
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
                <button type="submit" className="gradient-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 shadow-lg shadow-primary/20">Create Task</button>
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
            className={`rounded-2xl bg-muted/30 p-4 min-h-[400px] border-t-4 shadow-sm ${col.color}`}
          >
            <div className="flex items-center justify-between mb-4 px-1">
              <span className="text-sm font-semibold text-foreground uppercase tracking-wider">{col.label}</span>
              <span className="text-xs text-muted-foreground bg-card px-2.5 py-1 rounded-full border border-border/50">
                {projectTasks.filter(t => t.status === col.key).length}
              </span>
            </div>
            <div className="space-y-3">
              {projectTasks.filter(t => t.status === col.key).map(t => {
                const assigneeUser = users.find(u => u.id === t.assignee);
                return (
                  <motion.div
                    key={t.id}
                    layout
                    draggable
                    onDragStart={() => setDraggedTask(t.id)}
                    className="bg-card border border-border/40 p-4 rounded-xl cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-2.5">
                      <GripVertical className="w-4 h-4 text-muted-foreground/30 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground">{t.title}</div>
                        <div className="flex items-center gap-2 mt-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${priorityColors[t.priority] || priorityColors.medium}`}>
                            {t.priority}
                          </span>
                          {assigneeUser && (
                            <div className="flex items-center gap-1.5 ml-auto">
                              <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">
                                {assigneeUser.full_name?.split(' ')[0]}
                              </span>
                              {assigneeUser.avatar_url ? (
                                <img src={assigneeUser.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                              ) : (
                                <div className="w-5 h-5 rounded-full gradient-primary flex items-center justify-center text-[8px] font-bold text-primary-foreground">
                                  {getInitials(assigneeUser.full_name)}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        {t.deadline && (
                          <div className="text-[10px] text-muted-foreground mt-2 border-t border-border/30 pt-2 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Due {new Date(t.deadline).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
