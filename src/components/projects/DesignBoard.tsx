import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StickyNote, Grid3X3, Trash2, Check, X, Clock, MessageSquare, User, AlertTriangle, ArrowRight, Pin } from 'lucide-react';

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
  previousStatus?: string;
}

const initialItems: DesignItem[] = [
  { id: '1', title: 'Marble Accent Wall', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop', category: 'Materials', note: 'Consider for feature wall behind sofa', price: '$4,200', status: 'rough', addedBy: 'Sarah A.', date: 'Mar 25' },
  { id: '2', title: 'Pendant Light Cluster', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop', category: 'Lighting', note: 'Three-piece brass cluster for dining', price: '$1,850', status: 'rough', addedBy: 'Sarah A.', date: 'Mar 26' },
  { id: '3', title: 'Wooden Floor Tiles', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop', category: 'Flooring', note: 'Herringbone pattern, oak finish', price: '$3,600', status: 'rough', addedBy: 'Mike J.', date: 'Mar 27' },
  { id: '4', title: 'Velvet Sofa — Forest Green', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop', category: 'Furniture', price: '$2,900', status: 'confirmed', addedBy: 'Sarah A.', date: 'Mar 20' },
  { id: '5', title: 'Crystal Chandelier', image: 'https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?w=400&h=300&fit=crop', category: 'Lighting', price: '$5,400', status: 'confirmed', addedBy: 'Sarah A.', date: 'Mar 18' },
  { id: '6', title: 'Wood Coffee Table', image: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=400&h=300&fit=crop', category: 'Furniture', price: '$1,200', status: 'confirmed', addedBy: 'Mike J.', date: 'Mar 22' },
  { id: '7', title: 'Black Marble Countertop', image: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=400&h=300&fit=crop', category: 'Materials', price: '$6,200', status: 'discarded', addedBy: 'Mike J.', date: 'Mar 15', rejectionReason: 'Color too bold for the space, client preferred a lighter tone.', rejectedBy: 'Sarah M. (Client)', previousStatus: 'Previously Confirmed' },
  { id: '8', title: 'Industrial Pendant', image: 'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=400&h=300&fit=crop', category: 'Lighting', price: '$450', status: 'discarded', addedBy: 'Sarah A.', date: 'Mar 12', rejectionReason: 'Too heavy visually and not aligned with the minimal theme.', rejectedBy: 'Omar A. (Architect)', previousStatus: 'Previously Confirmed' },
];

type BoardTab = 'rough' | 'confirmed' | 'discarded';

export default function DesignBoard() {
  const [items, setItems] = useState(initialItems);
  const [activeTab, setActiveTab] = useState<BoardTab>('rough');

  const tabs: { key: BoardTab; label: string; icon: React.ElementType }[] = [
    { key: 'rough', label: 'Rough Board' , icon: StickyNote },
    { key: 'confirmed', label: 'Confirmed', icon: Check },
    { key: 'discarded', label: 'Discarded', icon: Trash2 },
  ];

  const filtered = items.filter(i => i.status === activeTab);

  const moveItem = (id: string, to: 'confirmed' | 'discarded') => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: to } : i));
  };

  // Group confirmed items by category
  const confirmedByCategory: Record<string, typeof items> = {};
  if (activeTab === 'confirmed') {
    filtered.forEach(item => {
      if (!confirmedByCategory[item.category]) confirmedByCategory[item.category] = [];
      confirmedByCategory[item.category].push(item);
    });
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-2">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
              activeTab === tab.key
                ? 'gradient-primary text-primary-foreground shadow-lg shadow-primary/20'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted hover:shadow-sm'
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
        {/* ROUGH BOARD — Moodboard / Pinboard style */}
        {activeTab === 'rough' && (
          <motion.div
            key="rough"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative min-h-[500px] bg-gradient-to-br from-warm-100/50 to-muted/20 rounded-2xl border-2 border-dashed border-primary/15 p-8 overflow-hidden"
          >
            {/* Pinboard texture */}
            <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            
            {/* Scattered tape / decoration elements */}
            <div className="absolute top-4 right-8 text-xs italic text-muted-foreground/40 rotate-2">📌 Pin your inspiration</div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
              {filtered.map((item, i) => {
                const rotations = [-2.5, 1.5, -1, 2, -1.5, 0.5];
                const rot = rotations[i % rotations.length];
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.85, rotate: rot * 2 }}
                    animate={{ opacity: 1, scale: 1, rotate: rot }}
                    whileHover={{ rotate: 0, scale: 1.04, zIndex: 20, y: -8, boxShadow: '0 20px 60px -12px rgba(0,0,0,0.15)' }}
                    transition={{ delay: i * 0.08, type: 'spring', stiffness: 200, damping: 18 }}
                    className="bg-card rounded-2xl shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] overflow-hidden border border-border/50 cursor-pointer group"
                  >
                    {/* Tape decoration */}
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-12 h-4 bg-primary/10 rounded-b-md z-10 opacity-60" />
                    
                    <div className="relative h-40 overflow-hidden">
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      {item.price && (
                        <span className="absolute bottom-2 right-2 text-[11px] px-2.5 py-1 rounded-full bg-card/90 backdrop-blur-sm font-semibold text-foreground shadow-sm">{item.price}</span>
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
                        <div className="bg-primary/5 border border-primary/10 rounded-lg px-3 py-2">
                          <p className="text-xs text-muted-foreground italic flex items-start gap-1.5">
                            <Pin className="w-3 h-3 mt-0.5 text-primary flex-shrink-0" />
                            {item.note}
                          </p>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1"><User className="w-3 h-3" />{item.addedBy}</span>
                        <div className="flex gap-1.5">
                          <motion.button
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => moveItem(item.id, 'confirmed')}
                            className="p-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => moveItem(item.id, 'discarded')}
                            className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-20 text-muted-foreground">
                <StickyNote className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No rough ideas yet. Start pinning inspiration!</p>
              </div>
            )}
          </motion.div>
        )}

        {/* CONFIRMED BOARD — Categorized grid */}
        {activeTab === 'confirmed' && (
          <motion.div
            key="confirmed"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4 }}
            className="space-y-8"
          >
            {Object.entries(confirmedByCategory).map(([category, categoryItems]) => (
              <div key={category}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-foreground">{category}</h4>
                  <span className="text-[10px] text-muted-foreground">All ›</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryItems.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      whileHover={{ y: -6, boxShadow: '0 16px 48px -12px rgba(0,0,0,0.12)' }}
                      className="soft-card overflow-hidden group cursor-pointer"
                    >
                      <div className="relative h-44 overflow-hidden">
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        <span className="absolute top-3 right-3 text-[11px] px-3 py-1 rounded-full bg-success/10 text-success font-semibold backdrop-blur-md border border-success/20">
                          ✓ Approved
                        </span>
                      </div>
                      <div className="p-5 space-y-2">
                        <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
                        <div className="flex items-center gap-2">
                          {item.price && <span className="text-xs font-medium text-foreground">{item.price}</span>}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                          <span className="flex items-center gap-1"><User className="w-3 h-3" />{item.addedBy}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Confirmed {item.date}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-20 text-muted-foreground soft-card">
                <Grid3X3 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No confirmed items yet</p>
              </div>
            )}
          </motion.div>
        )}

        {/* DISCARDED BOARD — With rejection history */}
        {activeTab === 'discarded' && (
          <motion.div
            key="discarded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Info banner */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/5 border border-destructive/10">
              <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                Items <span className="font-medium text-foreground">previously in Confirmed</span> are highlighted to show design evolution and decision changes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ y: -4 }}
                  className="soft-card overflow-hidden group"
                >
                  {/* Previously confirmed badge */}
                  {item.previousStatus && (
                    <div className="px-4 py-2 bg-destructive/5 border-b border-destructive/10 flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        ⚠ {item.previousStatus} → Discarded
                      </span>
                    </div>
                  )}
                  <div className="flex gap-4 p-5">
                    <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 grayscale group-hover:grayscale-0 transition-all duration-500">
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 space-y-2 min-w-0">
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
                        <span className="text-[11px] text-muted-foreground">{item.category} {item.price && `· ${item.price}`}</span>
                      </div>
                      {item.rejectionReason && (
                        <div className="bg-destructive/5 border border-destructive/10 rounded-lg px-3 py-2">
                          <p className="text-[11px] font-medium text-muted-foreground mb-1">Reason for Rejection:</p>
                          <p className="text-xs text-muted-foreground italic">{item.rejectionReason}</p>
                          {item.rejectedBy && (
                            <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                              <User className="w-3 h-3" /> Rejected by: <span className="font-medium">{item.rejectedBy}</span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

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
