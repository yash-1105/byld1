import { useRef, useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Search, Users, ArrowUpRight, Map, LayoutGrid, Upload, ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { convertToUSD, CURRENCY_SYMBOLS } from '@/lib/preferences';
import ProjectMap from '@/components/maps/ProjectMap';

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
  const { formatCurrencyCompact, preferences } = usePreferences();
  const currencySymbol = CURRENCY_SYMBOLS[preferences.currency];
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [form, setForm] = useState({ name: '', description: '', deadline: '', budget: '', budgetMin: '', budgetMax: '' });
  const [isVariableBudget, setIsVariableBudget] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Clients only see projects they're a part of
  const visible = user?.role === 'client'
    ? projects.filter(p => p.team.includes(user.name))
    : projects;
  const filtered = visible.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const isClient = user?.role === 'client';

  const resetForm = () => {
    setForm({ name: '', description: '', deadline: '', budget: '', budgetMin: '', budgetMax: '' });
    setIsVariableBudget(false);
    setCoverFile(null);
    setCoverPreview(null);
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setCoverFile(file);
    setCoverPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      let imageUrl: string | undefined;
      if (coverFile) {
        const ext = coverFile.name.split('.').pop();
        const path = `projects/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('chat-media').upload(path, coverFile);
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('chat-media').getPublicUrl(path);
          imageUrl = publicUrl;
        }
      }

      const budgetMinUSD = isVariableBudget ? convertToUSD(Number(form.budgetMin) || 0, preferences.currency) : undefined;
      const budgetMaxUSD = isVariableBudget ? convertToUSD(Number(form.budgetMax) || 0, preferences.currency) : undefined;
      const budgetUSD = isVariableBudget ? (budgetMaxUSD || 0) : convertToUSD(Number(form.budget) || 0, preferences.currency);

      addProject({
        name: form.name,
        description: form.description,
        deadline: form.deadline,
        budget: budgetUSD,
        isVariableBudget,
        budgetMin: budgetMinUSD,
        budgetMax: budgetMaxUSD,
        imageUrl,
        spent: 0,
        progress: 0,
        status: 'planning',
        team: [],
      });
      resetForm();
      setShowForm(false);
      toast.success('Project created successfully');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{isClient ? 'My Project' : 'Projects'}</h1>
          <p className="text-muted-foreground text-sm mt-1">{visible.length} {visible.length === 1 ? 'project' : 'projects'} total</p>
        </div>
        {(user?.role === 'architect' || user?.role === 'contractor') && (
          <button onClick={() => setShowForm(true)} className="gradient-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" /> Add New Project
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..." className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-card text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm" />
        </div>
        
        <div className="flex items-center bg-card border border-border rounded-xl p-1 shadow-sm shrink-0">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'grid' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <LayoutGrid className="w-4 h-4" /> Grid
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'map' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Map className="w-4 h-4" /> Map
          </button>
        </div>
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

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground px-1">Deadline</label>
                  <input value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} type="date" className="px-4 py-3 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                </div>

                {!isVariableBudget ? (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground px-1">Budget ({currencySymbol})</label>
                    <input value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder={`Budget (${currencySymbol})`} type="number" min="0" className="px-4 py-3 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground px-1">Budget range ({currencySymbol})</label>
                    <div className="flex items-center gap-2">
                      <input value={form.budgetMin} onChange={e => setForm(f => ({ ...f, budgetMin: e.target.value }))} placeholder="Min" type="number" min="0" className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                      <span className="text-muted-foreground text-xs shrink-0">to</span>
                      <input value={form.budgetMax} onChange={e => setForm(f => ({ ...f, budgetMax: e.target.value }))} placeholder="Max" type="number" min="0" className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                  </div>
                )}

                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" className="px-4 py-3 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 md:col-span-2" />
              </div>

              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer w-fit">
                <input type="checkbox" checked={isVariableBudget} onChange={e => setIsVariableBudget(e.target.checked)} className="rounded border-border" />
                This project has a variable / range budget
              </label>

              <div>
                <label className="text-xs font-medium text-muted-foreground px-1 mb-1.5 block">Cover photo</label>
                <input type="file" accept="image/*" ref={coverInputRef} className="hidden" onChange={handleCoverChange} />
                {coverPreview ? (
                  <div className="flex items-center gap-3">
                    <img src={coverPreview} alt="" className="w-16 h-16 rounded-lg object-cover border border-border" />
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">{coverFile?.name}</span>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => coverInputRef.current?.click()} className="text-xs text-primary font-medium">Change</button>
                        <button type="button" onClick={() => { setCoverFile(null); setCoverPreview(null); }} className="text-xs text-muted-foreground hover:text-destructive">Remove</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => coverInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all w-full justify-center">
                    <ImageIcon className="w-4 h-4" /> Add cover photo
                  </button>
                )}
              </div>

              <button type="submit" disabled={creating} className="gradient-primary text-primary-foreground px-6 py-3 rounded-xl text-sm font-medium hover:opacity-90 shadow-lg shadow-primary/20 disabled:opacity-60 flex items-center gap-2">
                {creating && <Upload className="w-4 h-4 animate-pulse" />} {creating ? 'Creating...' : 'Create Project'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Project Views */}
      {viewMode === 'map' ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full">
          <ProjectMap projects={filtered} />
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((p, i) => (
          <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Link to={`/projects/${p.id}`} className="block soft-card-hover overflow-hidden group">
              {/* Image */}
              <div className="h-40 overflow-hidden relative">
                <img
                  src={p.imageUrl || projectImages[i % projectImages.length]}
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
                  <span>Budget: {p.isVariableBudget && p.budgetMin != null && p.budgetMax != null ? `${formatCurrencyCompact(p.budgetMin)} – ${formatCurrencyCompact(p.budgetMax)}` : formatCurrencyCompact(p.budget)}</span>
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
      )}
    </div>
  );
}
