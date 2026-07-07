import { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, Camera, AlertTriangle, CheckCircle, Clock,
  CloudRain, Users, Package, Thermometer, Upload, Image,
  BookOpen, BarChart3, Eye, Trash2, Filter, Search,
  ChevronDown, Loader2, MapPin, Wind, Sun, CloudSnow, Folder, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import AISummaryPanel from '@/components/ai/AISummaryPanel';

const ClientUpdateComposer = lazy(() => import('@/components/ai/ClientUpdateComposer'));

// ─── Types ───────────────────────────────────────────────
interface SiteUpdateRaw {
  id: string;
  content: string | null;
  created_at: string | null;
  media_urls: string[] | null;
  posted_by: string | null;
  project_id: string | null;
  type?: string;
}

interface LogbookEntry {
  id: string;
  project_id: string;
  date: string;
  labor_count: number;
  weather: string;
  temperature: string;
  materials_delivered: string;
  delays: string;
  notes: string;
  created_by: string;
  created_at: string;
}

interface InventoryItem {
  id: string;
  project_id: string;
  material: string;
  unit: string;
  total_required: number;
  delivered: number;
  on_site: number;
  used: number;
  supplier: string;
  last_updated: string;
}

const weatherIcons: Record<string, React.ReactNode> = {
  Sunny: <Sun className="w-4 h-4 text-yellow-500" />,
  Cloudy: <CloudRain className="w-4 h-4 text-gray-400" />,
  Windy: <Wind className="w-4 h-4 text-blue-400" />,
  Rainy: <CloudRain className="w-4 h-4 text-blue-500" />,
  Snow: <CloudSnow className="w-4 h-4 text-blue-200" />,
  Clear: <Sun className="w-4 h-4 text-yellow-400" />,
  Overcast: <CloudRain className="w-4 h-4 text-gray-500" />,
};

const typeConfig = {
  progress: { icon: <Clock className="w-4 h-4" />, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', dot: 'bg-primary' },
  milestone: { icon: <CheckCircle className="w-4 h-4" />, color: 'text-success', bg: 'bg-success/10', border: 'border-success/20', dot: 'bg-success' },
  issue: { icon: <AlertTriangle className="w-4 h-4" />, color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/20', dot: 'bg-destructive' },
};

// ─── Main Component ────────────────────────────────────────
export default function SiteUpdatesPage() {
  const { projects, users } = useData();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'timeline' | 'logbook' | 'inventory'>('timeline');
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const [composerOpen, setComposerOpen] = useState(false);

  useEffect(() => {
    if (projects.length > 0 && !activeProjectId) setActiveProjectId(projects[0].id);
  }, [projects, activeProjectId]);

  const activeProject = projects.find(p => p.id === activeProjectId);

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
        <Folder className="w-12 h-12 mb-4 opacity-30" />
        <p>No projects found. Create a project first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Site Updates</h1>
          <p className="text-muted-foreground text-sm mt-1">Monitoring, digital logbook, and inventory tracking</p>
        </div>
        {(user?.role === 'architect' || user?.role === 'contractor') && (
          <button
            onClick={() => setComposerOpen(true)}
            className="gradient-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 flex items-center gap-2 shadow-lg shadow-primary/20 shrink-0"
          >
            <Sparkles className="w-4 h-4" /> Client Update
          </button>
        )}
      </div>

      {composerOpen && (
        <Suspense fallback={null}>
          <ClientUpdateComposer
            open={composerOpen}
            onOpenChange={setComposerOpen}
            defaultProjectId={activeProjectId || undefined}
          />
        </Suspense>
      )}

      {/* Project tabs */}
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

      {/* Feature Tabs */}
      <div className="flex gap-2">
        {(['timeline', 'logbook', 'inventory'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all capitalize ${
              activeTab === tab
                ? 'gradient-primary text-primary-foreground shadow-md shadow-primary/15'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'logbook' ? 'Digital Logbook' : tab === 'inventory' ? 'Inventory Tracking' : 'Timeline'}
          </button>
        ))}
      </div>

      {activeTab === 'timeline' && <TimelineTab projectId={activeProjectId} projectName={activeProject?.name} user={user} users={users} />}
      {activeTab === 'logbook' && <LogbookTab projectId={activeProjectId} projectName={activeProject?.name} user={user} />}
      {activeTab === 'inventory' && <InventoryTab projectId={activeProjectId} projectName={activeProject?.name} user={user} />}
    </div>
  );
}

// ─── Timeline Tab ──────────────────────────────────────────
function TimelineTab({ projectId, projectName, user, users }: { projectId: string; projectName?: string; user: any; users: any[] }) {
  const [updates, setUpdates] = useState<SiteUpdateRaw[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', type: 'progress' as 'progress' | 'milestone' | 'issue', visibility: 'public' as 'public' | 'private', taggedUserIds: [] as string[] });
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchUpdates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('site_updates')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (!error && data) setUpdates(data);
    setLoading(false);
  };

  useEffect(() => {
    if (projectId) fetchUpdates();
  }, [projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (form.visibility === 'private' && form.taggedUserIds.length === 0) {
      toast.error('Please select at least one member for a private update.');
      return;
    }
    setUploading(true);
    try {
      const mediaUrls: string[] = [];
      for (const file of uploadedFiles) {
        const ext = file.name.split('.').pop();
        const path = `site-updates/${projectId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('chat-media').upload(path, file);
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('chat-media').getPublicUrl(path);
          mediaUrls.push(publicUrl);
        }
      }
      const content = JSON.stringify({ title: form.title, description: form.description, type: form.type, taggedUserIds: form.taggedUserIds });
      const { error } = await supabase.from('site_updates').insert({
        project_id: projectId,
        content,
        media_urls: mediaUrls,
        posted_by: user?.id || ''
      });
      if (error) throw error;
      toast.success('Site update posted!');
      setForm({ title: '', description: '', type: 'progress', visibility: 'public', taggedUserIds: [] });
      setUploadedFiles([]);
      setShowForm(false);
      fetchUpdates();
    } catch (err: any) {
      toast.error(err.message || 'Failed to post update');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('site_updates').delete().eq('id', id);
    if (!error) {
      setUpdates(prev => prev.filter(u => u.id !== id));
      toast.success('Update deleted');
    }
  };

  const parseUpdate = (u: SiteUpdateRaw) => {
    try {
      const parsed = JSON.parse(u.content || '{}');
      return { title: parsed.title || u.content?.slice(0, 50) || 'Update', description: parsed.description || '', type: (parsed.type as 'progress' | 'milestone' | 'issue') || 'progress', taggedUserIds: parsed.taggedUserIds || [] };
    } catch {
      return { title: u.content?.slice(0, 50) || 'Update', description: u.content || '', type: 'progress' as const, taggedUserIds: [] as string[] };
    }
  };

  const filteredUpdates = useMemo(() => {
    return updates.filter(u => {
      const parsed = parseUpdate(u);
      
      // Privacy check
      if (parsed.taggedUserIds && parsed.taggedUserIds.length > 0) {
        if (u.posted_by !== user?.id && !parsed.taggedUserIds.includes(user?.id)) {
          return false;
        }
      }

      const matchesType = filterType === 'all' || parsed.type === filterType;
      const matchesSearch = !search || parsed.title.toLowerCase().includes(search.toLowerCase()) || parsed.description.toLowerCase().includes(search.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [updates, filterType, search, user?.id]);

  return (
    <div className="space-y-5">
      {/* Controls row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search updates..."
              className="pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-primary/20 w-48"
            />
          </div>
          <div className="flex gap-1">
            {['all', 'progress', 'milestone', 'issue'].map(f => (
              <button key={f} onClick={() => setFilterType(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${filterType === f ? 'bg-foreground text-background' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="gradient-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 flex items-center gap-2 shadow-lg shadow-primary/20 shrink-0">
          <Camera className="w-4 h-4" /> Post Update
        </button>
      </div>

      {/* Post form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <form onSubmit={handleSubmit} className="bg-card border border-border/40 rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Post Site Update — {projectName}</h3>
                <button type="button" onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
              </div>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Update title" className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" required />
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description (what happened on site today?)" rows={3} className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
              
              {/* Visibility and Tagging */}
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Visibility</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setForm(f => ({ ...f, visibility: 'public', taggedUserIds: [] }))} className={`px-4 py-2 rounded-xl text-xs font-medium transition-all border ${form.visibility === 'public' ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-background border-border text-muted-foreground hover:border-foreground/30'}`}>
                      Public (Everyone)
                    </button>
                    <button type="button" onClick={() => setForm(f => ({ ...f, visibility: 'private' }))} className={`px-4 py-2 rounded-xl text-xs font-medium transition-all border ${form.visibility === 'private' ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-background border-border text-muted-foreground hover:border-foreground/30'}`}>
                      Private (Tagged Members)
                    </button>
                  </div>
                </div>

                {form.visibility === 'private' && (
                  <div className="flex flex-col gap-2 p-4 rounded-xl bg-muted/30 border border-border/50">
                    <label className="text-xs font-medium text-muted-foreground">Select members who can see this update</label>
                    <div className="flex flex-wrap gap-2">
                      {users.filter(u => u.id !== user?.id).map(u => {
                        const isTagged = form.taggedUserIds.includes(u.id);
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => setForm(f => ({
                              ...f,
                              taggedUserIds: isTagged ? f.taggedUserIds.filter(id => id !== u.id) : [...f.taggedUserIds, u.id]
                            }))}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-1.5 ${isTagged ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-background border-border text-muted-foreground hover:border-foreground/30'}`}
                          >
                            {u.full_name || u.email || 'Team Member'}
                          </button>
                        )
                      })}
                    </div>
                    {form.taggedUserIds.length > 0 ? (
                      <p className="text-[10px] text-primary flex items-center gap-1 mt-1"><Users className="w-3 h-3" /> This update will only be visible to you and the tagged members.</p>
                    ) : (
                      <p className="text-[10px] text-destructive flex items-center gap-1 mt-1"><AlertTriangle className="w-3 h-3" /> Please select at least one member.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Type selector */}
              <div className="flex gap-2">
                {(['progress', 'milestone', 'issue'] as const).map(t => (
                  <button key={t} type="button" onClick={() => setForm(f => ({ ...f, type: t }))} className={`px-4 py-2 rounded-xl text-xs font-medium transition-all capitalize border ${form.type === t ? `${typeConfig[t].bg} ${typeConfig[t].color} ${typeConfig[t].border}` : 'border-border text-muted-foreground hover:border-foreground/30'}`}>
                    <span className="flex items-center gap-1.5">{typeConfig[t].icon} {t}</span>
                  </button>
                ))}
              </div>

              {/* Photo upload */}
              <div>
                <input type="file" multiple accept="image/*,video/*" ref={fileRef} className="hidden" onChange={e => setUploadedFiles(Array.from(e.target.files || []))} />
                <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all w-full justify-center">
                  <Upload className="w-4 h-4" /> {uploadedFiles.length > 0 ? `${uploadedFiles.length} file(s) selected` : 'Attach photos / videos'}
                </button>
                {uploadedFiles.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {uploadedFiles.map((f, i) => (
                      <div key={i} className="relative group">
                        <img src={URL.createObjectURL(f)} alt="" className="w-16 h-16 rounded-lg object-cover border border-border" />
                        <button type="button" onClick={() => setUploadedFiles(prev => prev.filter((_, j) => j !== i))} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button type="submit" disabled={uploading} className="gradient-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50">
                {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Posting...</> : 'Post Update'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <AISummaryPanel compact />

      {/* Timeline */}
      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : filteredUpdates.length === 0 ? (
        <div className="bg-card border border-border/40 rounded-2xl p-12 text-center text-muted-foreground">
          <Camera className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No updates yet. Post the first update for {projectName}!</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-5 top-2 bottom-2 w-px bg-border/50" />
          <div className="space-y-4">
            {filteredUpdates.map((u, i) => {
              const parsed = parseUpdate(u);
              const cfg = typeConfig[parsed.type] || typeConfig.progress;
              const poster = users.find(usr => usr.id === u.posted_by);
              const posterName = poster?.full_name || poster?.email || 'Team';
              return (
                <motion.div key={u.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="relative pl-12">
                  <div className={`absolute left-3 top-5 w-4 h-4 rounded-full bg-card border-2 border-border flex items-center justify-center`}>
                    <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  </div>
                  <div className={`bg-card border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow ${cfg.border}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`w-8 h-8 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0 ${cfg.color}`}>{cfg.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-foreground text-sm">{parsed.title}</h3>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>{parsed.type}</span>
                            {parsed.taggedUserIds && parsed.taggedUserIds.length > 0 && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground flex items-center gap-1" title="Only visible to tagged members">
                                <Users className="w-3 h-3" /> Private Update
                              </span>
                            )}
                          </div>
                          {parsed.description && <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{parsed.description}</p>}
                          
                          {/* Media */}
                          {u.media_urls && u.media_urls.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {u.media_urls.map((url, j) => (
                                <div key={j} className="relative group cursor-pointer" onClick={() => setLightboxImg(url)}>
                                  <img src={url} alt="" className="w-20 h-20 rounded-xl object-cover border border-border hover:opacity-90 transition-opacity" />
                                  <div className="absolute inset-0 bg-black/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Eye className="w-5 h-5 text-white" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {projectName}</span>
                            <span>·</span>
                            <span>{posterName}</span>
                            <span>·</span>
                            <span>{u.created_at ? new Date(u.created_at).toLocaleString() : ''}</span>
                          </div>
                        </div>
                      </div>
                      {user?.role !== 'client' && (
                        <button onClick={() => handleDelete(u.id)} className="text-muted-foreground/40 hover:text-destructive transition-colors shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImg && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setLightboxImg(null)} className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <motion.img initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} src={lightboxImg} alt="" className="max-w-full max-h-full rounded-2xl object-contain shadow-2xl" onClick={e => e.stopPropagation()} />
            <button onClick={() => setLightboxImg(null)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur text-white flex items-center justify-center hover:bg-white/20 transition-colors"><X className="w-5 h-5" /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Digital Logbook Tab ───────────────────────────────────
function LogbookTab({ projectId, projectName, user }: { projectId: string; projectName?: string; user: any }) {
  const STORAGE_KEY = `logbook_${projectId}`;
  const [entries, setEntries] = useState<LogbookEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    labor_count: '',
    weather: 'Sunny',
    temperature: '',
    tempUnit: '°C' as '°C' | '°F',
    materials_delivered: '',
    delays: 'None',
    notes: ''
  });

  const load = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setEntries(stored ? JSON.parse(stored) : []);
    } catch {
      setEntries([]);
    }
  };

  useEffect(() => { load(); }, [projectId]);

  const save = (newEntries: LogbookEntry[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries));
    setEntries(newEntries);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entry: LogbookEntry = {
      id: `log-${Date.now()}`,
      project_id: projectId,
      date: form.date,
      labor_count: Number(form.labor_count) || 0,
      weather: form.weather,
      temperature: form.temperature ? `${form.temperature}${form.tempUnit}` : '',
      materials_delivered: form.materials_delivered,
      delays: form.delays,
      notes: form.notes,
      created_by: user?.id || '',
      created_at: new Date().toISOString()
    };
    const newEntries = [entry, ...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    save(newEntries);
    setForm({ date: new Date().toISOString().split('T')[0], labor_count: '', weather: 'Sunny', temperature: '', tempUnit: '°C', materials_delivered: '', delays: 'None', notes: '' });
    setShowForm(false);
    toast.success('Log entry saved');
  };

  const handleDelete = (id: string) => {
    save(entries.filter(e => e.id !== id));
    toast.success('Entry deleted');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BookOpen className="w-4 h-4" />
          <span>{entries.length} log entries for {projectName}</span>
        </div>
        <button onClick={() => setShowForm(true)} className="gradient-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 flex items-center gap-2 shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" /> Add Log Entry
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <form onSubmit={handleSubmit} className="bg-card border border-border/40 rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">New Log Entry — {projectName}</h3>
                <button type="button" onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Date</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" required />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Workers on site</label>
                  <input type="number" min="0" value={form.labor_count} onChange={e => setForm(f => ({ ...f, labor_count: e.target.value }))} placeholder="e.g. 42" className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Temperature</label>
                  <div className="flex rounded-xl border border-border bg-background overflow-hidden focus-within:ring-2 focus-within:ring-primary/20">
                    <input
                      type="number"
                      step="0.1"
                      value={form.temperature}
                      onChange={e => setForm(f => ({ ...f, temperature: e.target.value }))}
                      placeholder="e.g. 28"
                      className="flex-1 px-4 py-2.5 text-sm outline-none bg-transparent"
                    />
                    <select
                      value={form.tempUnit}
                      onChange={e => setForm(f => ({ ...f, tempUnit: e.target.value as '°C' | '°F' }))}
                      className="px-3 py-2.5 text-sm border-l border-border bg-muted/40 text-foreground outline-none font-medium cursor-pointer"
                    >
                      <option value="°C">°C</option>
                      <option value="°F">°F</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Weather Conditions</label>
                  <select value={form.weather} onChange={e => setForm(f => ({ ...f, weather: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20">
                    {['Sunny', 'Clear', 'Cloudy', 'Overcast', 'Windy', 'Rainy', 'Snow'].map(w => <option key={w}>{w}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Materials Delivered</label>
                  <input type="text" value={form.materials_delivered} onChange={e => setForm(f => ({ ...f, materials_delivered: e.target.value }))} placeholder="e.g. 50 tons of rebar" className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Delays / Incidents</label>
                <input type="text" value={form.delays} onChange={e => setForm(f => ({ ...f, delays: e.target.value }))} placeholder="e.g. None / Crane out of service" className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Daily Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Describe the day's work, observations, safety notes..." rows={3} className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
              </div>
              <button type="submit" className="gradient-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 shadow-lg shadow-primary/20">Save Entry</button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {entries.length === 0 ? (
        <div className="bg-card border border-border/40 rounded-2xl p-12 text-center text-muted-foreground">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No logbook entries yet. Start recording daily site activities!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry, i) => (
            <motion.div key={entry.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="bg-card border border-border/40 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground">{new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</h3>
                  {entry.notes && <p className="text-sm text-muted-foreground mt-1">{entry.notes}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {entry.delays !== 'None' && entry.delays && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-destructive/10 text-destructive font-medium flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Delay
                    </span>
                  )}
                  <button onClick={() => handleDelete(entry.id)} className="text-muted-foreground/40 hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-border/30">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center"><Users className="w-4 h-4 text-primary" /></div>
                  <div><div className="text-xs text-muted-foreground">Workers</div><div className="text-sm font-semibold text-foreground">{entry.labor_count}</div></div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-warning/10 flex items-center justify-center">
                    {weatherIcons[entry.weather] || <Thermometer className="w-4 h-4 text-warning" />}
                  </div>
                  <div><div className="text-xs text-muted-foreground">Weather</div><div className="text-sm font-semibold text-foreground">{entry.weather} {entry.temperature && `· ${entry.temperature}`}</div></div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-success/10 flex items-center justify-center"><Package className="w-4 h-4 text-success" /></div>
                  <div><div className="text-xs text-muted-foreground">Materials</div><div className="text-sm font-semibold text-foreground truncate max-w-[100px]">{entry.materials_delivered || 'None'}</div></div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-destructive/10 flex items-center justify-center"><CloudRain className="w-4 h-4 text-destructive" /></div>
                  <div><div className="text-xs text-muted-foreground">Delays</div><div className={`text-sm font-semibold ${entry.delays !== 'None' && entry.delays ? 'text-destructive' : 'text-foreground'}`}>{entry.delays || 'None'}</div></div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Inventory Tab ─────────────────────────────────────────
function InventoryTab({ projectId, projectName, user }: { projectId: string; projectName?: string; user: any }) {
  const STORAGE_KEY = `inventory_${projectId}`;
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    material: '',
    unit: 'tons',
    total_required: '',
    delivered: '',
    on_site: '',
    used: '',
    supplier: ''
  });

  const load = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setItems(stored ? JSON.parse(stored) : []);
    } catch {
      setItems([]);
    }
  };

  useEffect(() => { load(); }, [projectId]);

  const save = (newItems: InventoryItem[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
    setItems(newItems);
  };

  const resetForm = () => {
    setForm({ material: '', unit: 'tons', total_required: '', delivered: '', on_site: '', used: '', supplier: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (item: InventoryItem) => {
    setForm({
      material: item.material,
      unit: item.unit,
      total_required: String(item.total_required),
      delivered: String(item.delivered),
      on_site: String(item.on_site),
      used: String(item.used),
      supplier: item.supplier
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.material.trim()) return;
    if (editingId) {
      const updated = items.map(item => item.id === editingId ? {
        ...item, ...form,
        total_required: Number(form.total_required) || 0,
        delivered: Number(form.delivered) || 0,
        on_site: Number(form.on_site) || 0,
        used: Number(form.used) || 0,
        last_updated: new Date().toISOString()
      } : item);
      save(updated);
      toast.success('Item updated');
    } else {
      const newItem: InventoryItem = {
        id: `inv-${Date.now()}`,
        project_id: projectId,
        material: form.material,
        unit: form.unit,
        total_required: Number(form.total_required) || 0,
        delivered: Number(form.delivered) || 0,
        on_site: Number(form.on_site) || 0,
        used: Number(form.used) || 0,
        supplier: form.supplier,
        last_updated: new Date().toISOString()
      };
      save([...items, newItem]);
      toast.success('Material added to inventory');
    }
    resetForm();
  };

  const handleDelete = (id: string) => {
    save(items.filter(i => i.id !== id));
    toast.success('Item removed');
  };

  const totalDeliveredPct = items.length > 0
    ? Math.round(items.reduce((s, i) => s + (i.total_required > 0 ? (i.delivered / i.total_required) : 0), 0) / items.length * 100)
    : 0;

  const lowStock = items.filter(i => i.total_required > 0 && (i.delivered / i.total_required) < 0.4);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BarChart3 className="w-4 h-4" />
          <span>{items.length} materials tracked for {projectName}</span>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="gradient-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 flex items-center gap-2 shadow-lg shadow-primary/20 shrink-0">
          <Plus className="w-4 h-4" /> Add Material
        </button>
      </div>

      {/* Low stock alerts */}
      {lowStock.length > 0 && (
        <div className="bg-destructive/5 border border-destructive/10 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-destructive">Low Inventory Alert</p>
            <p className="text-xs text-muted-foreground mt-0.5">{lowStock.map(i => i.material).join(', ')} are below 40% delivered.</p>
          </div>
        </div>
      )}

      {/* Add/Edit form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <form onSubmit={handleSubmit} className="bg-card border border-border/40 rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">{editingId ? 'Edit Material' : 'Add Material'} — {projectName}</h3>
                <button type="button" onClick={resetForm} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs text-muted-foreground mb-1.5 block">Material Name</label>
                  <input value={form.material} onChange={e => setForm(f => ({ ...f, material: e.target.value }))} placeholder="e.g. Structural Steel" className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" required />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Unit</label>
                  <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20">
                    {['tons', 'kg', 'cubic yards', 'cubic meters', 'units', 'sq ft', 'sq m', 'meters', 'ft', 'liters', 'bags'].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { key: 'total_required', label: 'Total Required' },
                  { key: 'delivered', label: 'Delivered' },
                  { key: 'on_site', label: 'On-Site Stock' },
                  { key: 'used', label: 'Used / Consumed' }
                ].map(field => (
                  <div key={field.key}>
                    <label className="text-xs text-muted-foreground mb-1.5 block">{field.label}</label>
                    <input type="number" min="0" step="any" value={(form as any)[field.key]} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))} placeholder="0" className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                ))}
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Supplier</label>
                <input value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} placeholder="e.g. TataSteels Pvt Ltd" className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="gradient-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 shadow-lg shadow-primary/20">
                  {editingId ? 'Update Material' : 'Add Material'}
                </button>
                <button type="button" onClick={resetForm} className="px-6 py-2.5 rounded-xl text-sm font-medium border border-border text-muted-foreground hover:text-foreground">Cancel</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {items.length === 0 ? (
        <div className="bg-card border border-border/40 rounded-2xl p-12 text-center text-muted-foreground">
          <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No materials tracked yet. Add materials to monitor delivery and usage.</p>
        </div>
      ) : (
        <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-sm">
          {/* Summary header */}
          <div className="px-6 py-4 border-b border-border/40 bg-muted/20 flex items-center justify-between">
            <h3 className="font-semibold text-foreground text-sm">Material Inventory — Delivered vs Required</h3>
            <span className="text-xs text-muted-foreground">{totalDeliveredPct}% avg delivery</span>
          </div>
          <div className="divide-y divide-border/30">
            {items.map((item, i) => {
              const deliveredPct = item.total_required > 0 ? Math.min(Math.round((item.delivered / item.total_required) * 100), 100) : 0;
              const usedPct = item.delivered > 0 ? Math.min(Math.round((item.used / item.delivered) * 100), 100) : 0;
              const isLow = deliveredPct < 40;
              const isGood = deliveredPct >= 70;
              return (
                <motion.div key={item.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="p-5 hover:bg-muted/10 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground text-sm">{item.material}</span>
                        {isLow && <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium">Low Stock</span>}
                      </div>
                      {item.supplier && <span className="text-xs text-muted-foreground">Supplier: {item.supplier}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(item)} className="text-xs px-2.5 py-1 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all">Edit</button>
                      <button onClick={() => handleDelete(item.id)} className="text-muted-foreground/40 hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>

                  {/* Delivery progress */}
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground">Delivery ({deliveredPct}%)</span>
                        <span className="font-medium text-foreground">{item.delivered.toLocaleString()} / {item.total_required.toLocaleString()} {item.unit}</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${deliveredPct}%` }}
                          transition={{ duration: 0.8, delay: 0.2 + i * 0.08 }}
                          className={`h-full rounded-full ${isGood ? 'bg-success' : isLow ? 'bg-warning' : 'gradient-primary'}`}
                        />
                      </div>
                    </div>
                    {item.delivered > 0 && (
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-muted-foreground">Consumed ({usedPct}%)</span>
                          <span className="font-medium text-foreground">{item.used.toLocaleString()} used · {Math.max(0, item.on_site).toLocaleString()} on-site</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${usedPct}%` }}
                            transition={{ duration: 0.8, delay: 0.3 + i * 0.08 }}
                            className="h-full rounded-full bg-muted-foreground/40"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] text-muted-foreground mt-2">Last updated: {new Date(item.last_updated).toLocaleDateString()}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
