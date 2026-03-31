import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Pause, MessageSquare, Clock, User } from 'lucide-react';
import { toast } from 'sonner';

export interface ApprovalItem {
  id: string;
  title: string;
  category: string;
  image: string;
  status: 'pending' | 'approved' | 'rejected' | 'on_hold';
  requestedBy: string;
  date: string;
  cost?: string;
  description?: string;
}

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-warning/10', text: 'text-warning', label: 'Pending' },
  approved: { bg: 'bg-success/10', text: 'text-success', label: 'Approved' },
  rejected: { bg: 'bg-destructive/10', text: 'text-destructive', label: 'Rejected' },
  on_hold: { bg: 'bg-muted', text: 'text-muted-foreground', label: 'On Hold' },
};

interface Props {
  item: ApprovalItem;
  index: number;
  onAction: (id: string, action: 'approved' | 'rejected' | 'on_hold', reason?: string) => void;
}

export default function ApprovalCard({ item, index, onAction }: Props) {
  const [reason, setReason] = useState('');
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [pendingAction, setPendingAction] = useState<'rejected' | 'on_hold' | null>(null);
  const st = statusStyles[item.status];

  const handleAction = (action: 'approved' | 'rejected' | 'on_hold') => {
    if (action === 'approved') {
      onAction(item.id, 'approved');
      toast.success(`"${item.title}" approved`);
      return;
    }
    setPendingAction(action);
    setShowReasonInput(true);
  };

  const submitWithReason = () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason');
      return;
    }
    onAction(item.id, pendingAction!, reason);
    toast.success(`"${item.title}" ${pendingAction === 'rejected' ? 'rejected' : 'put on hold'}`);
    setShowReasonInput(false);
    setReason('');
    setPendingAction(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, rotate: -0.5 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 200 }}
      whileHover={{ y: -4, boxShadow: '0 20px 60px -15px rgba(0,0,0,0.12)' }}
      className="soft-card overflow-hidden group"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 to-transparent" />
        <span className={`absolute top-3 right-3 text-[11px] px-3 py-1 rounded-full font-semibold ${st.bg} ${st.text} backdrop-blur-md`}>
          {st.label}
        </span>
        {item.cost && (
          <span className="absolute top-3 left-3 text-[11px] px-3 py-1 rounded-full font-semibold bg-card/80 text-foreground backdrop-blur-md">
            {item.cost}
          </span>
        )}
        <div className="absolute bottom-3 left-4 right-4">
          <h3 className="text-primary-foreground font-semibold text-base drop-shadow-lg">{item.title}</h3>
          <p className="text-primary-foreground/70 text-xs mt-0.5">{item.category}</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {item.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />{item.requestedBy}</span>
          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{item.date}</span>
        </div>

        {/* Actions */}
        {item.status === 'pending' && !showReasonInput && (
          <div className="flex gap-2 pt-1">
            <button onClick={() => handleAction('approved')} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-success/10 text-success text-sm font-medium hover:bg-success/20 transition-colors">
              <Check className="w-4 h-4" /> Approve
            </button>
            <button onClick={() => handleAction('rejected')} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors">
              <X className="w-4 h-4" /> Reject
            </button>
            <button onClick={() => handleAction('on_hold')} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-warning/10 text-warning text-sm font-medium hover:bg-warning/20 transition-colors">
              <Pause className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Reason Input */}
        {showReasonInput && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3">
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder={`Reason for ${pendingAction === 'rejected' ? 'rejection' : 'holding'}...`}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-muted/30 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <button onClick={submitWithReason} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${pendingAction === 'rejected' ? 'bg-destructive/10 text-destructive hover:bg-destructive/20' : 'bg-warning/10 text-warning hover:bg-warning/20'}`}>
                Confirm {pendingAction === 'rejected' ? 'Rejection' : 'Hold'}
              </button>
              <button onClick={() => { setShowReasonInput(false); setPendingAction(null); }} className="px-4 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-muted transition-colors">
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
