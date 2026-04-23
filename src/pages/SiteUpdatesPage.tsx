import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Camera, AlertTriangle, CheckCircle, Clock, CloudRain, Users, Package, Thermometer } from 'lucide-react';
import { toast } from 'sonner';
import AISummaryPanel from '@/components/ai/AISummaryPanel';

export default function SiteUpdatesPage() {
  const { siteUpdates, addSiteUpdate } = useData();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', type: 'progress' as 'progress' | 'issue' | 'milestone' });
  const [activeTab, setActiveTab] = useState<'timeline' | 'logbook' | 'inventory'>('timeline');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    addSiteUpdate({ ...form, projectId: '1', author: 'You', createdAt: new Date().toISOString() });
    setForm({ title: '', description: '', type: 'progress' });
    setShowForm(false);
    toast.success('Site update posted');
  };

  const typeIcon = (type: string) => type === 'milestone' ? <CheckCircle className="w-4 h-4 text-success" /> : type === 'issue' ? <AlertTriangle className="w-4 h-4 text-destructive" /> : <Clock className="w-4 h-4 text-primary" />;

  const logbookEntries = [
    { date: '2025-03-28', labor: 47, weather: 'Clear, 72°F', materials: 'Steel beams delivered', delays: 'None' },
    { date: '2025-03-27', labor: 32, weather: 'High winds, 58°F', materials: 'Concrete mix', delays: 'Crane suspended — wind' },
    { date: '2025-03-26', labor: 45, weather: 'Overcast, 65°F', materials: 'Electrical conduit', delays: 'None' },
    { date: '2025-03-25', labor: 40, weather: 'Sunny, 70°F', materials: 'Rebar delivery', delays: 'None' },
  ];

  const inventory = [
    { material: 'Structural Steel', delivered: 850, total: 1200, unit: 'tons' },
    { material: 'Concrete Mix', delivered: 3200, total: 4500, unit: 'cubic yards' },
    { material: 'Rebar', delivered: 420, total: 600, unit: 'tons' },
    { material: 'Glass Panels', delivered: 180, total: 560, unit: 'units' },
    { material: 'Electrical Wire', delivered: 25000, total: 40000, unit: 'ft' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Site Updates</h1>
          <p className="text-muted-foreground text-sm mt-1">Monitoring, logbook, and inventory</p>
        </div>
        <button onClick={() => setShowForm(true)} className="gradient-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 flex items-center gap-2">
          <Camera className="w-4 h-4" /> Post Update
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['timeline', 'logbook', 'inventory'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize ${activeTab === tab ? 'gradient-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}>
            {tab === 'logbook' ? 'Digital Logbook' : tab === 'inventory' ? 'Inventory Tracking' : 'Timeline'}
          </button>
        ))}
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

      <AISummaryPanel />

      {activeTab === 'timeline' && (
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
      )}

      {activeTab === 'logbook' && (
        <div className="space-y-3">
          {logbookEntries.map((entry, i) => (
            <motion.div key={entry.date} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground text-sm">{new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</h3>
                {entry.delays !== 'None' && <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium">Delay</span>}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <div><div className="text-xs text-muted-foreground">Labor</div><div className="text-sm font-medium text-foreground">{entry.labor} workers</div></div>
                </div>
                <div className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-warning" />
                  <div><div className="text-xs text-muted-foreground">Weather</div><div className="text-sm font-medium text-foreground">{entry.weather}</div></div>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-success" />
                  <div><div className="text-xs text-muted-foreground">Materials</div><div className="text-sm font-medium text-foreground">{entry.materials}</div></div>
                </div>
                <div className="flex items-center gap-2">
                  <CloudRain className="w-4 h-4 text-destructive" />
                  <div><div className="text-xs text-muted-foreground">Delays</div><div className="text-sm font-medium text-foreground">{entry.delays}</div></div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="glass-card p-5">
          <h3 className="font-semibold text-foreground mb-4">Material Inventory — Delivered vs Required</h3>
          <div className="space-y-4">
            {inventory.map((item, i) => {
              const pct = Math.round((item.delivered / item.total) * 100);
              return (
                <motion.div key={item.material} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-medium text-foreground">{item.material}</span>
                    <span className="text-muted-foreground">{item.delivered.toLocaleString()} / {item.total.toLocaleString()} {item.unit} ({pct}%)</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: 0.2 + i * 0.1 }} className={`h-full rounded-full ${pct >= 70 ? 'bg-success' : pct >= 40 ? 'gradient-primary' : 'bg-warning'}`} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
