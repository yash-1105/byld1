import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  StickyNote, Grid3X3, Trash2, Check, X, Clock, MessageSquare,
  User, AlertTriangle, Pin, GripVertical, Tag, Filter, Eye,
  ChevronDown, Plus, Sparkles, History, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

interface ActivityLog {
  action: string;
  user: string;
  time: string;
}

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
  tags?: string[];
  rejectionReason?: string;
  rejectedBy?: string;
  previousStatus?: string;
  activity?: ActivityLog[];
}

const segments = ['All', 'Living Room', 'Kitchen', 'Bedroom', 'Bathroom', 'Outdoor'];

const residentialItems: DesignItem[] = [
  {
    id: '1', title: 'Marble Accent Wall', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&h=400&fit=crop',
    category: 'Materials', note: 'Consider for feature wall behind sofa', price: '$4,200', status: 'rough',
    addedBy: 'Sarah A.', date: 'Mar 25', tags: ['Living Room', 'Premium'],
    activity: [{ action: 'Added to Rough Board', user: 'Sarah A.', time: '2 days ago' }],
  },
  {
    id: '2', title: 'Pendant Light Cluster', image: 'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=500&h=400&fit=crop',
    category: 'Lighting', note: 'Three-piece brass cluster for dining', price: '$1,850', status: 'rough',
    addedBy: 'Sarah A.', date: 'Mar 26', tags: ['Kitchen', 'Dining'],
    activity: [{ action: 'Added to Rough Board', user: 'Sarah A.', time: '1 day ago' }],
  },
  {
    id: '3', title: 'Wooden Floor Tiles', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=500&h=400&fit=crop',
    category: 'Flooring', note: 'Herringbone pattern, oak finish', price: '$3,600', status: 'rough',
    addedBy: 'Mike J.', date: 'Mar 27', tags: ['Living Room', 'Flooring'],
    activity: [{ action: 'Added to Rough Board', user: 'Mike J.', time: '5 hours ago' }],
  },
  {
    id: '9', title: 'Minimalist Wall Shelf', image: 'https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?w=500&h=400&fit=crop',
    category: 'Furniture', note: 'Floating shelf for bedroom alcove', price: '$320', status: 'rough',
    addedBy: 'Sarah A.', date: 'Mar 28', tags: ['Bedroom', 'Minimal'],
    activity: [{ action: 'Added to Rough Board', user: 'Sarah A.', time: '1 hour ago' }],
  },
  {
    id: '10', title: 'Brass Door Handles', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=500&h=300&fit=crop',
    category: 'Hardware', note: 'Brushed brass for all interior doors', price: '$85/ea', status: 'rough',
    addedBy: 'Mike J.', date: 'Mar 28', tags: ['Hardware', 'Premium'],
    activity: [{ action: 'Added to Rough Board', user: 'Mike J.', time: '30 mins ago' }],
  },
  {
    id: '4', title: 'Velvet Sofa — Forest Green', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&h=400&fit=crop',
    category: 'Furniture', price: '$2,900', status: 'confirmed', addedBy: 'Sarah A.', date: 'Mar 20',
    tags: ['Living Room', 'Seating'],
    activity: [
      { action: 'Added to Rough Board', user: 'Sarah A.', time: 'Mar 18' },
      { action: 'Approved by Client', user: 'David P.', time: 'Mar 20' },
    ],
  },
  {
    id: '5', title: 'Crystal Chandelier', image: 'https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?w=500&h=400&fit=crop',
    category: 'Lighting', price: '$5,400', status: 'confirmed', addedBy: 'Sarah A.', date: 'Mar 18',
    tags: ['Living Room', 'Statement'],
    activity: [
      { action: 'Added to Rough Board', user: 'Sarah A.', time: 'Mar 15' },
      { action: 'Approved by Architect', user: 'Sarah A.', time: 'Mar 18' },
    ],
  },
  {
    id: '6', title: 'Wood Coffee Table', image: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=500&h=400&fit=crop',
    category: 'Furniture', price: '$1,200', status: 'confirmed', addedBy: 'Mike J.', date: 'Mar 22',
    tags: ['Living Room', 'Furniture'],
    activity: [
      { action: 'Added to Rough Board', user: 'Mike J.', time: 'Mar 19' },
      { action: 'Approved by Client', user: 'David P.', time: 'Mar 22' },
    ],
  },
  {
    id: '11', title: 'Ceramic Basin — Matte White', image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&h=400&fit=crop',
    category: 'Fixtures', price: '$890', status: 'confirmed', addedBy: 'Sarah A.', date: 'Mar 24',
    tags: ['Bathroom', 'Fixtures'],
    activity: [
      { action: 'Added to Rough Board', user: 'Sarah A.', time: 'Mar 21' },
      { action: 'Approved by Client', user: 'David P.', time: 'Mar 24' },
    ],
  },
  {
    id: '7', title: 'Black Marble Countertop', image: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=500&h=400&fit=crop',
    category: 'Materials', price: '$6,200', status: 'discarded', addedBy: 'Mike J.', date: 'Mar 15',
    tags: ['Kitchen'],
    rejectionReason: 'Color too bold for the space, client preferred a lighter tone.',
    rejectedBy: 'Sarah M. (Client)', previousStatus: 'Previously Confirmed',
    activity: [
      { action: 'Added to Rough Board', user: 'Mike J.', time: 'Mar 10' },
      { action: 'Moved to Confirmed', user: 'Sarah A.', time: 'Mar 12' },
      { action: 'Rejected by Client', user: 'Sarah M.', time: 'Mar 15' },
    ],
  },
  {
    id: '8', title: 'Industrial Pendant', image: 'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=500&h=300&fit=crop',
    category: 'Lighting', price: '$450', status: 'discarded', addedBy: 'Sarah A.', date: 'Mar 12',
    tags: ['Kitchen'],
    rejectionReason: 'Too heavy visually and not aligned with the minimal theme.',
    rejectedBy: 'Omar A. (Architect)', previousStatus: 'Previously Confirmed',
    activity: [
      { action: 'Added to Rough Board', user: 'Sarah A.', time: 'Mar 8' },
      { action: 'Moved to Confirmed', user: 'Sarah A.', time: 'Mar 10' },
      { action: 'Rejected by Architect', user: 'Omar A.', time: 'Mar 12' },
    ],
  },
];

type BoardTab = 'rough' | 'confirmed' | 'discarded';

export default function DesignBoard() {
  const [items, setItems] = useState(initialItems);
  const [activeTab, setActiveTab] = useState<BoardTab>('rough');
  const [activeSegment, setActiveSegment] = useState('All');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [reasonInput, setReasonInput] = useState<Record<string, string>>({});

  const tabs: { key: BoardTab; label: string; icon: React.ElementType; count: number }[] = [
    { key: 'rough', label: 'Rough Board', icon: StickyNote, count: items.filter(i => i.status === 'rough').length },
    { key: 'confirmed', label: 'Confirmed', icon: Check, count: items.filter(i => i.status === 'confirmed').length },
    { key: 'discarded', label: 'Discarded', icon: Trash2, count: items.filter(i => i.status === 'discarded').length },
  ];

  const filtered = items
    .filter(i => i.status === activeTab)
    .filter(i => activeSegment === 'All' || i.tags?.includes(activeSegment));

  const moveItem = (id: string, to: 'confirmed' | 'discarded', reason?: string) => {
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      const newActivity = [
        ...(i.activity || []),
        {
          action: to === 'confirmed' ? 'Approved' : `Rejected: ${reason || 'No reason'}`,
          user: 'You',
          time: 'Just now',
        },
      ];
      return {
        ...i,
        status: to,
        activity: newActivity,
        ...(to === 'discarded' ? { rejectionReason: reason, rejectedBy: 'You', previousStatus: `Previously ${i.status}` } : {}),
      };
    }));
    toast.success(to === 'confirmed' ? 'Item approved ✓' : 'Item discarded');
    setReasonInput(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  const confirmedByCategory: Record<string, typeof items> = {};
  if (activeTab === 'confirmed') {
    filtered.forEach(item => {
      if (!confirmedByCategory[item.category]) confirmedByCategory[item.category] = [];
      confirmedByCategory[item.category].push(item);
    });
  }

  const masonryHeights = [280, 320, 260, 340, 290, 310];

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="relative flex bg-muted/50 rounded-2xl p-1 border border-border/50">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 z-10 ${
                activeTab === tab.key ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {activeTab === tab.key && (
                <motion.div
                  layoutId="design-tab-bg"
                  className="absolute inset-0 bg-card rounded-xl shadow-sm border border-border/50"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative flex items-center gap-2">
                <tab.icon className="w-4 h-4" />
                {tab.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                }`}>{tab.count}</span>
              </span>
            </button>
          ))}
        </div>

        {/* Segment Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <div className="flex gap-1">
            {segments.map(s => (
              <button
                key={s}
                onClick={() => setActiveSegment(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeSegment === s
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ROUGH BOARD — Pinterest masonry */}
        {activeTab === 'rough' && (
          <motion.div
            key="rough"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            {/* Corkboard background */}
            <div className="absolute inset-0 bg-gradient-to-br from-warm-100/30 via-background to-warm-100/20 rounded-3xl" />
            <div className="absolute inset-0 opacity-[0.02]" style={{
              backgroundImage: 'radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }} />

            <div className="relative p-6 rounded-3xl border border-dashed border-primary/10 min-h-[600px]">
              {/* Header decoration */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Pin className="w-3.5 h-3.5 text-primary" />
                  <span className="font-medium">Inspiration Board</span>
                  <span className="text-muted-foreground/50">·</span>
                  <span>{filtered.length} items</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/15 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add Item
                </motion.button>
              </div>

              {/* Masonry grid */}
              <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
                {filtered.map((item, i) => {
                  const rotations = [-1.5, 1, -0.8, 1.2, -1, 0.8, -0.5, 1.5];
                  const rot = rotations[i % rotations.length];
                  const isExpanded = expandedCard === item.id;
                  const imgHeight = masonryHeights[i % masonryHeights.length];
                  
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.9, rotate: rot * 2 }}
                      animate={{ opacity: 1, scale: 1, rotate: rot }}
                      whileHover={{ rotate: 0, scale: 1.02, zIndex: 20 }}
                      transition={{ delay: i * 0.06, type: 'spring', stiffness: 200, damping: 18 }}
                      className="break-inside-avoid relative group"
                    >
                      <div className="bg-card rounded-2xl shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)] border border-border/40 overflow-hidden hover:shadow-[0_20px_60px_-12px_rgba(0,0,0,0.12)] transition-shadow duration-500">
                        {/* Tape */}
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-10 h-3 bg-primary/8 rounded-b-md z-10" />

                        {/* Image */}
                        <div className="relative overflow-hidden" style={{ height: imgHeight }}>
                          <img
                            src={item.image} alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          {item.price && (
                            <span className="absolute bottom-2 right-2 text-[11px] px-2.5 py-1 rounded-full bg-card/90 backdrop-blur-sm font-semibold text-foreground shadow-sm">
                              {item.price}
                            </span>
                          )}
                          {/* Quick actions overlay */}
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <motion.button
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => { e.stopPropagation(); moveItem(item.id, 'confirmed'); }}
                              className="p-2 rounded-xl bg-success/90 text-white backdrop-blur-sm shadow-lg"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => { e.stopPropagation(); setExpandedCard(isExpanded ? null : item.id); }}
                              className="p-2 rounded-xl bg-destructive/90 text-white backdrop-blur-sm shadow-lg"
                            >
                              <X className="w-3.5 h-3.5" />
                            </motion.button>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-2.5">
                          <div>
                            <h4 className="text-sm font-semibold text-foreground leading-snug">{item.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">{item.category}</span>
                            </div>
                          </div>

                          {item.note && (
                            <div className="bg-primary/5 border border-primary/10 rounded-xl px-3 py-2">
                              <p className="text-[11px] text-muted-foreground italic leading-relaxed flex items-start gap-1.5">
                                <Pin className="w-3 h-3 mt-0.5 text-primary/60 flex-shrink-0" />
                                {item.note}
                              </p>
                            </div>
                          )}

                          {/* Tags */}
                          {item.tags && (
                            <div className="flex flex-wrap gap-1">
                              {item.tags.map(tag => (
                                <span key={tag} className="text-[9px] px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground font-medium">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                            <span className="flex items-center gap-1"><User className="w-3 h-3" />{item.addedBy}</span>
                            <span>{item.date}</span>
                          </div>

                          {/* Reject with reason */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-2 pt-2 border-t border-border/50"
                              >
                                <textarea
                                  value={reasonInput[item.id] || ''}
                                  onChange={e => setReasonInput(prev => ({ ...prev, [item.id]: e.target.value }))}
                                  placeholder="Reason for rejection..."
                                  className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-xs text-foreground outline-none focus:ring-2 focus:ring-destructive/20 resize-none"
                                  rows={2}
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      if (!reasonInput[item.id]?.trim()) { toast.error('Please provide a reason'); return; }
                                      moveItem(item.id, 'discarded', reasonInput[item.id]);
                                      setExpandedCard(null);
                                    }}
                                    className="flex-1 py-2 rounded-xl bg-destructive/10 text-destructive text-xs font-semibold hover:bg-destructive/20 transition-colors"
                                  >
                                    Confirm Reject
                                  </button>
                                  <button
                                    onClick={() => setExpandedCard(null)}
                                    className="px-4 py-2 rounded-xl text-xs text-muted-foreground hover:bg-muted transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {filtered.length === 0 && (
                <div className="text-center py-24 text-muted-foreground">
                  <StickyNote className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="text-sm font-medium">No inspiration pinned yet</p>
                  <p className="text-xs mt-1">Start adding references, sketches, and product ideas</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* CONFIRMED BOARD */}
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
                <div className="flex items-center gap-3 mb-4">
                  <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">{category}</h4>
                  <div className="flex-1 h-px bg-border/50" />
                  <span className="text-[10px] text-muted-foreground font-medium">{categoryItems.length} items</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryItems.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      whileHover={{ y: -6, boxShadow: '0 20px 60px -16px rgba(0,0,0,0.1)' }}
                      className="bg-card rounded-2xl border border-border/40 overflow-hidden group cursor-pointer shadow-sm hover:shadow-xl transition-all duration-500"
                    >
                      <div className="relative h-48 overflow-hidden">
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                        <div className="absolute top-3 right-3">
                          <span className="text-[10px] px-3 py-1.5 rounded-full bg-success/90 text-white font-semibold backdrop-blur-md flex items-center gap-1">
                            <Check className="w-3 h-3" /> Approved
                          </span>
                        </div>
                        {item.price && (
                          <span className="absolute bottom-3 left-3 text-xs font-bold text-white bg-foreground/60 backdrop-blur-sm px-3 py-1 rounded-full">
                            {item.price}
                          </span>
                        )}
                      </div>
                      <div className="p-5 space-y-3">
                        <div>
                          <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
                          <span className="text-[10px] text-muted-foreground">{item.category}</span>
                        </div>
                        {item.tags && (
                          <div className="flex flex-wrap gap-1">
                            {item.tags.map(tag => (
                              <span key={tag} className="text-[9px] px-2 py-0.5 rounded-md bg-success/10 text-success font-medium">{tag}</span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1"><User className="w-3 h-3" />{item.addedBy}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Confirmed {item.date}</span>
                        </div>
                        {/* Mini activity */}
                        {item.activity && item.activity.length > 0 && (
                          <div className="pt-2 border-t border-border/30">
                            <div className="flex items-center gap-1 text-[9px] text-muted-foreground mb-1">
                              <History className="w-3 h-3" /> Activity
                            </div>
                            {item.activity.slice(-2).map((a, ai) => (
                              <div key={ai} className="text-[10px] text-muted-foreground flex items-center gap-1.5 py-0.5">
                                <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                <span>{a.action}</span>
                                <span className="text-muted-foreground/50">· {a.time}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-24 bg-card rounded-2xl border border-border/40">
                <Grid3X3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/20" />
                <p className="text-sm font-medium text-muted-foreground">No confirmed items yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Approve items from the Rough Board to see them here</p>
              </div>
            )}
          </motion.div>
        )}

        {/* DISCARDED BOARD */}
        {activeTab === 'discarded' && (
          <motion.div
            key="discarded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-destructive/5 border border-destructive/10">
              <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                Items marked <span className="font-semibold text-destructive">Previously Confirmed</span> show design decisions that were later reversed.
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
                  className="bg-card rounded-2xl border border-border/40 overflow-hidden group shadow-sm"
                >
                  {item.previousStatus && (
                    <div className="px-4 py-2.5 bg-destructive/5 border-b border-destructive/10 flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-destructive bg-destructive/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {item.previousStatus} → Discarded
                      </span>
                    </div>
                  )}
                  <div className="flex gap-4 p-5">
                    <div className="w-28 h-28 rounded-xl overflow-hidden flex-shrink-0 grayscale group-hover:grayscale-0 transition-all duration-500">
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <div className="flex-1 space-y-2 min-w-0">
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
                        <span className="text-[11px] text-muted-foreground">{item.category} {item.price && `· ${item.price}`}</span>
                      </div>
                      {item.rejectionReason && (
                        <div className="bg-destructive/5 border border-destructive/10 rounded-xl px-3 py-2.5">
                          <p className="text-[10px] font-semibold text-muted-foreground mb-1">Reason:</p>
                          <p className="text-xs text-muted-foreground italic leading-relaxed">{item.rejectionReason}</p>
                          {item.rejectedBy && (
                            <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                              <User className="w-3 h-3" /> {item.rejectedBy}
                            </p>
                          )}
                        </div>
                      )}
                      {/* Activity timeline */}
                      {item.activity && (
                        <div className="pt-2">
                          <div className="flex items-center gap-1 text-[9px] text-muted-foreground mb-1.5">
                            <History className="w-3 h-3" /> Decision History
                          </div>
                          {item.activity.map((a, ai) => (
                            <div key={ai} className="text-[10px] text-muted-foreground flex items-center gap-1.5 py-0.5">
                              <div className={`w-1.5 h-1.5 rounded-full ${
                                a.action.includes('Rejected') ? 'bg-destructive' : a.action.includes('Approved') ? 'bg-success' : 'bg-muted-foreground/30'
                              }`} />
                              <span>{a.action}</span>
                              <span className="text-muted-foreground/50">· {a.time}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-24 bg-card rounded-2xl border border-border/40">
                <Trash2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/20" />
                <p className="text-sm font-medium text-muted-foreground">No discarded items</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
