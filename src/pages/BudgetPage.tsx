import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, DollarSign, TrendingUp, TrendingDown, FileText, CreditCard, Receipt } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';

const milestones = [
  { id: 'm1', name: 'Foundation Complete', amount: 2500000, status: 'paid' as const, date: '2025-01-15' },
  { id: 'm2', name: 'Structure Complete', amount: 3000000, status: 'approved' as const, date: '2025-03-25' },
  { id: 'm3', name: 'Envelope Complete', amount: 2000000, status: 'pending' as const, date: '2025-06-01' },
  { id: 'm4', name: 'Interior Fit-out', amount: 2500000, status: 'pending' as const, date: '2025-09-01' },
  { id: 'm5', name: 'Final Handover', amount: 2500000, status: 'pending' as const, date: '2025-12-15' },
];

export default function BudgetPage() {
  const { projects, budgetItems, addBudgetItem } = useData();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: '', description: '', amount: '', type: 'expense', projectId: '1' });
  const [activeTab, setActiveTab] = useState<'overview' | 'milestones' | 'invoices'>('overview');

  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const totalSpent = projects.reduce((s, p) => s + p.spent, 0);
  const expenses = budgetItems.filter(b => b.type === 'expense');

  const byCategory = expenses.reduce<Record<string, number>>((acc, b) => {
    acc[b.category] = (acc[b.category] || 0) + b.amount;
    return acc;
  }, {});
  const chartData = Object.entries(byCategory).map(([name, value]) => ({ name, value: value / 1000 }));
  const pieData = Object.entries(byCategory).map(([name, value]) => ({ name, value }));
  const pieColors = ['#3B82F6', '#22C55E', '#F59E0B', '#8B5CF6', '#EC4899'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category.trim()) return;
    addBudgetItem({ ...form, amount: Number(form.amount) || 0, type: form.type as any, date: new Date().toISOString().split('T')[0], status: 'pending' });
    setForm({ category: '', description: '', amount: '', type: 'expense', projectId: '1' });
    setShowForm(false);
    toast.success('Budget item added');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Budget & Finance</h1>
          <p className="text-muted-foreground text-sm mt-1">Track expenses, milestones, and invoices</p>
        </div>
        <button onClick={() => setShowForm(true)} className="gradient-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Entry
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><DollarSign className="w-4 h-4" /> Total Budget</div>
          <div className="text-2xl font-bold text-foreground">${(totalBudget / 1000000).toFixed(1)}M</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><TrendingDown className="w-4 h-4" /> Total Spent</div>
          <div className="text-2xl font-bold text-warning">${(totalSpent / 1000000).toFixed(1)}M</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><TrendingUp className="w-4 h-4" /> Remaining</div>
          <div className="text-2xl font-bold text-success">${((totalBudget - totalSpent) / 1000000).toFixed(1)}M</div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['overview', 'milestones', 'invoices'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize ${activeTab === tab ? 'gradient-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}>
            {tab === 'milestones' ? 'Payment Milestones' : tab === 'invoices' ? 'Invoices' : 'Overview'}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Add Budget Entry</h3>
                <button type="button" onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Category" className="px-4 py-2.5 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" required />
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" className="px-4 py-2.5 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                <input value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="Amount ($)" type="number" className="px-4 py-2.5 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="flex gap-4">
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="px-4 py-2.5 rounded-lg border border-border bg-background text-sm outline-none">
                  <option value="expense">Expense</option>
                  <option value="payment">Payment</option>
                </select>
                <button type="submit" className="gradient-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-medium hover:opacity-90">Add</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="glass-card p-5">
            <h3 className="font-semibold text-foreground mb-4">Expenses by Category (K)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid hsl(220 13% 91%)' }} />
                <Bar dataKey="value" fill="hsl(217, 91%, 60%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card p-5">
            <h3 className="font-semibold text-foreground mb-4">Budget Breakdown</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12 }} formatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {pieData.map((d, i) => (
                <span key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: pieColors[i % pieColors.length] }} />
                  {d.name}
                </span>
              ))}
            </div>
          </div>

          <div className="glass-card p-5 lg:col-span-2">
            <h3 className="font-semibold text-foreground mb-4">Recent Transactions</h3>
            <div className="space-y-2">
              {budgetItems.slice(0, 6).map(b => (
                <div key={b.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
                  <div>
                    <div className="text-sm font-medium text-foreground">{b.description}</div>
                    <div className="text-xs text-muted-foreground">{b.category} · {b.date}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${b.type === 'payment' ? 'text-success' : 'text-foreground'}`}>
                      {b.type === 'payment' ? '+' : '-'}${(b.amount / 1000).toFixed(0)}K
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      b.status === 'paid' ? 'bg-success/10 text-success' : b.status === 'approved' ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning'
                    }`}>{b.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'milestones' && (
        <div className="glass-card p-5">
          <h3 className="font-semibold text-foreground mb-4">Payment Milestones — Skyline Tower</h3>
          <div className="space-y-4">
            {milestones.map((m, i) => (
              <motion.div key={m.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
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
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    m.status === 'paid' ? 'bg-success/10 text-success' : m.status === 'approved' ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning'
                  }`}>{m.status}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="space-y-3">
          {[
            { id: 'INV-001', vendor: 'Steel Corp Ltd.', amount: 850000, date: '2025-03-15', status: 'paid' as const },
            { id: 'INV-002', vendor: 'ConcreteWorks Inc.', amount: 320000, date: '2025-03-01', status: 'paid' as const },
            { id: 'INV-003', vendor: 'MEP Solutions', amount: 450000, date: '2025-03-20', status: 'pending' as const },
            { id: 'INV-004', vendor: 'Crane Rental Co.', amount: 180000, date: '2025-01-15', status: 'paid' as const },
          ].map((inv, i) => (
            <motion.div key={inv.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">{inv.id} — {inv.vendor}</div>
                <div className="text-xs text-muted-foreground">{inv.date}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-foreground">${(inv.amount / 1000).toFixed(0)}K</div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${inv.status === 'paid' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>{inv.status}</span>
              </div>
              <button onClick={() => toast.info('Invoice PDF preview — demo feature')} className="text-xs text-primary hover:underline flex items-center gap-1">
                <FileText className="w-3 h-3" /> View
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
