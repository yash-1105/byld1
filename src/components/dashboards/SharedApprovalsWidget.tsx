import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Portal from '@/components/ui/portal';
import {
  ClipboardCheck, Clock, CheckCircle, XCircle, PauseCircle, X,
  FolderKanban, User, ChevronRight, Layers, ShoppingCart, DollarSign,
  FileText, Wrench, AlertTriangle,
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string; icon: React.ElementType }> = {
  pending:  { bg: 'bg-warning/15',     text: 'text-warning',          label: 'Pending',  icon: Clock },
  approved: { bg: 'bg-success/15',     text: 'text-success',          label: 'Approved', icon: CheckCircle },
  rejected: { bg: 'bg-destructive/15', text: 'text-destructive',      label: 'Rejected', icon: XCircle },
  on_hold:  { bg: 'bg-muted',          text: 'text-muted-foreground',  label: 'On Hold', icon: PauseCircle },
};

const CATEGORY_ICON: Record<string, React.ElementType> = {
  design: Layers, procurement: ShoppingCart, financial: DollarSign,
  contracts: FileText, execution: Wrench, issues: AlertTriangle,
};

const formatRole = (role?: string) => role ? role.charAt(0).toUpperCase() + role.slice(1) : '';

export default function SharedApprovalsWidget() {
  const { approvals, projects, users } = useData();
  const { user } = useAuth();
  const [openId, setOpenId] = useState<string | null>(null);

  const resolveName = (id: string) => {
    const u = users.find(u => u.id === id);
    return u?.full_name || u?.name || 'Unknown';
  };
  const resolveRole = (id: string) => users.find(u => u.id === id)?.role as string | undefined;
  const projectName = (id: string) => projects.find(p => p.id === id)?.name;

  // DataContext already scopes `approvals` to what this role may see.
  // Show newest first; surface pending ones at the top.
  const shared = useMemo(() => {
    return [...approvals].sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (b.status === 'pending' && a.status !== 'pending') return 1;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [approvals]);

  const pendingCount = shared.filter(a => a.status === 'pending').length;
  const openItem = shared.find(a => a.id === openId);

  if (shared.length === 0) {
    return (
      <div className="soft-card p-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <ClipboardCheck className="w-4.5 h-4.5 text-primary" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Shared Approvals</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-3 text-center py-6">
          No approvals have been shared with you yet.
        </p>
      </div>
    );
  }

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="soft-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <ClipboardCheck className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Shared Approvals</h3>
              <p className="text-[11px] text-muted-foreground">Approvals shared with you for visibility</p>
            </div>
          </div>
          {pendingCount > 0 && (
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-warning/15 text-warning font-semibold">
              {pendingCount} pending
            </span>
          )}
        </div>

        <div className="space-y-2">
          {shared.slice(0, 6).map((a, i) => {
            const st = STATUS_STYLES[a.status] || STATUS_STYLES.pending;
            const StatusIcon = st.icon;
            const CatIcon = CATEGORY_ICON[a.category.toLowerCase()] || ClipboardCheck;
            return (
              <motion.button
                key={a.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setOpenId(a.id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-background/40 hover:bg-muted/40 hover:border-primary/30 transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <CatIcon className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">{a.title}</p>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                    {projectName(a.projectId) && (
                      <span className="flex items-center gap-1 truncate"><FolderKanban className="w-3 h-3 shrink-0" />{projectName(a.projectId)}</span>
                    )}
                    <span className="flex items-center gap-1 truncate"><User className="w-3 h-3 shrink-0" />{resolveName(a.requestedBy)}</span>
                  </div>
                </div>
                <span className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full font-semibold shrink-0 ${st.bg} ${st.text}`}>
                  <StatusIcon className="w-3 h-3" />
                  {st.label}
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
              </motion.button>
            );
          })}
        </div>

        {shared.length > 6 && (
          <p className="text-[11px] text-muted-foreground text-center mt-3">
            Showing 6 of {shared.length} shared approvals
          </p>
        )}
      </motion.div>

      {/* Detail popup */}
      <Portal>
      <AnimatePresence>
        {openItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) setOpenId(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', stiffness: 280, damping: 26 }}
              className="bg-card rounded-3xl border shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              {(() => {
                const st = STATUS_STYLES[openItem.status] || STATUS_STYLES.pending;
                const StatusIcon = st.icon;
                return (
                  <>
                    {/* Image / header */}
                    {openItem.images && openItem.images.length > 0 ? (
                      <div className="relative h-44">
                        <img src={openItem.images[0]} alt={openItem.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        <button onClick={() => setOpenId(null)} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                        <span className={`absolute top-3 left-3 flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-semibold bg-black/50 text-white`}>
                          <StatusIcon className="w-3 h-3" /> {st.label}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-5 border-b border-border/40">
                        <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold ${st.bg} ${st.text}`}>
                          <StatusIcon className="w-3.5 h-3.5" /> {st.label}
                        </span>
                        <button onClick={() => setOpenId(null)} className="p-2 rounded-xl hover:bg-muted transition-colors">
                          <X className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                    )}

                    <div className="p-5 space-y-4">
                      <div>
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{openItem.category}</span>
                        <h2 className="text-lg font-bold text-foreground leading-snug mt-0.5">{openItem.title}</h2>
                      </div>

                      {openItem.description && (
                        <p className="text-sm text-muted-foreground leading-relaxed">{openItem.description}</p>
                      )}

                      <div className="space-y-2 text-xs">
                        {projectName(openItem.projectId) && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <FolderKanban className="w-3.5 h-3.5" /> {projectName(openItem.projectId)}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-muted-foreground flex-wrap">
                          <User className="w-3.5 h-3.5" />
                          Requested by <span className="font-medium text-foreground">{resolveName(openItem.requestedBy)}</span>
                          {resolveRole(openItem.requestedBy) && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">{formatRole(resolveRole(openItem.requestedBy))}</span>
                          )}
                        </div>
                        {openItem.createdAt && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" /> {new Date(openItem.createdAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      {openItem.status !== 'pending' && openItem.reason && (
                        <div className={`text-xs px-3 py-2.5 rounded-xl ${st.bg} ${st.text} border border-current/10`}>
                          <span className="font-semibold">Reason: </span>{openItem.reason}
                        </div>
                      )}
                      {openItem.status !== 'pending' && openItem.decidedBy && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                          Decided by <span className="font-medium text-foreground">{resolveName(openItem.decidedBy)}</span>
                          {resolveRole(openItem.decidedBy) && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-success/10 text-success font-semibold">{formatRole(resolveRole(openItem.decidedBy))}</span>
                          )}
                        </p>
                      )}

                      <div className="text-[11px] text-center text-muted-foreground py-2 bg-muted/30 rounded-xl">
                        {openItem.status === 'pending'
                          ? 'Shared with you for visibility — awaiting decision by an architect or client.'
                          : 'Shared with you for visibility.'}
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </Portal>
    </>
  );
}
