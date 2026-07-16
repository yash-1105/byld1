import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check, X, Pause, MessageSquare, Clock, User, Layers, ShoppingCart,
  DollarSign, FileText, Wrench, AlertTriangle, ClipboardCheck, FolderKanban,
  CheckCircle, XCircle, PauseCircle, ChevronLeft, ChevronRight, ImageOff, Coins,
  CalendarClock
} from 'lucide-react';
import { toast } from 'sonner';

export interface ApprovalItem {
  id: string;
  title: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected' | 'on_hold';
  requestedBy: string;
  requestedByRole?: string;
  date: string;
  dueDate?: string;   // formatted, e.g. "Jul 20"
  overdue?: boolean;  // still pending past its due date
  description?: string;
  images?: string[];
  reason?: string;
  decidedBy?: string;
  decidedByRole?: string;
  projectName?: string;
  cost?: string;                       // formatted, in display currency
  costType?: 'fixed' | 'variable';
}

// Pretty-print a role for display, e.g. "architect" → "Architect".
const formatRole = (role?: string) =>
  role ? role.charAt(0).toUpperCase() + role.slice(1) : '';

const STATUS_STYLES = {
  pending:  { bg: 'bg-warning/15',     text: 'text-warning',         label: 'Pending',   icon: Clock },
  approved: { bg: 'bg-success/15',     text: 'text-success',         label: 'Approved',  icon: CheckCircle },
  rejected: { bg: 'bg-destructive/15', text: 'text-destructive',     label: 'Rejected',  icon: XCircle },
  on_hold:  { bg: 'bg-muted',          text: 'text-muted-foreground', label: 'On Hold',  icon: PauseCircle },
};

const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; bg: string; iconColor: string }> = {
  design:       { icon: Layers,        bg: 'bg-primary/10',          iconColor: 'text-primary' },
  procurement:  { icon: ShoppingCart,  bg: 'bg-warning/10',          iconColor: 'text-warning' },
  financial:    { icon: DollarSign,    bg: 'bg-success/10',          iconColor: 'text-success' },
  contracts:    { icon: FileText,      bg: 'bg-blue-50',             iconColor: 'text-blue-600' },
  execution:    { icon: Wrench,        bg: 'bg-orange-50',           iconColor: 'text-orange-600' },
  issues:       { icon: AlertTriangle, bg: 'bg-destructive/10',      iconColor: 'text-destructive' },
};

function getCategoryConfig(category: string) {
  return CATEGORY_CONFIG[category.toLowerCase()] ?? { icon: ClipboardCheck, bg: 'bg-muted', iconColor: 'text-muted-foreground' };
}

interface Props {
  item: ApprovalItem;
  index: number;
  onAction: (id: string, action: 'approved' | 'rejected' | 'on_hold', reason?: string) => void;
  canDecide?: boolean;
}

export default function ApprovalCard({ item, index, onAction, canDecide = true }: Props) {
  const [reason, setReason] = useState('');
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [pendingAction, setPendingAction] = useState<'rejected' | 'on_hold' | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);

  const st = STATUS_STYLES[item.status];
  const StatusIcon = st.icon;
  const catCfg = getCategoryConfig(item.category);
  const CatIcon = catCfg.icon;
  const photos = item.images ?? [];
  const hasPhotos = photos.length > 0;

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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 200, damping: 22 }}
      whileHover={{ y: -4, boxShadow: '0 16px 48px -12px rgba(0,0,0,0.1)' }}
      className="soft-card overflow-hidden group"
    >
      {/* Header: photo carousel if images present, else category icon */}
      <div className={`relative ${hasPhotos ? 'h-32' : 'h-16 sm:h-32'} border-b border-border/40 overflow-hidden`}>
        {hasPhotos ? (
          <>
            <img
              src={photos[photoIndex]}
              alt={`Photo ${photoIndex + 1}`}
              className="w-full h-full object-cover"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            {photos.length > 1 && (
              <>
                <button
                  onClick={e => { e.stopPropagation(); setPhotoIndex(i => (i - 1 + photos.length) % photos.length); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); setPhotoIndex(i => (i + 1) % photos.length); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {photos.map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === photoIndex ? 'bg-white' : 'bg-white/40'}`} />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className={`w-full h-full ${catCfg.bg} flex flex-row sm:flex-col items-center justify-center gap-2`}>
            <div className="w-9 h-9 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white/60 backdrop-blur-sm flex items-center justify-center shadow-sm">
              <CatIcon className={`w-4.5 h-4.5 sm:w-7 sm:h-7 ${catCfg.iconColor}`} />
            </div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{item.category}</span>
          </div>
        )}
        <span className={`absolute top-3 right-3 flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-semibold backdrop-blur-sm ${hasPhotos ? 'bg-black/50 text-white' : `${st.bg} ${st.text}`}`}>
          <StatusIcon className="w-3 h-3" />
          {st.label}
        </span>
        {item.projectName && (
          <span className="absolute top-3 left-3 flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-card/80 text-muted-foreground backdrop-blur-sm border border-border/30">
            <FolderKanban className="w-3 h-3" />
            {item.projectName}
          </span>
        )}
        {hasPhotos && (
          <span className="absolute bottom-2 right-3 text-[10px] px-2 py-0.5 rounded-full bg-black/50 text-white backdrop-blur-sm">
            {item.category}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 space-y-3">
        <h3 className="text-sm font-bold text-foreground leading-snug">{item.title}</h3>

        {item.description && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{item.description}</p>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            {item.requestedBy || 'Unknown'}
            {item.requestedByRole && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">{formatRole(item.requestedByRole)}</span>
            )}
          </span>
          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{item.date}</span>
          {item.dueDate && (
            <span className={`flex items-center gap-1.5 ${item.overdue ? 'text-destructive font-medium' : ''}`}>
              <CalendarClock className="w-3.5 h-3.5" />Due {item.dueDate}
            </span>
          )}
          {item.overdue && (
            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/15 text-destructive font-semibold">
              <AlertTriangle className="w-3 h-3" />Overdue
            </span>
          )}
        </div>

        {/* Cost */}
        {item.cost && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground bg-muted/60 px-2.5 py-1 rounded-lg">
              <Coins className="w-3.5 h-3.5 text-primary" />
              {item.cost}
            </span>
            {item.costType && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${item.costType === 'variable' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>
                {item.costType === 'variable' ? 'Est.' : 'Fixed'}
              </span>
            )}
          </div>
        )}

        {/* Decided reason (for non-pending) */}
        {item.status !== 'pending' && item.reason && (
          <div className={`text-xs px-3 py-2.5 rounded-xl ${st.bg} ${st.text} border border-current/10`}>
            <span className="font-semibold">Reason: </span>{item.reason}
          </div>
        )}
        {item.status !== 'pending' && item.decidedBy && (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
            Decided by <span className="font-medium text-foreground">{item.decidedBy}</span>
            {item.decidedByRole && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-success/10 text-success font-semibold">{formatRole(item.decidedByRole)}</span>
            )}
          </p>
        )}

        {/* Actions — only for pending + canDecide */}
        {item.status === 'pending' && canDecide && !showReasonInput && (
          <div className="flex gap-2 pt-1">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => handleAction('approved')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-success/10 text-success text-xs font-semibold hover:bg-success/20 transition-colors border border-success/20"
            >
              <Check className="w-3.5 h-3.5" /> Approve
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => handleAction('rejected')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-destructive/10 text-destructive text-xs font-semibold hover:bg-destructive/20 transition-colors border border-destructive/20"
            >
              <X className="w-3.5 h-3.5" /> Reject
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAction('on_hold')}
              className="flex items-center justify-center px-3 py-2.5 rounded-xl bg-warning/10 text-warning text-xs font-semibold hover:bg-warning/20 transition-colors border border-warning/20"
              title="Put on hold"
            >
              <Pause className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        )}

        {item.status === 'pending' && !canDecide && (
          <div className="pt-1 text-xs text-center text-muted-foreground py-2 bg-muted/30 rounded-xl">
            Awaiting decision
          </div>
        )}

        {/* Reason input */}
        {showReasonInput && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3">
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 w-3.5 h-3.5 text-muted-foreground" />
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Reason for decision..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-muted/20 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all"
                rows={2}
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={submitWithReason}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-colors border ${
                  pendingAction === 'rejected'
                    ? 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20'
                    : 'bg-warning/10 text-warning border-warning/20 hover:bg-warning/20'
                }`}
              >
                Confirm {pendingAction === 'rejected' ? 'Rejection' : 'Hold'}
              </motion.button>
              <button
                onClick={() => { setShowReasonInput(false); setPendingAction(null); setReason(''); }}
                className="px-4 py-2.5 rounded-xl text-xs text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
