import { useState, useMemo, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, Package, Truck, ClipboardList, CheckCircle2, Clock, AlertTriangle,
  DollarSign, Folder, ChevronLeft, ChevronRight, MoreVertical, Ban, MapPin,
  Building2, BarChart3, Boxes,
} from 'lucide-react';
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, CartesianGrid,
} from 'recharts';
import { toast } from 'sonner';
import type { PurchaseOrder, PurchaseOrderStatus } from '@/data/mockData';

const CHART_COLORS = [
  'hsl(28, 60%, 48%)',
  'hsl(158, 50%, 42%)',
  'hsl(38, 85%, 52%)',
  'hsl(262, 60%, 55%)',
  'hsl(4, 74%, 55%)',
  'hsl(190, 70%, 45%)',
];

const STATUS_FLOW: PurchaseOrderStatus[] = ['requested', 'approved', 'ordered', 'in_transit', 'delivered'];

const STATUS_META: Record<PurchaseOrderStatus, { label: string; color: string; dot: string; icon: React.ElementType }> = {
  requested:  { label: 'Requested',  color: 'bg-muted text-muted-foreground',     dot: 'bg-muted-foreground', icon: ClipboardList },
  approved:   { label: 'Approved',   color: 'bg-primary/10 text-primary',         dot: 'bg-primary',          icon: CheckCircle2 },
  ordered:    { label: 'Ordered',    color: 'bg-warning/10 text-warning',         dot: 'bg-warning',          icon: Package },
  in_transit: { label: 'In Transit', color: 'bg-blue-50 text-blue-600',           dot: 'bg-blue-500',         icon: Truck },
  delivered:  { label: 'Delivered',  color: 'bg-success/10 text-success',         dot: 'bg-success',          icon: CheckCircle2 },
  cancelled:  { label: 'Cancelled',  color: 'bg-destructive/10 text-destructive', dot: 'bg-destructive',      icon: Ban },
};

const CATEGORIES = ['Materials', 'Flooring', 'Lighting', 'Fixtures', 'Furniture', 'Textiles', 'Electrical', 'Plumbing', 'Equipment', 'Other'];
const UNITS = ['units', 'pcs', 'bags', 'tons', 'kg', 'm²', 'm³', 'litres', 'rolls', 'sets'];

// Orders at or above this cost raise a Procurement approval in the Approval Center on creation.
// Threshold is in the USD base the amounts are stored in.
const APPROVAL_THRESHOLD = 10000;

const isOverdue = (po: PurchaseOrder) =>
  !!po.expectedDelivery &&
  new Date(po.expectedDelivery) < new Date() &&
  po.status !== 'delivered' &&
  po.status !== 'cancelled';

const fmtMoney = (n: number) => `$${Math.round(n).toLocaleString()}`;

export default function ProcurementPage() {
  const { projects, purchaseOrders, segments, budgetItems, addPurchaseOrder, updatePurchaseOrder, addBudgetItem, addApproval } = useData();
  const { user } = useAuth();
  const { formatCurrency, formatCurrencyCompact } = usePreferences();

  const [activeProjectId, setActiveProjectId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'pipeline' | 'suppliers' | 'analytics'>('pipeline');
  const [showForm, setShowForm] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // New order form
  const blankForm = {
    item: '', category: 'Materials', supplierName: '', projectId: '', segmentId: '',
    quantity: '1', unit: 'units', totalCost: '', expectedDelivery: '', notes: '',
  };
  const [form, setForm] = useState(blankForm);

  useEffect(() => {
    if (projects.length > 0 && !form.projectId) {
      setForm(f => ({ ...f, projectId: projects[0].id }));
    }
  }, [projects, form.projectId]);

  const role = user?.role;
  const canCreate = role === 'contractor' || role === 'architect';
  const canApprove = role === 'architect' || role === 'client';
  const canAdvance = role === 'contractor' || role === 'architect';

  const projectOrders = useMemo(
    () => purchaseOrders.filter(po => activeProjectId === 'all' || po.projectId === activeProjectId),
    [purchaseOrders, activeProjectId]
  );

  // KPIs
  const kpis = useMemo(() => {
    const active = projectOrders.filter(po => po.status !== 'cancelled');
    const committed = active.reduce((s, po) => s + po.totalCost, 0);
    const pending = projectOrders.filter(po => ['approved', 'ordered', 'in_transit'].includes(po.status)).length;
    const overdue = projectOrders.filter(isOverdue).length;
    const now = new Date();
    const deliveredThisMonth = projectOrders.filter(po =>
      po.deliveredAt &&
      new Date(po.deliveredAt).getMonth() === now.getMonth() &&
      new Date(po.deliveredAt).getFullYear() === now.getFullYear()
    ).length;
    return { committed, pending, overdue, deliveredThisMonth };
  }, [projectOrders]);

  const resolveSegment = (id?: string) => (id ? segments.find((s: any) => s.id === id)?.name : undefined);
  const resolveProject = (id: string) => projects.find(p => p.id === id)?.name;

  // Pipeline columns
  const columns = useMemo(
    () => STATUS_FLOW.map(status => ({
      status,
      orders: projectOrders.filter(po => po.status === status),
    })),
    [projectOrders]
  );
  const cancelledOrders = useMemo(() => projectOrders.filter(po => po.status === 'cancelled'), [projectOrders]);

  // Suppliers (derived — no suppliers table)
  const suppliers = useMemo(() => {
    const map = new Map<string, { name: string; orderCount: number; totalSpend: number; openOrders: number; categories: Set<string> }>();
    projectOrders.forEach(po => {
      const name = po.supplierName?.trim() || 'Unspecified';
      if (!map.has(name)) map.set(name, { name, orderCount: 0, totalSpend: 0, openOrders: 0, categories: new Set() });
      const s = map.get(name)!;
      s.orderCount++;
      if (po.status !== 'cancelled') s.totalSpend += po.totalCost;
      if (['requested', 'approved', 'ordered', 'in_transit'].includes(po.status)) s.openOrders++;
      if (po.category) s.categories.add(po.category);
    });
    return Array.from(map.values()).sort((a, b) => b.totalSpend - a.totalSpend);
  }, [projectOrders]);

  // Analytics
  const spendByCategory = useMemo(() => {
    const map = new Map<string, number>();
    projectOrders.filter(po => po.status !== 'cancelled').forEach(po => {
      map.set(po.category, (map.get(po.category) || 0) + po.totalCost);
    });
    return Array.from(map.entries())
      .map(([name, value], i) => ({ name, value, color: CHART_COLORS[i % CHART_COLORS.length] }))
      .sort((a, b) => b.value - a.value);
  }, [projectOrders]);

  const spendBySupplier = useMemo(
    () => suppliers.filter(s => s.totalSpend > 0).slice(0, 8).map(s => ({ name: s.name, spend: s.totalSpend })),
    [suppliers]
  );

  // Actions
  // Marks an order delivered and logs its cost to the project budget — exactly once.
  // Idempotency: the budget entry's description is stamped with `PO:<id>`; we skip
  // creating another if one already exists (e.g. order moved back then re-delivered).
  const deliverOrder = (po: PurchaseOrder) => {
    updatePurchaseOrder(po.id, { status: 'delivered', deliveredAt: new Date().toISOString().split('T')[0] });
    const marker = `PO:${po.id}`;
    const alreadyLogged = budgetItems.some(b => (b.description || '').startsWith(marker));
    if (po.totalCost > 0 && !alreadyLogged) {
      addBudgetItem({
        projectId: po.projectId,
        category: po.category,
        description: `${marker} · ${po.item}${po.supplierName ? ` (${po.supplierName})` : ''}`,
        amount: po.totalCost,
        type: 'expense',
        date: new Date().toISOString().split('T')[0],
        status: 'approved',
      });
      toast.success(`Delivered — ${fmtMoney(po.totalCost)} logged to budget`);
    } else {
      toast.success(`"${po.item}" marked delivered`);
    }
  };

  const advance = (po: PurchaseOrder, dir: 1 | -1) => {
    const idx = STATUS_FLOW.indexOf(po.status);
    const next = STATUS_FLOW[idx + dir];
    if (!next) return;
    if (next === 'approved' && dir === 1 && !canApprove) {
      toast.error('Only architects or clients can approve orders');
      return;
    }
    if (!canAdvance && !(next === 'approved' && canApprove)) {
      toast.error('You do not have permission to update this order');
      return;
    }
    if (next === 'delivered') {
      deliverOrder(po);
      return;
    }
    updatePurchaseOrder(po.id, { status: next });
    toast.success(`"${po.item}" → ${STATUS_META[next].label}`);
  };

  const markDelivered = (po: PurchaseOrder) => {
    deliverOrder(po);
    setMenuOpenId(null);
  };

  const cancelOrder = (po: PurchaseOrder) => {
    const canCancel = po.requestedBy === user?.id || role === 'architect';
    if (!canCancel) { toast.error('Only the requester or an architect can cancel'); return; }
    updatePurchaseOrder(po.id, { status: 'cancelled' });
    toast.success(`"${po.item}" cancelled`);
    setMenuOpenId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.item.trim()) { toast.error('Item name is required'); return; }
    if (!form.projectId) { toast.error('Please select a project'); return; }
    const totalCost = Number(form.totalCost) || 0;
    addPurchaseOrder({
      projectId: form.projectId,
      segmentId: form.segmentId || undefined,
      item: form.item.trim(),
      category: form.category,
      supplierName: form.supplierName.trim(),
      quantity: Number(form.quantity) || 1,
      unit: form.unit,
      totalCost,
      currency: 'USD',
      status: 'requested',
      expectedDelivery: form.expectedDelivery || undefined,
      notes: form.notes.trim() || undefined,
      requestedBy: user?.id || '',
    });

    // High-value orders are surfaced in the central Approval Center for sign-off.
    if (totalCost >= APPROVAL_THRESHOLD) {
      addApproval({
        title: `Procurement: ${form.item.trim()}`,
        category: 'Procurement',
        status: 'pending',
        description: `${form.supplierName.trim() || 'Supplier TBD'} · ${fmtMoney(totalCost)} · ${form.quantity} ${form.unit}`,
        projectId: form.projectId,
        requestedBy: user?.id || '',
      });
      toast.success('Order created — sent to Approval Center for sign-off');
    } else {
      toast.success('Purchase order created');
    }

    setForm({ ...blankForm, projectId: form.projectId });
    setShowForm(false);
  };

  const formProjectSegments = segments.filter((s: any) => s.project_id === form.projectId);

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
        <Folder className="w-12 h-12 mb-4 opacity-30" />
        <p>No projects found. Create a project first to manage procurement.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Procurement</h1>
          <p className="text-muted-foreground text-sm mt-1">Track material &amp; item orders from request to delivery</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowForm(true)}
            className="gradient-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 flex items-center gap-2 shadow-lg shadow-primary/20 shrink-0"
          >
            <Plus className="w-4 h-4" /> New Order
          </button>
        )}
      </div>

      {/* Project filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveProjectId('all')}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
            activeProjectId === 'all' ? 'bg-foreground text-background shadow-md' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          All Projects
        </button>
        {projects.map(p => (
          <button
            key={p.id}
            onClick={() => setActiveProjectId(p.id)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              activeProjectId === p.id ? 'bg-foreground text-background shadow-md' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Committed Spend', value: formatCurrencyCompact(kpis.committed), icon: DollarSign, color: 'text-foreground', bg: 'bg-muted/50' },
          { label: 'Pending Delivery', value: String(kpis.pending), icon: Truck, color: 'text-warning', bg: 'bg-warning/10' },
          { label: 'Overdue', value: String(kpis.overdue), icon: AlertTriangle, color: kpis.overdue > 0 ? 'text-destructive' : 'text-success', bg: kpis.overdue > 0 ? 'bg-destructive/10' : 'bg-success/10' },
          { label: 'Delivered (mo.)', value: String(kpis.deliveredThisMonth), icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card rounded-2xl border border-border/40 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color} mt-1 truncate max-w-[120px]`}>{s.value}</p>
              </div>
              <div className={`w-11 h-11 rounded-2xl ${s.bg} flex items-center justify-center shrink-0`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Section tabs */}
      <div className="flex gap-2">
        {([
          { key: 'pipeline', label: 'Pipeline', icon: Boxes },
          { key: 'suppliers', label: 'Suppliers', icon: Building2 },
          { key: 'analytics', label: 'Analytics', icon: BarChart3 },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === tab.key ? 'gradient-primary text-primary-foreground shadow-md shadow-primary/15' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* New Order modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', stiffness: 280, damping: 26 }}
              className="bg-card rounded-3xl border shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold text-foreground">New Purchase Order</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Add an item to the procurement pipeline</p>
                </div>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-muted transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Item *</label>
                  <input
                    value={form.item}
                    onChange={e => setForm({ ...form, item: e.target.value })}
                    placeholder="e.g. Portland Cement"
                    className="w-full px-4 py-2.5 rounded-xl border bg-background/50 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Category</label>
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border bg-background/50 text-sm outline-none focus:ring-2 focus:ring-primary/20">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Supplier</label>
                    <input value={form.supplierName} onChange={e => setForm({ ...form, supplierName: e.target.value })} placeholder="Supplier name" className="w-full px-4 py-2.5 rounded-xl border bg-background/50 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Project *</label>
                    <select value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value, segmentId: '' })} className="w-full px-3 py-2.5 rounded-xl border bg-background/50 text-sm outline-none focus:ring-2 focus:ring-primary/20" required>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Area / Segment</label>
                    <select value={form.segmentId} onChange={e => setForm({ ...form, segmentId: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border bg-background/50 text-sm outline-none focus:ring-2 focus:ring-primary/20">
                      <option value="">None</option>
                      {formProjectSegments.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Qty</label>
                    <input type="number" min="0" step="any" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border bg-background/50 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Unit</label>
                    <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border bg-background/50 text-sm outline-none focus:ring-2 focus:ring-primary/20">
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Total $</label>
                    <input type="number" min="0" step="0.01" value={form.totalCost} onChange={e => setForm({ ...form, totalCost: e.target.value })} placeholder="0" className="w-full px-4 py-2.5 rounded-xl border bg-background/50 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Expected Delivery</label>
                  <input type="date" value={form.expectedDelivery} onChange={e => setForm({ ...form, expectedDelivery: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border bg-background/50 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Notes</label>
                  <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Specs, reference numbers, delivery instructions..." className="w-full px-4 py-2.5 rounded-xl border bg-background/50 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl text-sm text-muted-foreground bg-muted/50 hover:bg-muted transition-colors font-medium">Cancel</button>
                  <button type="submit" className="flex-1 py-3 rounded-xl text-sm font-semibold gradient-primary text-primary-foreground shadow-md shadow-primary/20 hover:opacity-90 transition-opacity">Create Order</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PIPELINE */}
      {activeTab === 'pipeline' && (
        projectOrders.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-border/40">
            <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm font-medium text-foreground">No purchase orders yet</p>
            <p className="text-xs text-muted-foreground mt-1">{canCreate ? 'Create your first order to get started' : 'Orders will appear here once created'}</p>
          </div>
        ) : (
          <>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {columns.map(col => {
                const meta = STATUS_META[col.status];
                return (
                  <div key={col.status} className="min-w-[280px] w-[280px] flex-shrink-0">
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                      <h3 className="text-sm font-semibold text-foreground">{meta.label}</h3>
                      <span className="text-xs text-muted-foreground ml-auto bg-muted px-2 py-0.5 rounded-full">{col.orders.length}</span>
                    </div>
                    <div className="space-y-3">
                      {col.orders.map((po, i) => {
                        const overdue = isOverdue(po);
                        const idx = STATUS_FLOW.indexOf(po.status);
                        const segName = resolveSegment(po.segmentId);
                        return (
                          <motion.div
                            key={po.id}
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                            className="bg-card rounded-xl border border-border/50 p-3.5 shadow-sm hover:shadow-md transition-shadow relative"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-sm font-semibold text-foreground leading-snug">{po.item}</h4>
                              <div className="relative shrink-0">
                                <button onClick={() => setMenuOpenId(menuOpenId === po.id ? null : po.id)} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
                                  <MoreVertical className="w-3.5 h-3.5" />
                                </button>
                                {menuOpenId === po.id && (
                                  <>
                                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                                    <div className="absolute right-0 top-7 z-20 w-40 bg-card rounded-xl border border-border shadow-lg py-1 text-sm">
                                      {po.status !== 'delivered' && (
                                        <button onClick={() => markDelivered(po)} className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2 text-success"><CheckCircle2 className="w-3.5 h-3.5" /> Mark Delivered</button>
                                      )}
                                      <button onClick={() => cancelOrder(po)} className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2 text-destructive"><Ban className="w-3.5 h-3.5" /> Cancel Order</button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>

                            {po.supplierName && <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Building2 className="w-3 h-3" />{po.supplierName}</p>}

                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <span className="text-xs px-2 py-0.5 rounded-lg bg-primary/10 text-primary font-medium">{po.category}</span>
                              {po.quantity > 0 && <span className="text-xs text-muted-foreground">{po.quantity} {po.unit}</span>}
                            </div>

                            <div className="flex items-center justify-between mt-2.5">
                              <span className="text-sm font-bold text-foreground">{formatCurrency(po.totalCost)}</span>
                              {activeProjectId === 'all' && <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">{resolveProject(po.projectId)}</span>}
                            </div>

                            {(segName || po.expectedDelivery) && (
                              <div className="flex items-center gap-3 mt-2 text-[11px] flex-wrap">
                                {segName && <span className="flex items-center gap-1 text-muted-foreground"><MapPin className="w-3 h-3" />{segName}</span>}
                                {po.expectedDelivery && (
                                  <span className={`flex items-center gap-1 ${overdue ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                                    <Clock className="w-3 h-3" />
                                    {overdue ? 'Overdue ' : 'ETA '}{new Date(po.expectedDelivery).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Advance / retreat controls */}
                            <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border/40">
                              <button
                                onClick={() => advance(po, -1)}
                                disabled={idx <= 0}
                                className="flex items-center justify-center w-7 h-7 rounded-lg bg-muted/60 text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title="Move back"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => advance(po, 1)}
                                disabled={idx >= STATUS_FLOW.length - 1}
                                className="flex-1 flex items-center justify-center gap-1 h-7 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title="Advance"
                              >
                                {idx < STATUS_FLOW.length - 1 ? <>Move to {STATUS_META[STATUS_FLOW[idx + 1]].label} <ChevronRight className="w-3.5 h-3.5" /></> : 'Delivered'}
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                      {col.orders.length === 0 && (
                        <div className="text-center py-6 text-xs text-muted-foreground border border-dashed border-border/60 rounded-xl">None</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cancelled */}
            {cancelledOrders.length > 0 && (
              <div className="pt-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Cancelled ({cancelledOrders.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {cancelledOrders.map(po => (
                    <span key={po.id} className="text-xs px-3 py-1.5 rounded-lg bg-muted/60 text-muted-foreground line-through">{po.item} · {formatCurrency(po.totalCost)}</span>
                  ))}
                </div>
              </div>
            )}
          </>
        )
      )}

      {/* SUPPLIERS */}
      {activeTab === 'suppliers' && (
        suppliers.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-border/40">
            <Building2 className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm font-medium text-foreground">No suppliers yet</p>
            <p className="text-xs text-muted-foreground mt-1">Suppliers appear here as you create orders</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {suppliers.map((s, i) => (
              <motion.div key={s.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="bg-card rounded-2xl border border-border/40 p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-foreground truncate">{s.name}</h4>
                    <p className="text-xs text-muted-foreground">{s.orderCount} order{s.orderCount !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-lg font-bold text-foreground">{formatCurrency(s.totalSpend)}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total spend</p>
                  </div>
                  {s.openOrders > 0 && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-warning/10 text-warning font-semibold">{s.openOrders} open</span>
                  )}
                </div>
                {s.categories.size > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border/40">
                    {Array.from(s.categories).slice(0, 4).map(c => (
                      <span key={c} className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground">{c}</span>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )
      )}

      {/* ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border/40 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><Package className="w-4 h-4 text-primary" /> Spend by Category</h3>
            {spendByCategory.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={spendByCategory} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={3} dataKey="value">
                      {spendByCategory.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 16, border: '1px solid hsl(130 11% 89%)', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} formatter={(v: number) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {spendByCategory.map(d => (
                    <span key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />{d.name}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">No spend recorded yet</div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card rounded-2xl border border-border/40 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /> Spend by Supplier</h3>
            {spendBySupplier.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={spendBySupplier} layout="vertical" margin={{ left: 10, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(130 11% 89%)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrencyCompact(v)} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip contentStyle={{ borderRadius: 16, border: '1px solid hsl(130 11% 89%)' }} formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="spend" fill="hsl(28, 60%, 48%)" radius={[0, 6, 6, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[240px] text-sm text-muted-foreground">No supplier spend yet</div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
