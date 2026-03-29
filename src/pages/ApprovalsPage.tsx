import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

const initialApprovals = [
  { id: '1', title: 'Change Order #12 - Additional Steel', project: 'Skyline Tower', type: 'Change Order', status: 'pending' as const, date: '2025-03-28', amount: '$45,000' },
  { id: '2', title: 'Landscape Design Revision', project: 'Harbor View', type: 'Design Change', status: 'pending' as const, date: '2025-03-26', amount: '-' },
  { id: '3', title: 'Foundation Inspection Sign-off', project: 'Skyline Tower', type: 'Inspection', status: 'approved' as const, date: '2025-03-20', amount: '-' },
  { id: '4', title: 'Material Substitution - Facade', project: 'Green Valley', type: 'Material', status: 'rejected' as const, date: '2025-03-18', amount: '$12,000' },
];

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState(initialApprovals);

  const handleAction = (id: string, action: 'approved' | 'rejected') => {
    setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: action } : a));
    toast.success(`Item ${action}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Approvals</h1>
        <p className="text-muted-foreground text-sm mt-1">Review and approve project decisions</p>
      </div>

      <div className="space-y-3">
        {approvals.map((a, i) => (
          <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground text-sm">{a.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    a.status === 'approved' ? 'bg-success/10 text-success' : a.status === 'rejected' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'
                  }`}>{a.status}</span>
                </div>
                <div className="text-xs text-muted-foreground">{a.project} · {a.type} · {a.date} {a.amount !== '-' && `· ${a.amount}`}</div>
              </div>
              {a.status === 'pending' && (
                <div className="flex gap-2 ml-4">
                  <button onClick={() => handleAction(a.id, 'approved')} className="p-2 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors">
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleAction(a.id, 'rejected')} className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
