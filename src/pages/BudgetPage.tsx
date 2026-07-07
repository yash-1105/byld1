import { useState, useMemo, useEffect, useRef } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { supabase } from '@/integrations/supabase/client';
import { getAI, AI_MODEL } from '@/lib/ai';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, DollarSign, TrendingUp, TrendingDown, CreditCard, AlertTriangle, PieChart as PieIcon, Folder, Camera, Loader2, Pencil } from 'lucide-react';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart, CartesianGrid } from 'recharts';
import { toast } from 'sonner';
import { USD_RATES } from '@/lib/preferences';
import ReimbursementsTab from '@/components/budget/ReimbursementsTab';

const CHART_COLORS = [
  'hsl(28, 60%, 48%)',
  'hsl(158, 50%, 42%)',
  'hsl(38, 85%, 52%)',
  'hsl(262, 60%, 55%)',
  'hsl(4, 74%, 55%)',
  'hsl(190, 70%, 45%)',
];

// Fixed construction expense categories — keeps data clean & consistent across the app.
const EXPENSE_CATEGORIES = [
  'Materials',
  'Labor',
  'Equipment Rental',
  'Subcontractors',
  'Site Preparation',
  'Foundation & Concrete',
  'Structural & Framing',
  'Masonry',
  'Roofing',
  'Electrical',
  'Plumbing',
  'HVAC',
  'Flooring',
  'Painting & Finishing',
  'Doors & Windows',
  'Woodwork & Carpentry',
  'Permits & Approvals',
  'Professional Fees',
  'Utilities',
  'Transportation & Logistics',
  'Safety & Compliance',
  'Landscaping',
  'Other',
];

// Map an arbitrary (e.g. AI-scanned) category string to one of our fixed categories.
const normalizeCategory = (raw?: string): string => {
  if (!raw) return 'Materials';
  const exact = EXPENSE_CATEGORIES.find(c => c.toLowerCase() === raw.toLowerCase());
  if (exact) return exact;
  const r = raw.toLowerCase();
  if (r.includes('material')) return 'Materials';
  if (r.includes('labor') || r.includes('labour')) return 'Labor';
  if (r.includes('equip') || r.includes('rental') || r.includes('machinery')) return 'Equipment Rental';
  if (r.includes('subcontract') || r.includes('sub-contract')) return 'Subcontractors';
  if (r.includes('permit') || r.includes('approval') || r.includes('noc') || r.includes('license')) return 'Permits & Approvals';
  if (r.includes('electric')) return 'Electrical';
  if (r.includes('plumb')) return 'Plumbing';
  if (r.includes('hvac') || r.includes('air condition') || r.includes('cooling')) return 'HVAC';
  if (r.includes('floor') || r.includes('tile') || r.includes('marble')) return 'Flooring';
  if (r.includes('paint') || r.includes('finish')) return 'Painting & Finishing';
  if (r.includes('roof')) return 'Roofing';
  if (r.includes('door') || r.includes('window')) return 'Doors & Windows';
  if (r.includes('wood') || r.includes('carpent') || r.includes('plywood') || r.includes('timber')) return 'Woodwork & Carpentry';
  if (r.includes('concrete') || r.includes('cement') || r.includes('foundation')) return 'Foundation & Concrete';
  if (r.includes('structur') || r.includes('fram') || r.includes('steel')) return 'Structural & Framing';
  if (r.includes('masonry') || r.includes('brick') || r.includes('block')) return 'Masonry';
  if (r.includes('consult') || r.includes('architect') || r.includes('engineer') || r.includes('fee')) return 'Professional Fees';
  if (r.includes('utilit') || r.includes('water') || r.includes('power') || r.includes('dewa')) return 'Utilities';
  if (r.includes('transport') || r.includes('logistic') || r.includes('delivery') || r.includes('freight')) return 'Transportation & Logistics';
  if (r.includes('safety') || r.includes('compliance') || r.includes('ppe')) return 'Safety & Compliance';
  if (r.includes('landscap') || r.includes('garden')) return 'Landscaping';
  if (r.includes('site') && r.includes('prep')) return 'Site Preparation';
  return 'Other';
};

const statusColors: Record<string, string> = {
  paid: 'bg-success/10 text-success',
  pending: 'bg-warning/10 text-warning',
  approved: 'bg-primary/10 text-primary',
  overdue: 'bg-destructive/10 text-destructive',
};

// Procurement- and approval-linked entries store a hidden marker in the description
// (`PO:<id> · ` or `APR:<id>[ [est]] · `) for idempotency & linking — strip it for display.
const cleanDescription = (d?: string) => (d || '')
  .replace(/^PO:[0-9a-fA-F-]+\s*·\s*/, '')
  .replace(/^APR:[0-9a-fA-F-]+(\s*\[est\])?\s*·\s*/, '');

// Parse the approval marker from a budget entry description, if present.
const APR_MARKER_RE = /^APR:([0-9a-fA-F-]+)(\s*\[est\])?\s*·\s*/;
const parseApprovalMarker = (d?: string): { approvalId: string; isEstimate: boolean } | null => {
  const m = (d || '').match(APR_MARKER_RE);
  return m ? { approvalId: m[1], isEstimate: !!m[2] } : null;
};

type BudgetTab = 'dashboard' | 'expenses' | 'reimbursements';

const TAB_LABELS: Record<BudgetTab, string> = {
  dashboard: 'Financial Dashboard',
  expenses: 'Expenses',
  reimbursements: 'Reimbursements',
};

export default function BudgetPage() {
  const { projects, budgetItems, addBudgetItem, updateBudgetItem, reimbursements, approvals } = useData();
  const { user } = useAuth();
  const { preferences, formatCurrency, formatCurrencyCompact, formatDate } = usePreferences();
  const [activeProjectId, setActiveProjectId] = useState<string>('');

  // Editing the final cost of an approval-linked (esp. variable) budget entry
  const [editEntryId, setEditEntryId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');

  // Set initial active project
  useEffect(() => {
    if (projects.length > 0 && !activeProjectId) {
      setActiveProjectId(projects[0].id);
    }
  }, [projects, activeProjectId]);

  const [showForm, setShowForm] = useState(false);
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [lineItems, setLineItems] = useState([{ category: '', description: '', amount: '' }]);
  const [activeTab, setActiveTab] = useState<BudgetTab>('dashboard');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);

  const handleScanReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsScanning(true);
      toast.loading('Scanning receipt with AI...', { id: 'scan-toast' });

      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const base64Data = await base64Promise;

      const genAI = getAI();

      const prompt = `
        Analyze this receipt and extract all the line items as well as the date. 
        Categorize each line item into EXACTLY ONE of these construction categories: ${EXPENSE_CATEGORIES.join(', ')}.
        Ignore totals, sub-totals, and taxes. Only return an array of the actual line items that were purchased.
        Return ONLY a raw JSON object with no markdown formatting.
        Format:
        {
          "date": "YYYY-MM-DD",
          "items": [
            { "category": "Materials", "description": "Vinyl Flooring", "amount": "2611.87" }
          ]
        }
      `;

      let result;
      let lastError;
      const modelsToTry = [AI_MODEL, "gemini-2.0-flash", "gemini-flash-latest"];
      
      for (const modelName of modelsToTry) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          result = await model.generateContent([
            { inlineData: { data: base64Data, mimeType: file.type } },
            prompt
          ]);
          break; // Success
        } catch (err: any) {
          console.warn(`Model ${modelName} failed:`, err.message);
          lastError = err;
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }

      if (!result) {
        throw lastError || new Error('All Gemini models failed. Please try again later.');
      }

      const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (err) {
        throw new Error('AI returned invalid format');
      }

      const dateStr = parsed.date && !isNaN(new Date(parsed.date).getTime()) 
        ? new Date(parsed.date).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0];
      
      setFormDate(dateStr);
      
      if (parsed.items && Array.isArray(parsed.items) && parsed.items.length > 0) {
        setLineItems(parsed.items.map((i: any) => ({
          category: normalizeCategory(i.category),
          description: i.description || 'Scanned Item',
          amount: String(i.amount).replace(/[^0-9.]/g, '') || '',
        })));
      } else {
        setLineItems([{ category: '', description: '', amount: '' }]);
      }

      setShowForm(true);
      toast.success('Receipt scanned and categorized!', { id: 'scan-toast' });
      
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to scan: ' + err.message, { id: 'scan-toast' });
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];
  const projectExpenses = budgetItems.filter(b => b.projectId === activeProject?.id);
  const projectReimbursements = reimbursements.filter(r => r.projectId === activeProject?.id);

  // Convert a native-currency amount to USD for consistent aggregation
  const toUSD = (amount: number, currency: string) =>
    amount / (USD_RATES[currency as keyof typeof USD_RATES] ?? 1);

  const totalBudget = activeProject?.budget || 0;
  const expensesSpent = projectExpenses.reduce((sum, item) => sum + (item.amount || 0), 0);

  const activeReimb = projectReimbursements.filter(r =>
    ['pending_client_review', 'approved', 'paid'].includes(r.status));

  // Sum in USD so totals match the project budget (which is also stored in USD)
  const reimbSpentUSD = activeReimb.reduce((s, r) => s + toUSD(r.amount, r.currency), 0);

  const totalSpent = expensesSpent + reimbSpentUSD;
  const remaining = Math.max(totalBudget - totalSpent, 0);
  const pctUsed = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  // Unified categories for pie chart — all values in USD
  const allCategories = useMemo(() => {
    const map = new Map<string, number>();
    projectExpenses.forEach(exp => {
      const cat = exp.category || 'Other';
      map.set(cat, (map.get(cat) || 0) + exp.amount);
    });
    if (reimbSpentUSD > 0) map.set('Reimbursements', reimbSpentUSD);
    return Array.from(map.entries()).map(([name, valueUSD], i) => ({
      name, valueUSD, color: CHART_COLORS[i % CHART_COLORS.length],
    })).sort((a, b) => b.valueUSD - a.valueUSD);
  }, [projectExpenses, reimbSpentUSD]);

  // Monthly spend including reimbursements
  const monthlySpend = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = new Map<string, number>();
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      data.set(`${months[d.getMonth()]} ${d.getFullYear()}`, 0);
    }
    const addToMonth = (dateStr: string | undefined, amount: number) => {
      if (!dateStr) return;
      const d = new Date(dateStr);
      const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
      if (data.has(key)) data.set(key, data.get(key)! + amount);
    };
    projectExpenses.forEach(e => addToMonth(e.date, e.amount));
    projectReimbursements
      .filter(r => ['approved', 'paid'].includes(r.status))
      .forEach(r => addToMonth(r.submissionDate || r.dateIncurred, toUSD(r.amount, r.currency)));
    return Array.from(data.entries()).map(([month, amount]) => ({ month, amount }));
  }, [projectExpenses, projectReimbursements]);

  // Unified entries for Expenses tab
  const unifiedExpenses = useMemo(() => {
    type Row = {
      id: string; date: string; category: string; description: string;
      amount: number; currency: string; status: string;
      type: 'expense' | 'reimbursement';
      approvalId?: string; isEstimate?: boolean;
    };
    const rows: Row[] = [
      ...projectExpenses.map(e => {
        const apr = parseApprovalMarker(e.description);
        return {
          id: e.id, date: e.date, category: e.category || 'Other',
          description: cleanDescription(e.description) || '-',
          amount: e.amount, currency: '', status: e.status, type: 'expense' as const,
          approvalId: apr?.approvalId, isEstimate: apr?.isEstimate,
        };
      }),
      ...projectReimbursements.map(r => ({
        id: r.id, date: r.submissionDate || r.dateIncurred,
        category: r.expenseType || 'Reimbursement',
        description: r.description || r.expenseType,
        amount: r.amount, currency: r.currency, status: r.status, type: 'reimbursement' as const,
      })),
    ];
    return rows.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  }, [projectExpenses, projectReimbursements]);

  // Can the current user finalise an approval-linked entry's cost?
  // The approval's requester (assignee) or an architect.
  const canEditApprovalCost = (approvalId?: string): boolean => {
    if (!approvalId || !user) return false;
    if (user.role === 'architect') return true;
    const appr = approvals.find(a => a.id === approvalId);
    return !!appr && appr.requestedBy === user.id;
  };

  const openCostEditor = (entryId: string, currentUSD: number) => {
    const rate = USD_RATES[preferences.currency] ?? 1;
    setEditEntryId(entryId);
    setEditAmount((currentUSD * rate).toFixed(2)); // show in display currency
  };

  const saveCostEdit = () => {
    if (!editEntryId) return;
    const rate = USD_RATES[preferences.currency] ?? 1;
    const usd = parseFloat(editAmount) / rate;
    if (isNaN(usd) || usd < 0) { toast.error('Enter a valid amount'); return; }
    // Drop the `[est]` flag so the cost is locked — a variable estimate can be finalised only once.
    const entry = budgetItems.find(b => b.id === editEntryId);
    const finalizedDesc = entry?.description.replace(/^(APR:[0-9a-fA-F-]+)\s*\[est\]\s*·/, '$1 ·');
    updateBudgetItem(editEntryId, {
      amount: usd,
      ...(finalizedDesc && finalizedDesc !== entry?.description ? { description: finalizedDesc } : {}),
    });
    toast.success('Final cost set');
    setEditEntryId(null);
    setEditAmount('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject) return;
    
    let addedCount = 0;
    lineItems.forEach(item => {
      if (item.category.trim() && item.amount) {
        addBudgetItem({ 
          category: item.category,
          description: item.description,
          projectId: activeProject.id,
          amount: Number(item.amount) || 0, 
          type: 'expense', 
          date: formDate, 
          status: 'pending' 
        });
        addedCount++;
      }
    });
    
    if (addedCount > 0) {
      setFormDate(new Date().toISOString().split('T')[0]);
      setLineItems([{ category: '', description: '', amount: '' }]);
      setShowForm(false);
      toast.success(addedCount > 1 ? `${addedCount} budget entries added` : 'Budget entry added');
    } else {
      toast.error('Please fill in at least one expense correctly');
    }
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
          <p className="text-muted-foreground text-sm mt-1">Track expenses, budgets, and reimbursements across your projects</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleScanReceipt} />
          <button
            onClick={() => { setActiveTab('expenses'); fileInputRef.current?.click(); }}
            disabled={isScanning}
            className="bg-card border border-border text-foreground px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2 shadow-sm shrink-0 disabled:opacity-50"
          >
            {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4 text-primary" />}
            {isScanning ? 'Scanning...' : 'Scan Receipt'}
          </button>
          <button onClick={() => { setActiveTab('expenses'); setShowForm(true); }} className="gradient-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 flex items-center gap-2 shadow-lg shadow-primary/20 shrink-0">
            <Plus className="w-4 h-4" /> Add Entry
          </button>
        </div>
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
          { label: 'Total Budget', value: formatCurrencyCompact(totalBudget), icon: DollarSign, color: 'text-foreground', bg: 'bg-muted/50' },
          { label: 'Total Spent', value: formatCurrencyCompact(totalSpent), icon: TrendingDown, color: 'text-warning', bg: 'bg-warning/10', sub: `${pctUsed}% utilized` },
          { label: 'Remaining', value: formatCurrencyCompact(remaining), icon: TrendingUp, color: 'text-success', bg: 'bg-success/10' },
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
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {(Object.keys(TAB_LABELS) as BudgetTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab ? 'gradient-primary text-primary-foreground shadow-md shadow-primary/15' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border/40 p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground flex items-center gap-2">Add Expense — {activeProject?.name}</h3>
                <div className="flex items-center gap-3">
                  <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" required />
                  <button type="button" onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                </div>
              </div>
              
              <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
                {lineItems.map((item, idx) => (
                  <div key={idx} className="flex flex-col md:flex-row gap-3 relative">
                    <select value={item.category} onChange={e => { const newItems = [...lineItems]; newItems[idx].category = e.target.value; setLineItems(newItems); }} className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" required>
                      <option value="" disabled>Select category</option>
                      {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input value={item.description} onChange={e => { const newItems = [...lineItems]; newItems[idx].description = e.target.value; setLineItems(newItems); }} placeholder="Description" className="flex-[2] px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                    <input value={item.amount} onChange={e => { const newItems = [...lineItems]; newItems[idx].amount = e.target.value; setLineItems(newItems); }} placeholder="Amount" type="number" min="0" step="0.01" className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" required />
                    {lineItems.length > 1 && (
                      <button type="button" onClick={() => setLineItems(lineItems.filter((_, i) => i !== idx))} className="absolute -right-2 -top-2 bg-background border border-border text-muted-foreground w-6 h-6 flex items-center justify-center rounded-full hover:text-destructive shadow-sm md:static md:w-auto md:h-auto md:bg-transparent md:border-none md:shadow-none"><X className="w-4 h-4" /></button>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <button type="button" onClick={() => setLineItems([...lineItems, { category: '', description: '', amount: '' }])} className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1.5"><Plus className="w-4 h-4" /> Add Line Item</button>
                <button type="submit" className="gradient-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 shadow-lg shadow-primary/20">Save Expenses</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FINANCIAL DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border/40 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><PieIcon className="w-4 h-4 text-primary" /> Budget Breakdown</h3>
              {allCategories.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={allCategories} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={3} dataKey="valueUSD">
                        {allCategories.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 16, border: '1px solid hsl(130 11% 89%)', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} formatter={(v: number) => formatCurrencyCompact(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-3 mt-2">
                    {allCategories.map(d => (
                      <span key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        {d.name} ({(() => {
                          const p = totalSpent > 0 ? (d.valueUSD / totalSpent * 100) : 0;
                          return p === 0 ? '0%' : p < 0.1 ? '<0.1%' : `${p.toFixed(1)}%`;
                        })()})
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
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Spending Trend</h3>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={monthlySpend}>
                  <defs>
                    <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(28, 60%, 48%)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(28, 60%, 48%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(130 11% 89%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={52} tickFormatter={(v: number) => formatCurrencyCompact(v)} />
                  <Tooltip contentStyle={{ borderRadius: 16, border: '1px solid hsl(130 11% 89%)' }} formatter={(v: number) => formatCurrency(v)} />
                  <Area type="monotone" dataKey="amount" stroke="hsl(28, 60%, 48%)" fill="url(#spendGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Category breakdown */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Category Breakdown</h3>
            {allCategories.length > 0 ? allCategories.map((cat, i) => {
              const pct = totalBudget > 0 ? (cat.valueUSD / totalBudget) * 100 : 0;
              // Avoid a misleading "0.0%" for genuinely-spent-but-tiny categories
              const pctLabel = pct === 0 ? '0%' : pct < 0.1 ? '<0.1%' : `${pct.toFixed(1)}%`;
              const spentLabel = formatCurrencyCompact(cat.valueUSD);
              return (
                <motion.div key={cat.name} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="bg-card rounded-2xl border border-border/40 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">{cat.name}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{spentLabel} spent</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-foreground">{pctLabel}</span>
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
        </div>
      )}

      {/* EXPENSES — unified: budget entries + reimbursements */}
      {activeTab === 'expenses' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-2xl border border-border/40 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20">
                  {['Date', 'Type', 'Category', 'Description', 'Amount', 'Status', ''].map((h, hi) => (
                    <th key={hi} className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {unifiedExpenses.length > 0 ? unifiedExpenses.map((row, i) => {
                  const typeBadge =
                    row.type === 'reimbursement' ? 'bg-warning/10 text-warning' :
                    'bg-primary/10 text-primary';
                  const typeLabel =
                    row.type === 'reimbursement' ? 'Reimbursement' : 'Expense';
                  const amountUSD = row.currency
                    ? row.amount / (USD_RATES[row.currency as keyof typeof USD_RATES] ?? 1)
                    : row.amount;
                  const amountStr = formatCurrency(amountUSD);
                  const statusStyle = statusColors[row.status] || 'bg-muted text-muted-foreground';
                  const statusLabel =
                    row.type === 'reimbursement'
                      ? ({ draft: 'Draft', pending_client_review: 'Pending Review', approved: 'Approved', rejected: 'Rejected', paid: 'Paid', overdue: 'Overdue' } as Record<string,string>)[row.status] || row.status
                      : row.status;
                  return (
                    <motion.tr
                      key={row.id + row.type}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-border/20 hover:bg-muted/10 transition-colors"
                    >
                      <td className="px-5 py-4 text-muted-foreground whitespace-nowrap text-xs">
                        {row.date ? new Date(row.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`text-[11px] px-2 py-0.5 rounded-lg font-semibold ${typeBadge}`}>{typeLabel}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs px-2 py-0.5 rounded-lg bg-muted text-muted-foreground font-medium">{row.category}</span>
                      </td>
                      <td className="px-5 py-4 font-medium text-foreground max-w-[200px] truncate">{row.description}</td>
                      <td className="px-5 py-4 font-semibold text-foreground whitespace-nowrap">
                        <span className="inline-flex items-center gap-2">
                          {amountStr}
                          {row.isEstimate && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-warning/10 text-warning font-semibold uppercase tracking-wide">Est.</span>
                          )}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold capitalize ${statusStyle}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {/* Only variable-cost (estimate) entries are editable, and only once. */}
                        {row.isEstimate && canEditApprovalCost(row.approvalId) && (
                          <button
                            onClick={() => openCostEditor(row.id, amountUSD)}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 px-2.5 py-1.5 rounded-lg transition-colors"
                            title="Set the final cost now the work is done (can only be set once)"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Set final cost
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">
                      No entries recorded for this project yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* REIMBURSEMENTS */}
      {activeTab === 'reimbursements' && (
        <ReimbursementsTab />
      )}

      {/* Final-cost editor for approval-linked entries */}
      <AnimatePresence>
        {editEntryId && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) setEditEntryId(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', stiffness: 280, damping: 26 }}
              className="bg-card rounded-3xl border shadow-2xl w-full max-w-sm p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">Set Final Cost</h2>
                <button onClick={() => setEditEntryId(null)} className="p-2 rounded-xl hover:bg-muted transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Update the actual cost now the work is complete. This adjusts the project budget.
              </p>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                Amount ({preferences.currency})
              </label>
              <input
                type="number" min="0" step="0.01" autoFocus
                value={editAmount}
                onChange={e => setEditAmount(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveCostEdit(); }}
                className="w-full px-4 py-2.5 rounded-xl border bg-background/50 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
              <div className="flex gap-3 pt-5">
                <button onClick={() => setEditEntryId(null)} className="flex-1 py-2.5 rounded-xl text-sm text-muted-foreground bg-muted/50 hover:bg-muted transition-colors font-medium">
                  Cancel
                </button>
                <button onClick={saveCostEdit} className="flex-1 py-2.5 rounded-xl text-sm font-semibold gradient-primary text-primary-foreground shadow-md shadow-primary/20 hover:opacity-90 transition-opacity">
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
