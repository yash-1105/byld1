import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Receipt, CheckCircle2, Clock, XCircle, DollarSign, TrendingUp, AlertTriangle, FileCheck, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { ReimbursementStatus, Reimbursement } from '@/data/mockData';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { USD_RATES } from '@/lib/preferences';
import { supabase } from '@/integrations/supabase/client';
import NewReimbursementModal from './NewReimbursementModal';

const toUSD = (amount: number, currency: string) =>
  amount / (USD_RATES[currency as keyof typeof USD_RATES] ?? 1);

const sumUSD = (items: Reimbursement[]) =>
  items.reduce((s, r) => s + toUSD(r.amount, r.currency), 0);

type StatusFilter = 'all' | ReimbursementStatus;

const STATUS_LABELS: Record<ReimbursementStatus, string> = {
  draft: 'Draft',
  pending_client_review: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
  paid: 'Paid',
  overdue: 'Overdue',
};

const STATUS_COLORS: Record<ReimbursementStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  pending_client_review: 'bg-warning/10 text-warning',
  approved: 'bg-primary/10 text-primary',
  rejected: 'bg-destructive/10 text-destructive',
  paid: 'bg-success/10 text-success',
  overdue: 'bg-destructive/15 text-destructive font-medium',
};

const STATUS_ICONS: Record<ReimbursementStatus, React.ComponentType<any>> = {
  draft: FileCheck,
  pending_client_review: Clock,
  approved: CheckCircle2,
  rejected: XCircle,
  paid: CheckCircle2,
  overdue: AlertTriangle,
};

const FILTER_PILLS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'pending_client_review', label: 'Pending Review' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'paid', label: 'Paid' },
  { key: 'overdue', label: 'Overdue' },
];

export default function ReimbursementsTab() {
  const { reimbursements, updateReimbursement, addReimbursement, deleteReimbursement, projects } = useData();
  const { user } = useAuth();
  const { formatCurrency } = usePreferences();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isClient = user?.role === 'client';
  const isArchitectOrContractor = user?.role === 'architect' || user?.role === 'contractor';

  const visible = useMemo(() => {
    return reimbursements.filter(r => statusFilter === 'all' || r.status === statusFilter);
  }, [reimbursements, statusFilter]);

  const stats = useMemo(() => {
    const pending = reimbursements.filter(r => r.status === 'pending_client_review');
    const approved = reimbursements.filter(r => r.status === 'approved');
    const paid = reimbursements.filter(r => r.status === 'paid');
    const outstanding = [...pending, ...approved];
    return {
      pendingCount: pending.length,
      pendingAmount: pending.reduce((s, r) => s + r.amount, 0),
      approvedCount: approved.length,
      approvedAmount: approved.reduce((s, r) => s + r.amount, 0),
      paidCount: paid.length,
      paidAmount: paid.reduce((s, r) => s + r.amount, 0),
      outstandingAmount: outstanding.reduce((s, r) => s + r.amount, 0),
    };
  }, [reimbursements]);

  const notify = async (message: string) => {
    try {
      await supabase.from('notifications').insert({ type: 'info', message });
    } catch { /* non-blocking */ }
  };

  const handleSubmitForReview = (id: string, expenseType: string) => {
    updateReimbursement(id, { status: 'pending_client_review', submissionDate: new Date().toISOString().split('T')[0] });
    toast.success('Submitted for client review');
    notify(`Reimbursement for ${expenseType} submitted for client review`);
  };

  const handleApprove = (id: string, expenseType: string) => {
    updateReimbursement(id, {
      status: 'approved',
      decidedAt: new Date().toISOString(),
      decidedBy: (user as any)?.full_name || user?.email || 'Client',
    });
    toast.success(`${expenseType} reimbursement approved`);
    notify(`${expenseType} reimbursement approved`);
  };

  const handleReject = (id: string, expenseType: string) => {
    updateReimbursement(id, {
      status: 'rejected',
      decidedAt: new Date().toISOString(),
      decidedBy: (user as any)?.full_name || user?.email || 'Client',
    });
    toast.success('Reimbursement rejected');
    notify(`${expenseType} reimbursement was rejected`);
  };

  const handleMarkPaid = (id: string, expenseType: string) => {
    updateReimbursement(id, { status: 'paid', decidedAt: new Date().toISOString() });
    toast.success('Marked as paid');
    notify(`Payment received for ${expenseType}`);
  };

  const pending = reimbursements.filter(r => r.status === 'pending_client_review');
  const approved = reimbursements.filter(r => r.status === 'approved');
  const paid = reimbursements.filter(r => r.status === 'paid');

  const KPI_CARDS = [
    { label: 'Pending Review', value: formatCurrency(sumUSD(pending)), sub: `${stats.pendingCount} item${stats.pendingCount !== 1 ? 's' : ''}`, icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
    { label: 'Approved', value: formatCurrency(sumUSD(approved)), sub: `${stats.approvedCount} item${stats.approvedCount !== 1 ? 's' : ''}`, icon: CheckCircle2, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Total Paid', value: formatCurrency(sumUSD(paid)), sub: `${stats.paidCount} item${stats.paidCount !== 1 ? 's' : ''}`, icon: TrendingUp, color: 'text-success', bg: 'bg-success/10' },
    { label: 'Outstanding', value: formatCurrency(sumUSD([...pending, ...approved])), sub: 'Pending + approved', icon: DollarSign, color: 'text-foreground', bg: 'bg-muted/50' },
  ];

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_CARDS.map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card rounded-2xl border border-border/40 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className={`text-xl font-bold ${card.color} mt-1`}>{card.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{card.sub}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center shrink-0`}>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-1.5 flex-wrap">
          {FILTER_PILLS.map(pill => (
            <button
              key={pill.key}
              onClick={() => setStatusFilter(pill.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === pill.key
                  ? 'gradient-primary text-primary-foreground shadow-md shadow-primary/15'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {pill.label}
              {pill.key !== 'all' && (
                <span className="ml-1.5 opacity-60">{reimbursements.filter(r => r.status === pill.key).length}</span>
              )}
            </button>
          ))}
        </div>
        {isArchitectOrContractor && (
          <button onClick={() => setIsModalOpen(true)} className="gradient-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 flex items-center gap-2 shadow-lg shadow-primary/20 shrink-0">
            <Plus className="w-4 h-4" /> New Reimbursement
          </button>
        )}
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-2xl border border-border/40 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 bg-muted/20">
                {['Expense Type', 'Project', 'Client', 'Amount', 'Submitted', 'Status', 'Receipt', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-muted-foreground">
                    <Receipt className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No reimbursements yet. Create one to get started.</p>
                  </td>
                </tr>
              ) : visible.map((r, i) => {
                const Icon = STATUS_ICONS[r.status];
                return (
                  <motion.tr key={r.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="border-b border-border/20 last:border-0 hover:bg-muted/10 transition-colors">
                    <td className="px-5 py-4 font-medium text-foreground whitespace-nowrap">{r.expenseType}</td>
                    <td className="px-5 py-4 text-muted-foreground whitespace-nowrap">{r.projectName}</td>
                    <td className="px-5 py-4 text-muted-foreground whitespace-nowrap">{r.clientName || '—'}</td>
                    <td className="px-5 py-4 font-semibold text-foreground whitespace-nowrap">{formatCurrency(toUSD(r.amount, r.currency))}</td>
                    <td className="px-5 py-4 text-muted-foreground whitespace-nowrap text-xs">
                      {r.submissionDate ? new Date(r.submissionDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-semibold ${STATUS_COLORS[r.status]}`}>
                        <Icon className="w-3 h-3" />
                        {STATUS_LABELS[r.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {r.receiptUrl ? (
                        <a href={r.receiptUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 px-2.5 py-1.5 rounded-lg transition-colors">
                          <Eye className="w-3.5 h-3.5" /> View Receipt
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        {isArchitectOrContractor && r.status === 'draft' && (
                          <button onClick={() => handleSubmitForReview(r.id, r.expenseType)} className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium whitespace-nowrap">
                            Submit for Review
                          </button>
                        )}
                        {isArchitectOrContractor && (r.status === 'draft' || r.status === 'rejected') && (
                          <button onClick={() => deleteReimbursement(r.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isClient && r.status === 'pending_client_review' && (
                          <>
                            <button onClick={() => handleApprove(r.id, r.expenseType)} className="text-xs px-3 py-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors font-medium">Approve</button>
                            <button onClick={() => handleReject(r.id, r.expenseType)} className="text-xs px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors font-medium">Reject</button>
                          </>
                        )}
                        {isClient && r.status === 'approved' && (
                          <button onClick={() => handleMarkPaid(r.id, r.expenseType)} className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium whitespace-nowrap">Mark Paid</button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Rejection notes */}
      {visible.some(r => r.rejectionReason) && (
        <div className="space-y-2">
          {visible.filter(r => r.rejectionReason).map(r => (
            <div key={r.id} className="flex items-start gap-3 px-4 py-3 rounded-xl bg-destructive/5 border border-destructive/10 text-xs">
              <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-destructive">{r.expenseType}:</span>{' '}
                <span className="text-muted-foreground">{r.rejectionReason}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <NewReimbursementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={addReimbursement}
        projects={projects}
        currentUser={user || { id: '' }}
      />
    </div>
  );
}
