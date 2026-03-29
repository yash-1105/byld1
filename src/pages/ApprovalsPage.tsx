import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Filter, FileText, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const initialApprovals = [
  { id: '1', title: 'Change Order #12 - Additional Steel', project: 'Skyline Tower', type: 'Change Order', status: 'pending' as const, date: '2025-03-28', amount: '$45,000', description: 'Additional structural steel required for reinforced beam connections on levels 30-35.' },
  { id: '2', title: 'Landscape Design Revision', project: 'Harbor View', type: 'Design Change', status: 'pending' as const, date: '2025-03-26', amount: '-', description: 'Updated landscape plan incorporating native plantings and rainwater collection.' },
  { id: '3', title: 'Foundation Inspection Sign-off', project: 'Skyline Tower', type: 'Inspection', status: 'approved' as const, date: '2025-03-20', amount: '-', description: 'Final foundation inspection completed. All structural tests passed.' },
  { id: '4', title: 'Material Substitution - Facade', project: 'Green Valley', type: 'Material', status: 'rejected' as const, date: '2025-03-18', amount: '$12,000', description: 'Request to substitute aluminum cladding with composite panels.' },
  { id: '5', title: 'MEP Systems Approval', project: 'Skyline Tower', type: 'Design Change', status: 'pending' as const, date: '2025-03-29', amount: '$8,500', description: 'Final mechanical and plumbing system layout for floors 20-28.' },
];

type FilterType = 'all' | 'pending' | 'approved' | 'rejected';

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState(initialApprovals);
  const [filter, setFilter] = useState<FilterType>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const handleAction = (id: string, action: 'approved' | 'rejected') => {
    setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: action } : a));
    toast.success(`Item ${action}`);
  };

  const filtered = filter === 'all' ? approvals : approvals.filter(a => a.status === (filter as string));
  const pendingCount = approvals.filter(a => a.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Approvals</h1>
          <p className="text-muted-foreground text-sm mt-1">{pendingCount} items pending review</p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-warning/10 text-warning text-sm font-medium">
            <AlertTriangle className="w-4 h-4" />
            {pendingCount} pending
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'pending', 'approved', 'rejected'] as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize ${filter === f ? 'gradient-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}>
            {f} {f !== 'all' ? `(${approvals.filter(a => f === 'all' || a.status === f).length})` : `(${approvals.length})`}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((a, i) => (
          <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card overflow-hidden">
            <button onClick={() => setExpanded(expanded === a.id ? null : a.id)} className="w-full text-left p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-semibold text-foreground text-sm">{a.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      a.status === 'approved' ? 'bg-success/10 text-success' : a.status === 'rejected' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'
                    }`}>{a.status}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{a.project} · {a.type} · {a.date} {a.amount !== '-' && `· ${a.amount}`}</div>
                </div>
                {a.status === 'pending' && (
                  <div className="flex gap-2 ml-4">
                    <button onClick={(e) => { e.stopPropagation(); handleAction(a.id, 'approved'); }} className="p-2 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleAction(a.id, 'rejected'); }} className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </button>
            {expanded === a.id && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="overflow-hidden">
                <div className="px-5 pb-5 pt-0 border-t border-border mt-0 pt-4">
                  <p className="text-sm text-muted-foreground">{a.description}</p>
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No {filter !== 'all' ? filter : ''} approvals found</p>
          </div>
        )}
      </div>
    </div>
  );
}
