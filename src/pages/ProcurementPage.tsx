import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, MapPin, Clock, ChevronRight, Search,
  Mail, ArrowLeft, Check, X, Package, Truck, DollarSign,
  BarChart3, Calendar
} from 'lucide-react';
import { toast } from 'sonner';

interface Supplier {
  id: string;
  name: string;
  image: string;
  rating: number;
  price: string;
  priceValue: number;
  delivery: string;
  location: string;
  category: string;
  availability: 'in_stock' | 'limited' | 'pre_order';
  products: string[];
  details?: {
    materialCost: string;
    tax: string;
    totalCost: string;
    paymentTerms: { advance: number; beforeDispatch: number; afterDelivery: number };
    timeline: string;
    stakeholders: string[];
  };
}

const suppliers: Supplier[] = [
  {
    id: 's1', name: 'Premium Stone Works', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&h=300&fit=crop',
    rating: 4.8, price: '$28,000', priceValue: 28000, delivery: '2-3 weeks', location: 'Milan, Italy',
    category: 'Materials', availability: 'in_stock', products: ['Italian Marble', 'Granite', 'Travertine'],
    details: {
      materialCost: '$24,500', tax: '$3,500', totalCost: '$28,000',
      paymentTerms: { advance: 30, beforeDispatch: 40, afterDelivery: 30 },
      timeline: '15-21 business days', stakeholders: ['Sarah Chen', 'Mike Johnson'],
    },
  },
  {
    id: 's2', name: 'Nordic Wood Supply', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=500&h=300&fit=crop',
    rating: 4.6, price: '$18,500', priceValue: 18500, delivery: '1-2 weeks', location: 'Stockholm, Sweden',
    category: 'Flooring', availability: 'in_stock', products: ['Oak Hardwood', 'Engineered Wood', 'Bamboo'],
    details: {
      materialCost: '$16,200', tax: '$2,300', totalCost: '$18,500',
      paymentTerms: { advance: 25, beforeDispatch: 50, afterDelivery: 25 },
      timeline: '7-14 business days', stakeholders: ['Sarah Chen'],
    },
  },
  {
    id: 's3', name: 'Luxe Lighting Co.', image: 'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=500&h=300&fit=crop',
    rating: 4.9, price: '$12,800', priceValue: 12800, delivery: '3-4 weeks', location: 'London, UK',
    category: 'Lighting', availability: 'limited', products: ['Chandeliers', 'Pendants', 'Wall Sconces'],
    details: {
      materialCost: '$11,000', tax: '$1,800', totalCost: '$12,800',
      paymentTerms: { advance: 50, beforeDispatch: 30, afterDelivery: 20 },
      timeline: '21-28 business days', stakeholders: ['Sarah Chen', 'David Park'],
    },
  },
  {
    id: 's4', name: 'Modern Fixtures Hub', image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&h=300&fit=crop',
    rating: 4.4, price: '$8,200', priceValue: 8200, delivery: '1 week', location: 'New York, USA',
    category: 'Fixtures', availability: 'in_stock', products: ['Faucets', 'Basins', 'Shower Systems'],
    details: {
      materialCost: '$7,100', tax: '$1,100', totalCost: '$8,200',
      paymentTerms: { advance: 20, beforeDispatch: 50, afterDelivery: 30 },
      timeline: '5-7 business days', stakeholders: ['Mike Johnson'],
    },
  },
  {
    id: 's5', name: 'Artisan Furniture Co.', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&h=300&fit=crop',
    rating: 4.7, price: '$35,000', priceValue: 35000, delivery: '4-6 weeks', location: 'Copenhagen, Denmark',
    category: 'Furniture', availability: 'pre_order', products: ['Sofas', 'Dining Tables', 'Chairs'],
    details: {
      materialCost: '$30,000', tax: '$5,000', totalCost: '$35,000',
      paymentTerms: { advance: 40, beforeDispatch: 40, afterDelivery: 20 },
      timeline: '28-42 business days', stakeholders: ['Sarah Chen', 'David Park'],
    },
  },
  {
    id: 's6', name: 'Green Textiles International', image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=500&h=300&fit=crop',
    rating: 4.3, price: '$6,500', priceValue: 6500, delivery: '1-2 weeks', location: 'Mumbai, India',
    category: 'Textiles', availability: 'in_stock', products: ['Curtains', 'Upholstery', 'Rugs'],
    details: {
      materialCost: '$5,600', tax: '$900', totalCost: '$6,500',
      paymentTerms: { advance: 30, beforeDispatch: 40, afterDelivery: 30 },
      timeline: '7-14 business days', stakeholders: ['Sarah Chen'],
    },
  },
];

const categories = ['All', 'Materials', 'Flooring', 'Lighting', 'Fixtures', 'Furniture', 'Textiles'];
const availabilityLabels: Record<string, { label: string; color: string }> = {
  in_stock: { label: 'In Stock', color: 'bg-success/10 text-success' },
  limited: { label: 'Limited', color: 'bg-warning/10 text-warning' },
  pre_order: { label: 'Pre-Order', color: 'bg-primary/10 text-primary' },
};

type SortKey = 'rating' | 'price_low' | 'price_high';

export default function ProcurementPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState<SortKey>('rating');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  const filtered = suppliers
    .filter(s => category === 'All' || s.category === category)
    .filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'rating') return b.rating - a.rating;
      if (sort === 'price_low') return a.priceValue - b.priceValue;
      return b.priceValue - a.priceValue;
    });

  const toggleCompare = (id: string) => {
    setCompareIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const compareSuppliers = suppliers.filter(s => compareIds.includes(s.id));

  if (selectedSupplier) {
    const s = selectedSupplier;
    const d = s.details!;
    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedSupplier(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Suppliers
        </button>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border/40 overflow-hidden shadow-sm">
              <div className="h-56 overflow-hidden relative">
                <img src={s.image} alt={s.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                <div className="absolute bottom-5 left-6">
                  <h1 className="text-2xl font-bold text-white">{s.name}</h1>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="flex items-center gap-1 text-white/80 text-sm"><MapPin className="w-3.5 h-3.5" />{s.location}</span>
                    <span className="flex items-center gap-1 text-amber-300 text-sm"><Star className="w-3.5 h-3.5 fill-current" />{s.rating}</span>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/40 text-center">
                    <Package className="w-5 h-5 mx-auto text-primary mb-1" />
                    <div className="text-xs text-muted-foreground">Category</div>
                    <div className="text-sm font-semibold text-foreground mt-0.5">{s.category}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/40 text-center">
                    <Truck className="w-5 h-5 mx-auto text-primary mb-1" />
                    <div className="text-xs text-muted-foreground">Delivery</div>
                    <div className="text-sm font-semibold text-foreground mt-0.5">{s.delivery}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/40 text-center">
                    <Check className="w-5 h-5 mx-auto text-success mb-1" />
                    <div className="text-xs text-muted-foreground">Status</div>
                    <div className="text-sm font-semibold text-foreground mt-0.5">{availabilityLabels[s.availability].label}</div>
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Products Available</h3>
                <div className="flex flex-wrap gap-2">
                  {s.products.map(p => (
                    <span key={p} className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-medium">{p}</span>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Cost Breakdown */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-2xl border border-border/40 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><DollarSign className="w-4 h-4 text-primary" /> Cost Breakdown</h3>
              <div className="space-y-3">
                {[
                  { label: 'Material Cost', value: d.materialCost },
                  { label: 'Tax & Duties', value: d.tax },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between py-2 border-b border-border/30">
                    <span className="text-sm text-muted-foreground">{row.label}</span>
                    <span className="text-sm font-medium text-foreground">{row.value}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-semibold text-foreground">Total Cost</span>
                  <span className="text-lg font-bold text-primary">{d.totalCost}</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card rounded-2xl border border-border/40 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-4">Payment Terms</h3>
              <div className="space-y-3">
                {[
                  { label: 'Advance', pct: d.paymentTerms.advance },
                  { label: 'Before Dispatch', pct: d.paymentTerms.beforeDispatch },
                  { label: 'After Delivery', pct: d.paymentTerms.afterDelivery },
                ].map(term => (
                  <div key={term.label}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">{term.label}</span>
                      <span className="font-semibold text-foreground">{term.pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${term.pct}%` }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="h-full rounded-full gradient-primary"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-2xl border border-border/40 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-4">Timeline & Delivery</h3>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <div className="text-sm font-medium text-foreground">{d.timeline}</div>
                  <div className="text-xs text-muted-foreground">Estimated delivery</div>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-card rounded-2xl border border-border/40 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-4">Assigned Stakeholders</h3>
              <div className="space-y-2">
                {d.stakeholders.map(name => (
                  <div key={name} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/30 transition-colors">
                    <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-[10px] font-semibold text-primary-foreground">
                      {name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="text-sm text-foreground">{name}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <div className="space-y-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { toast.success('Supplier selected'); setSelectedSupplier(null); }}
                className="w-full gradient-primary text-primary-foreground py-3.5 rounded-xl text-sm font-semibold shadow-lg shadow-primary/20"
              >
                Select Supplier
              </motion.button>
              <button
                onClick={() => toast.info('Contact form — demo feature')}
                className="w-full py-3.5 rounded-xl text-sm font-medium border border-border text-foreground hover:bg-muted/50 transition-colors flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" /> Contact Supplier
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Procurement</h1>
          <p className="text-muted-foreground text-sm mt-1">Compare suppliers and manage procurement</p>
        </div>
        {compareIds.length >= 2 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.03 }}
            onClick={() => setShowCompare(true)}
            className="gradient-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium shadow-lg shadow-primary/20 flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" /> Compare ({compareIds.length})
          </motion.button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search suppliers..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
          />
        </div>
        <div className="flex gap-1.5">
          {categories.map(c => (
            <button
              key={c} onClick={() => setCategory(c)}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                category === c ? 'gradient-primary text-primary-foreground shadow-md shadow-primary/15' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
            >{c}</button>
          ))}
        </div>
        <select
          value={sort} onChange={e => setSort(e.target.value as SortKey)}
          className="px-3.5 py-2 rounded-xl border border-border bg-card text-xs font-medium text-foreground outline-none"
        >
          <option value="rating">Highest Rated</option>
          <option value="price_low">Price: Low → High</option>
          <option value="price_high">Price: High → Low</option>
        </select>
      </div>

      {/* Supplier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -6 }}
            className="bg-card rounded-2xl border border-border/40 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 group cursor-pointer"
          >
            <div className="relative h-40 overflow-hidden" onClick={() => setSelectedSupplier(s)}>
              <img src={s.image} alt={s.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 to-transparent" />
              <span className={`absolute top-3 right-3 text-[10px] px-2.5 py-1 rounded-full font-semibold ${availabilityLabels[s.availability].color}`}>
                {availabilityLabels[s.availability].label}
              </span>
              <div className="absolute bottom-3 left-4">
                <h3 className="font-semibold text-white text-lg">{s.name}</h3>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-400 fill-current" />
                  <span className="text-sm font-semibold text-foreground">{s.rating}</span>
                </div>
                <span className="text-lg font-bold text-foreground">{s.price}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{s.location}</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{s.delivery}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {s.products.slice(0, 3).map(p => (
                  <span key={p} className="text-[10px] px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground">{p}</span>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setSelectedSupplier(s)} className="flex-1 py-2.5 rounded-xl text-xs font-semibold gradient-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5">
                  View Details <ChevronRight className="w-3 h-3" />
                </button>
                <button
                  onClick={() => toggleCompare(s.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-medium transition-all border ${
                    compareIds.includes(s.id) ? 'bg-primary/10 text-primary border-primary/30' : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {compareIds.includes(s.id) ? <Check className="w-3.5 h-3.5" /> : 'Compare'}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Compare Modal */}
      <AnimatePresence>
        {showCompare && compareSuppliers.length >= 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setShowCompare(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-card rounded-3xl border border-border/40 shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-auto p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-foreground">Supplier Comparison</h2>
                <button onClick={() => setShowCompare(false)} className="p-2 rounded-xl hover:bg-muted transition-colors">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Attribute</th>
                      {compareSuppliers.map(s => (
                        <th key={s.id} className="text-left py-3 px-4 font-semibold text-foreground">{s.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'Rating', render: (s: Supplier) => <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400 fill-current" />{s.rating}</span> },
                      { label: 'Price', render: (s: Supplier) => <span className="font-semibold">{s.price}</span> },
                      { label: 'Delivery', render: (s: Supplier) => s.delivery },
                      { label: 'Location', render: (s: Supplier) => s.location },
                      { label: 'Availability', render: (s: Supplier) => <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${availabilityLabels[s.availability].color}`}>{availabilityLabels[s.availability].label}</span> },
                      { label: 'Material Cost', render: (s: Supplier) => s.details?.materialCost || '-' },
                      { label: 'Tax', render: (s: Supplier) => s.details?.tax || '-' },
                      { label: 'Total', render: (s: Supplier) => <span className="font-bold text-primary">{s.details?.totalCost}</span> },
                    ].map(row => (
                      <tr key={row.label} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4 text-muted-foreground">{row.label}</td>
                        {compareSuppliers.map(s => (
                          <td key={s.id} className="py-3 px-4 text-foreground">{row.render(s)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
