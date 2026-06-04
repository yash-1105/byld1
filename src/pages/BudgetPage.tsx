import { useState, useMemo, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, DollarSign, TrendingUp, TrendingDown, CreditCard, AlertTriangle, PieChart as PieIcon, Folder } from 'lucide-react';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart, CartesianGrid } from 'recharts';
import { toast } from 'sonner';

const CHART_COLORS = [
  'hsl(28, 60%, 48%)',
  'hsl(158, 50%, 42%)',
  'hsl(38, 85%, 52%)',
  'hsl(262, 60%, 55%)',
  'hsl(4, 74%, 55%)',
  'hsl(190, 70%, 45%)',
];

const statusColors: Record<string, string> = {
  paid: 'bg-success/10 text-success',
  pending: 'bg-warning/10 text-warning',
  approved: 'bg-primary/10 text-primary',
  overdue: 'bg-destructive/10 text-destructive',
};

export default function BudgetPage() {
  const { projects, budgetItems, addBudgetItem } = useData();
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  
  // Set initial active project
  useEffect(() => {
    if (projects.length > 0 && !activeProjectId) {
      setActiveProjectId(projects[0].id);
    }
  }, [projects, activeProjectId]);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: '', description: '', amount: '', type: 'expense' });
  const [activeTab, setActiveTab] = useState<'overview' | 'categories' | 'expenses'>('overview');

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];
  const projectExpenses = budgetItems.filter(b => b.projectId === activeProject?.id);

  const totalBudget = activeProject?.budget || 0;
  const totalSpent = projectExpenses.reduce((sum, item) => sum + (item.amount || 0), 0);
  const remaining = Math.max(totalBudget - totalSpent, 0);
  const pctUsed = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  // Process categories for pie chart & segments
  const expenseCategories = useMemo(() => {
    const map = new Map<string, number>();
    projectExpenses.forEach(exp => {
      const cat = exp.category || 'Other';
      map.set(cat, (map.get(cat) || 0) + exp.amount);
    });
    return Array.from(map.entries()).map(([name, value], i) => ({
      name,
      value,
      color: CHART_COLORS[i % CHART_COLORS.length]
    })).sort((a, b) => b.value - a.value);
  }, [projectExpenses]);

  // Process monthly spend for area chart
  const monthlySpend = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = new Map<string, number>();
    
    // Initialize last 6 months
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      data.set(`${months[d.getMonth()]} ${d.getFullYear()}`, 0);
    }

    projectExpenses.forEach(exp => {
      if (!exp.date) return;
      const d = new Date(exp.date);
      const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
      if (data.has(key)) {
        data.set(key, data.get(key)! + exp.amount);
      }
    });

    return Array.from(data.entries()).map(([month, amount]) => ({ month, amount: amount / 1000 }));
  }, [projectExpenses]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category.trim() || !activeProject) return;
    addBudgetItem({ 
      ...form, 
      projectId: activeProject.id,
      amount: Number(form.amount) || 0, 
      type: form.type as any, 
      date: new Date().toISOString().split('T')[0], 
      status: 'pending' 
    });
    setForm({ category: '', description: '', amount: '', type: 'expense' });
    setShowForm(false);
    toast.success('Budget entry added');
  };

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
        <Folder className="w-12 h-12 mb-4 opacity-30" />
        <p>No projects found. Create a project first to manage budgets.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Budget & Finance</h1>
          <p className="text-muted-foreground text-sm mt-1">Track expenses, budgets, and payments across your projects</p>
        </div>
        <button onClick={() => setShowForm(true)} className="gradient-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 flex items-center gap-2 shadow-lg shadow-primary/20 shrink-0">
          <Plus className="w-4 h-4" /> Add Entry
        </button>
      </div>

      {/* Project Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {projects.map(p => (
          <button 
            key={p.id} 
            onClick={() => setActiveProjectId(p.id)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              activeProjectId === p.id 
                ? 'bg-foreground text-background shadow-md' 
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Top Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Budget', value: `$${totalBudget.toLocaleString()}`, icon: DollarSign, color: 'text-foreground', bg: 'bg-muted/50' },
          { label: 'Total Spent', value: `$${totalSpent.toLocaleString()}`, icon: TrendingDown, color: 'text-warning', bg: 'bg-warning/10', sub: `${pctUsed}% utilized` },
          { label: 'Remaining', value: `$${remaining.toLocaleString()}`, icon: TrendingUp, color: 'text-success', bg: 'bg-success/10' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card rounded-2xl border border-border/40 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color} mt-1 truncate max-w-[150px]`}>{s.value}</p>
                {s.sub && <p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>}
              </div>
              <div className={`w-11 h-11 rounded-2xl ${s.bg} flex items-center justify-center shrink-0`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
            </div>
            {s.label === 'Total Spent' && (
              <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(pctUsed, 100)}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className={`h-full rounded-full ${pctUsed > 80 ? 'bg-destructive' : 'gradient-primary'}`}
                />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Overspend alert */}
      {pctUsed >= 90 && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-destructive/5 border border-destructive/10">
          <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-destructive">Budget Alert:</span> {activeProject?.name} is at {pctUsed}% utilization. You are nearing your total budget limit.
          </p>
        </div>
      )}

      {/* Section Tabs */}
      <div className="flex gap-2">
        {(['overview', 'categories', 'expenses'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all capitalize ${
            activeTab === tab ? 'gradient-primary text-primary-foreground shadow-md shadow-primary/15' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
          }`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border/40 p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Add Expense — {activeProject?.name}</h3>
                <button type="button" onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Category (e.g. Materials)" className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" required />
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                <input value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="Amount ($)" type="number" min="0" step="0.01" className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" required />
              </div>
              <button type="submit" className="gradient-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 shadow-lg shadow-primary/20">Add Expense</button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border/40 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><PieIcon className="w-4 h-4 text-primary" /> Budget Breakdown</h3>
            {expenseCategories.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={expenseCategories} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={3} dataKey="value">
                      {expenseCategories.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 16, border: '1px solid hsl(36 20% 90%)', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} formatter={(v: number) => `$${v.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {expenseCategories.map(d => (
                    <span key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      {d.name} ({(d.value / totalSpent * 100).toFixed(0)}%)
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">
                No expenses recorded yet
              </div>
            )}
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

      {/* CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          {expenseCategories.length > 0 ? expenseCategories.map((cat, i) => {
            const pct = totalBudget > 0 ? Math.round((cat.value / totalBudget) * 100) : 0;
            return (
              <motion.div key={cat.name} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="bg-card rounded-2xl border border-border/40 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{cat.name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      ${cat.value.toLocaleString()} spent
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-foreground">{pct}%</span>
                    <span className="text-[10px] text-muted-foreground ml-1">of total budget</span>
                  </div>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(pct, 100)}%` }}
                    transition={{ duration: 0.8, delay: 0.2 + i * 0.08 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                </div>
              </motion.div>
            );
          }) : (
            <div className="text-center py-12 text-sm text-muted-foreground bg-card rounded-2xl border border-border/40">
              No expenses recorded for this project yet.
            </div>
          )}
        </div>
      )}

      {/* EXPENSES */}
      {activeTab === 'expenses' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-2xl border border-border/40 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20">
                  {['Date', 'Category', 'Description', 'Amount', 'Status'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projectExpenses.length > 0 ? projectExpenses.map((exp, i) => (
                  <motion.tr
                    key={exp.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-border/20 hover:bg-muted/10 transition-colors"
                  >
                    <td className="px-5 py-4 text-muted-foreground whitespace-nowrap">
                      {exp.date ? new Date(exp.date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs px-2 py-0.5 rounded-lg bg-primary/10 text-primary font-medium">{exp.category}</span>
                    </td>
                    <td className="px-5 py-4 font-medium text-foreground">{exp.description || '-'}</td>
                    <td className="px-5 py-4 font-semibold text-foreground">${exp.amount.toLocaleString()}</td>
                    <td className="px-5 py-4">
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold capitalize ${statusColors[exp.status] || 'bg-muted text-muted-foreground'}`}>
                        {exp.status}
                      </span>
                    </td>
                  </motion.tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                      No expenses recorded for this project yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
