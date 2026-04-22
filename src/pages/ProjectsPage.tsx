import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Search, Users, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const statusLabels: Record<string, string> = { planning: 'Planning', design: 'Design', approval: 'Approval', construction: 'Construction', finishing: 'Finishing', completed: 'Completed' };
const statusColors: Record<string, string> = { planning: 'bg-muted text-muted-foreground', design: 'bg-primary/10 text-primary', approval: 'bg-warning/10 text-warning', construction: 'bg-success/10 text-success', finishing: 'bg-primary/10 text-primary', completed: 'bg-success/10 text-success' };

const projectImages = [
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1577495508326-19a1b3cf65b7?w=600&h=400&fit=crop',
];

export default function ProjectsPage() {
  const { projects, addProject } = useData();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', description: '', deadline: '', budget: '' });

  // Clients only see projects they're a part of
  const visible = user?.role === 'client'
    ? projects.filter(p => p.team.includes(user.name))
    : projects;
  const filtered = visible.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const isClient = user?.role === 'client';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    addProject({
      name: form.name,
      description: form.description,
      deadline: form.deadline,
      budget: Number(form.budget) || 0,
      spent: 0,
      progress: 0,
      status: 'planning',
      team: [],
    });
    setForm({ name: '', description: '', deadline: '', budget: '' });
    setShowForm(false);
    toast.success('Project created successfully');
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{isClient ? 'My Project' : 'Projects'}</h1>
          <p className="text-muted-foreground text-sm mt-1">{visible.length} {visible.length === 1 ? 'project' : 'projects'} total</p>
        </div>
        {!isClient && (
          <button onClick={() => setShowForm(true)} className="gradient-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" /> Add New Project
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..." className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-card text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm" />
      </div>

      {/* New Project Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <form onSubmit={handleSubmit} className="soft-card p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground text-lg">Create New Project</h3>
                <button type="button" onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Project name" className="px-4 py-3 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" required />
                <input value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="Budget ($)" type="number" className="px-4 py-3 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                <input value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} type="date" className="px-4 py-3 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" className="px-4 py-3 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <button type="submit" className="gradient-primary text-primary-foreground px-6 py-3 rounded-xl text-sm font-medium hover:opacity-90 shadow-lg shadow-primary/20">Create Project</button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Project Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((p, i) => (
          <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Link to={`/projects/${p.id}`} className="block soft-card-hover overflow-hidden group">
              {/* Image */}
              <div className="h-40 overflow-hidden relative">
                <img
                  src={projectImages[i % projectImages.length]}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4">
                  <h3 className="font-semibold text-primary-foreground text-lg">{p.name}</h3>
                </div>
                <span className={`absolute top-3 right-3 text-[11px] px-2.5 py-1 rounded-full font-medium ${statusColors[p.status]} backdrop-blur-sm`}>
                  {statusLabels[p.status]}
                </span>
              </div>
              {/* Content */}
              <div className="p-5">
                <p className="text-xs text-muted-foreground line-clamp-1 mb-4">{p.description}</p>
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                    <span>Progress</span>
                    <span className="font-medium text-foreground">{p.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${p.progress}%` }}
                      transition={{ duration: 1, delay: 0.2 + i * 0.1 }}
                      className="h-full rounded-full gradient-primary"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Budget: ${(p.budget / 1000000).toFixed(1)}M</span>
                  <span>Due: {new Date(p.deadline).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-1">
                    {p.team.slice(0, 3).map((m, j) => (
                      <div key={j} className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-[10px] font-semibold text-primary-foreground -ml-1.5 first:ml-0 ring-2 ring-card">
                        {m.split(' ').map(n => n[0]).join('')}
                      </div>
                    ))}
                    {p.team.length > 3 && <span className="text-xs text-muted-foreground ml-1">+{p.team.length - 3}</span>}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Open <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
