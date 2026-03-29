import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Camera, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function SiteUpdatesPage() {
  const { siteUpdates, addSiteUpdate } = useData();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', type: 'progress' as 'progress' | 'issue' | 'milestone' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    addSiteUpdate({ ...form, projectId: '1', author: 'You', createdAt: new Date().toISOString() });
    setForm({ title: '', description: '', type: 'progress' });
    setShowForm(false);
    toast.success('Site update posted');
  };

  const typeIcon = (type: string) => type === 'milestone' ? <CheckCircle className="w-4 h-4 text-success" /> : type === 'issue' ? <AlertTriangle className="w-4 h-4 text-destructive" /> : <Clock className="w-4 h-4 text-primary" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Site Updates</h1>
          <p className="text-muted-foreground text-sm mt-1">Timeline of construction progress and updates</p>
        </div>
        <button onClick={() => setShowForm(true)} className="gradient-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 flex items-center gap-2">
          <Camera className="w-4 h-4" /> Post Update
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Post Site Update</h3>
                <button type="button" onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
              </div>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Update title" className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" required />
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" rows={3} className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
              <div className="flex gap-4">
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))} className="px-4 py-2.5 rounded-lg border border-border bg-background text-sm outline-none">
                  <option value="progress">Progress</option>
                  <option value="milestone">Milestone</option>
                  <option value="issue">Issue</option>
                </select>
                <button type="submit" className="gradient-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-medium hover:opacity-90">Post</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />
        <div className="space-y-4">
          {siteUpdates.map((u, i) => (
            <motion.div key={u.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="relative pl-12">
              <div className="absolute left-3 top-5 w-4 h-4 rounded-full bg-card border-2 border-border flex items-center justify-center">
                <div className={`w-2 h-2 rounded-full ${u.type === 'milestone' ? 'bg-success' : u.type === 'issue' ? 'bg-destructive' : 'bg-primary'}`} />
              </div>
              <div className="glass-card p-5">
                <div className="flex items-start gap-3">
                  {typeIcon(u.type)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground text-sm">{u.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        u.type === 'milestone' ? 'bg-success/10 text-success' : u.type === 'issue' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
                      }`}>{u.type}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{u.description}</p>
                    <div className="text-xs text-muted-foreground mt-2">{u.author} · {new Date(u.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
