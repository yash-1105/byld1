import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, DollarSign, TrendingUp, TrendingDown, FileText, CreditCard, Receipt, AlertTriangle, ArrowUpRight, PieChart as PieIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart, CartesianGrid } from 'recharts';
import { toast } from 'sonner';

const segmentBudgets = [
  { name: 'Living Room', allocated: 180000, spent: 124000, color: 'hsl(28, 60%, 48%)' },
  { name: 'Kitchen', allocated: 150000, spent: 98000, color: 'hsl(158, 50%, 42%)' },
  { name: 'Bedroom', allocated: 95000, spent: 45000, color: 'hsl(38, 85%, 52%)' },
  { name: 'Bathroom', allocated: 85000, spent: 72000, color: 'hsl(262, 60%, 55%)' },
  { name: 'Outdoor', allocated: 65000, spent: 28000, color: 'hsl(4, 74%, 55%)' },
];

const expenseCategories = [
  { name: 'Materials', value: 380000, color: 'hsl(28, 60%, 48%)' },
  { name: 'Labour', value: 220000, color: 'hsl(158, 50%, 42%)' },
  { name: 'Design', value: 95000, color: 'hsl(38, 85%, 52%)' },
  { name: 'Equipment', value: 65000, color: 'hsl(262, 60%, 55%)' },
  { name: 'Permits', value: 25000, color: 'hsl(4, 74%, 55%)' },
];

const monthlySpend = [
  { month: 'Jan', amount: 85 },
  { month: 'Feb', amount: 120 },
  { month: 'Mar', amount: 95 },
  { month: 'Apr', amount: 145 },
  { month: 'May', amount: 110 },
  { month: 'Jun', amount: 130 },
];

const expenses = [
  { id: 'e1', date: 'Mar 28', segment: 'Living Room', item: 'Velvet Sofa — Forest Green', amount: 2900, status: 'paid' as const, costBeforeTax: 2520, finalCost: 2900 },
  { id: 'e2', date: 'Mar 26', segment: 'Kitchen', item: 'Italian Marble Countertop', amount: 6200, status: 'pending' as const, costBeforeTax: 5400, finalCost: 6200 },
  { id: 'e3', date: 'Mar 24', segment: 'Bathroom', item: 'Ceramic Basin — Matte White', amount: 890, status: 'paid' as const, costBeforeTax: 775, finalCost: 890 },
  { id: 'e4', date: 'Mar 22', segment: 'Living Room', item: 'Crystal Chandelier', amount: 5400, status: 'overdue' as const, costBeforeTax: 4700, finalCost: 5400 },
  { id: 'e5', date: 'Mar 20', segment: 'Bedroom', item: 'Wood Coffee Table', amount: 1200, status: 'paid' as const, costBeforeTax: 1045, finalCost: 1200 },
  { id: 'e6', date: 'Mar 18', segment: 'Kitchen', item: 'Pendant Light Cluster', amount: 1850, status: 'pending' as const, costBeforeTax: 1610, finalCost: 1850 },
];

const milestones = [
  { id: 'm1', name: 'Foundation Complete', amount: 2500000, status: 'paid' as const, date: '2025-01-15' },
  { id: 'm2', name: 'Structure Complete', amount: 3000000, status: 'approved' as const, date: '2025-03-25' },
  { id: 'm3', name: 'Envelope Complete', amount: 2000000, status: 'pending' as const, date: '2025-06-01' },
  { id: 'm4', name: 'Interior Fit-out', amount: 2500000, status: 'pending' as const, date: '2025-09-01' },
  { id: 'm5', name: 'Final Handover', amount: 2500000, status: 'pending' as const, date: '2025-12-15' },
];

const statusColors: Record<string, string> = {
  paid: 'bg-success/10 text-success',
  pending: 'bg-warning/10 text-warning',
  approved: 'bg-primary/10 text-primary',
  overdue: 'bg-destructive/10 text-destructive',
};

export default function BudgetPage() {
  const { projects, budgetItems, addBudgetItem } = useData();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: '', description: '', amount: '', type: 'expense', projectId: '1' });
  const [activeTab, setActiveTab] = useState<'overview' | 'segments' | 'expenses' | 'milestones'>('overview');

  const totalBudget = 575000;
  const totalSpent = 367000;
  const remaining = totalBudget - totalSpent;
  const pctUsed = Math.round((totalSpent / totalBudget) * 100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category.trim()) return;
    addBudgetItem({ ...form, amount: Number(form.amount) || 0, type: form.type as any, date: new Date().toISOString().split('T')[0], status: 'pending' });
    setForm({ category: '', description: '', amount: '', type: 'expense', projectId: '1' });
    setShowForm(false);
    toast.success('Budget entry added');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Budget & Finance</h1>
          <p className="text-muted-foreground text-sm mt-1">Track expenses, budgets, and payments</p>
        </div>
        <button onClick={() => setShowForm(true)} className="gradient-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 flex items-center gap-2 shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" /> Add Entry
        </button>
      </div>

      {/* Top Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Budget', value: `$${(totalBudget / 1000).toFixed(0)}K`, icon: DollarSign, color: 'text-foreground', bg: 'bg-muted/50' },
          { label: 'Total Spent', value: `$${(totalSpent / 1000).toFixed(0)}K`, icon: TrendingDown, color: 'text-warning', bg: 'bg-warning/10', sub: `${pctUsed}% utilized` },
          { label: 'Remaining', value: `$${(remaining / 1000).toFixed(0)}K`, icon: TrendingUp, color: 'text-success', bg: 'bg-success/10' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card rounded-2xl border border-border/40 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color} mt-1`}>{s.value}</p>
                {s.sub && <p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>}
              </div>
              <div className={`w-11 h-11 rounded-2xl ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
            </div>
            {s.label === 'Total Spent' && (
              <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pctUsed}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className={`h-full rounded-full ${pctUsed > 80 ? 'bg-destructive' : 'gradient-primary'}`}
                />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Overspend alert */}
      {segmentBudgets.some(s => s.spent / s.allocated > 0.85) && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-destructive/5 border border-destructive/10">
          <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-destructive">Budget Alert:</span> Bathroom is at {Math.round(segmentBudgets[3].spent / segmentBudgets[3].allocated * 100)}% utilization.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {(['overview', 'segments', 'expenses', 'milestones'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all capitalize ${
            activeTab === tab ? 'gradient-primary text-primary-foreground shadow-md shadow-primary/15' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
          }`}>
            {tab === 'milestones' ? 'Payment Milestones' : tab}
          </button>
        ))}
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border/40 p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Add Budget Entry</h3>
                <button type="button" onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Category" className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" required />
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                <input value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="Amount ($)" type="number" className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <button type="submit" className="gradient-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 shadow-lg shadow-primary/20">Add</button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border/40 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><PieIcon className="w-4 h-4 text-primary" /> Budget Breakdown</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={expenseCategories} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={3} dataKey="value">
                  {expenseCategories.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 16, border: '1px solid hsl(36 20% 90%)', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} formatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {expenseCategories.map(d => (
                <span key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  {d.name}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card rounded-2xl border border-border/40 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Spending Trend ($K)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={monthlySpend}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(28, 60%, 48%)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(28, 60%, 48%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(33 18% 88%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 16, border: '1px solid hsl(36 20% 90%)' }} />
                <Area type="monotone" dataKey="amount" stroke="hsl(28, 60%, 48%)" fill="url(#spendGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* SEGMENTS */}
      {activeTab === 'segments' && (
        <div className="space-y-4">
          {segmentBudgets.map((seg, i) => {
            const pct = Math.round((seg.spent / seg.allocated) * 100);
            const isOver = pct > 85;
            return (
              <motion.div key={seg.name} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="bg-card rounded-2xl border border-border/40 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{seg.name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      ${(seg.spent / 1000).toFixed(0)}K spent of ${(seg.allocated / 1000).toFixed(0)}K allocated
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-bold ${isOver ? 'text-destructive' : 'text-foreground'}`}>{pct}%</span>
                    {isOver && <AlertTriangle className="w-3 h-3 text-destructive inline-block ml-1" />}
                  </div>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(pct, 100)}%` }}
                    transition={{ duration: 0.8, delay: 0.2 + i * 0.08 }}
                    className={`h-full rounded-full ${isOver ? 'bg-destructive' : ''}`}
                    style={!isOver ? { backgroundColor: seg.color } : {}}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5">
                  <span>Remaining: ${((seg.allocated - seg.spent) / 1000).toFixed(0)}K</span>
                  <span className={isOver ? 'text-destructive font-semibold' : ''}>{isOver ? 'Over budget risk!' : 'On track'}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* EXPENSES */}
      {activeTab === 'expenses' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-2xl border border-border/40 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20">
                  {['Date', 'Segment', 'Item', 'Before Tax', 'Final Cost', 'Status'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp, i) => (
                  <motion.tr
                    key={exp.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-border/20 hover:bg-muted/10 transition-colors"
                  >
                    <td className="px-5 py-4 text-muted-foreground">{exp.date}</td>
                    <td className="px-5 py-4">
                      <span className="text-xs px-2 py-0.5 rounded-lg bg-primary/10 text-primary font-medium">{exp.segment}</span>
                    </td>
                    <td className="px-5 py-4 font-medium text-foreground">{exp.item}</td>
                    <td className="px-5 py-4 text-muted-foreground">${exp.costBeforeTax.toLocaleString()}</td>
                    <td className="px-5 py-4 font-semibold text-foreground">${exp.finalCost.toLocaleString()}</td>
                    <td className="px-5 py-4">
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold capitalize ${statusColors[exp.status]}`}>{exp.status}</span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* MILESTONES */}
      {activeTab === 'milestones' && (
        <div className="bg-card rounded-2xl border border-border/40 p-6 shadow-sm">
          <h3 className="font-semibold text-foreground mb-5">Payment Milestones — Skyline Tower</h3>
          <div className="space-y-4">
            {milestones.map((m, i) => (
              <motion.div key={m.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="flex items-center gap-4 p-4 rounded-xl bg-muted/20 border border-border/30 hover:bg-muted/30 transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  m.status === 'paid' ? 'bg-success/10' : m.status === 'approved' ? 'bg-primary/10' : 'bg-muted'
                }`}>
                  <CreditCard className={`w-5 h-5 ${m.status === 'paid' ? 'text-success' : m.status === 'approved' ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">{m.name}</div>
                  <div className="text-xs text-muted-foreground">{m.date}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-foreground">${(m.amount / 1000000).toFixed(1)}M</div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[m.status]}`}>{m.status}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
