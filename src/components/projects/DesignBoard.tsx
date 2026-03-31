import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StickyNote, Grid3X3, Trash2, Check, X, Clock, MessageSquare, User } from 'lucide-react';

interface DesignItem {
  id: string;
  title: string;
  image: string;
  category: string;
  note?: string;
  price?: string;
  status: 'rough' | 'confirmed' | 'discarded';
  addedBy: string;
  date: string;
  rejectionReason?: string;
  rejectedBy?: string;
  position?: { x: number; y: number; rotate: number };
}

const initialItems: DesignItem[] = [
  { id: '1', title: 'Marble Accent Wall', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop', category: 'Materials', note: 'Consider for feature wall behind sofa', price: '$4,200', status: 'rough', addedBy: 'Sarah A.', date: 'Mar 25', position: { x: 5, y: 5, rotate: -2 } },
  { id: '2', title: 'Pendant Light Cluster', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop', category: 'Lighting', note: 'Three-piece brass cluster for dining', price: '$1,850', status: 'rough', addedBy: 'Sarah A.', date: 'Mar 26', position: { x: 52, y: 8, rotate: 1.5 } },
  { id: '3', title: 'Wooden Floor Tiles', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop', category: 'Flooring', note: 'Herringbone pattern, oak finish', price: '$3,600', status: 'rough', addedBy: 'Mike J.', date: 'Mar 27', position: { x: 28, y: 45, rotate: -1 } },
  { id: '4', title: 'Velvet Sofa — Forest Green', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop', category: 'Furniture', price: '$2,900', status: 'confirmed', addedBy: 'Sarah A.', date: 'Mar 20' },
  { id: '5', title: 'Crystal Chandelier', image: 'https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?w=400&h=300&fit=crop', category: 'Lighting', price: '$5,400', status: 'confirmed', addedBy: 'Sarah A.', date: 'Mar 18' },
  { id: '6', title: 'Black Marble Countertop', image: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=400&h=300&fit=crop', category: 'Materials', price: '$6,200', status: 'discarded', addedBy: 'Mike J.', date: 'Mar 15', rejectionReason: 'Too dark for the space, clashes with warm palette', rejectedBy: 'Client' },
  { id: '7', title: 'Industrial Pendant', image: 'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=400&h=300&fit=crop', category: 'Lighting', price: '$450', status: 'discarded', addedBy: 'Sarah A.', date: 'Mar 12', rejectionReason: 'Style inconsistent with overall aesthetic', rejectedBy: 'Architect' },
];

type BoardTab = 'rough' | 'confirmed' | 'discarded';

export default function DesignBoard() {
  const [items, setItems] = useState(initialItems);
  const [activeTab, setActiveTab] = useState<BoardTab>('rough');

  const tabs: { key: BoardTab; label: string; icon: React.ElementType; color: string }[] = [
    { key: 'rough', label: 'Rough Board', icon: StickyNote, color: 'text-warning' },
    { key: 'confirmed', label: 'Confirmed', icon: Check, color: 'text-success' },
    { key: 'discarded', label: 'Discarded', icon: Trash2, color: 'text-destructive' },
  ];

  const filtered = items.filter(i => i.status === activeTab);

  const moveItem = (id: string, to: 'confirmed' | 'discarded') => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: to } : i));
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'gradient-primary text-primary-foreground shadow-lg shadow-primary/20'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-primary-foreground/20' : 'bg-muted'}`}>
              {items.filter(i => i.status === tab.key).length}
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ROUGH BOARD — Moodboard style */}
        {activeTab === 'rough' && (
          <motion.div
            key="rough"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative min-h-[500px] bg-gradient-to-br from-warning/5 to-muted/30 rounded-2xl border-2 border-dashed border-warning/20 p-8 overflow-hidden"
          >
            {/* Pinboard texture */}
            <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9, rotate: item.position?.rotate || 0 }}
                  animate={{ opacity: 1, scale: 1, rotate: item.position?.rotate || 0 }}
                  whileHover={{ rotate: 0, scale: 1.03, zIndex: 10 }}
                  transition={{ delay: i * 0.08, type: 'spring' }}
                  className="bg-card rounded-2xl shadow-[0_4px_24px_-6px_rgba(0,0,0,0.1)] overflow-hidden border border-border/50 cursor-pointer"
                >
                  <div className="relative h-40 overflow-hidden">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    {item.price && (
                      <span className="absolute bottom-2 right-2 text-[11px] px-2.5 py-1 rounded-full bg-card/90 backdrop-blur-sm font-semibold text-foreground">{item.price}</span>
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
                        <span className="text-[11px] text-muted-foreground">{item.category}</span>
                      </div>
                    </div>
                    {item.note && (
                      <div className="bg-warning/5 border border-warning/10 rounded-lg px-3 py-2">
                        <p className="text-xs text-muted-foreground italic">📌 {item.note}</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1"><User className="w-3 h-3" />{item.addedBy}</span>
                      <div className="flex gap-1.5">
                        <button onClick={() => moveItem(item.id, 'confirmed')} className="p-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => moveItem(item.id, 'discarded')} className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-20 text-muted-foreground">
                <StickyNote className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No rough ideas yet. Start pinning inspiration!</p>
              </div>
            )}
          </motion.div>
        )}

        {/* CONFIRMED BOARD — Clean grid */}
        {activeTab === 'confirmed' && (
          <motion.div key="confirmed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="soft-card overflow-hidden group"
                >
                  <div className="relative h-44 overflow-hidden">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <span className="absolute top-3 right-3 text-[11px] px-3 py-1 rounded-full bg-success/10 text-success font-semibold backdrop-blur-md">
                      ✓ Confirmed
                    </span>
                  </div>
                  <div className="p-5 space-y-3">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{item.category}</span>
                        {item.price && <span className="text-xs font-medium text-foreground">{item.price}</span>}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" />{item.addedBy}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{item.date}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-20 text-muted-foreground soft-card">
                <Grid3X3 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No confirmed items yet</p>
              </div>
            )}
          </motion.div>
        )}

        {/* DISCARDED BOARD */}
        {activeTab === 'discarded' && (
          <motion.div key="discarded" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {filtered.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="soft-card p-5 flex gap-5 items-start opacity-75 hover:opacity-100 transition-opacity"
              >
                <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 grayscale">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground line-through decoration-destructive/40">{item.title}</h4>
                      <span className="text-[11px] text-muted-foreground">{item.category} {item.price && `· ${item.price}`}</span>
                    </div>
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-destructive/10 text-destructive font-medium">Rejected</span>
                  </div>
                  {item.rejectionReason && (
                    <div className="bg-destructive/5 border border-destructive/10 rounded-lg px-3 py-2">
                      <p className="text-xs text-muted-foreground"><MessageSquare className="w-3 h-3 inline mr-1" />"{item.rejectionReason}"</p>
                      {item.rejectedBy && <p className="text-[10px] text-muted-foreground mt-1">— {item.rejectedBy} · {item.date}</p>}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-20 text-muted-foreground soft-card">
                <Trash2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No discarded items</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
