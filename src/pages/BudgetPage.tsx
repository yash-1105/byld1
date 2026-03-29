import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

export default function BudgetPage() {
  const { projects, budgetItems, addBudgetItem } = useData();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: '', description: '', amount: '', type: 'expense', projectId: '1' });

  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const totalSpent = projects.reduce((s, p) => s + p.spent, 0);
  const expenses = budgetItems.filter(b => b.type === 'expense');
  const payments = budgetItems.filter(b => b.type === 'payment');

  const byCategory = expenses.reduce<Record<string, number>>((acc, b) => {
    acc[b.category] = (acc[b.category] || 0) + b.amount;
    return acc;
  }, {});
  const chartData = Object.entries(byCategory).map(([name, value]) => ({ name, value: value / 1000 }));

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
          <h1 className="text-2xl font-bold text-foreground">Budget</h1>
          <p className="text-muted-foreground text-sm mt-1">Financial overview and expense tracking</p>
        </div>
        <button onClick={() => setShowForm(true)} className="gradient-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Entry
        </button>
      </div>

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
    </div>
  );
}
