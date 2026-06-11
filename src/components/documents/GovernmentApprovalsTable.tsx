import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, CheckCircle2, Clock, XCircle, FileCheck, FileText } from 'lucide-react';
import { NormalizedDocument } from '@/types/drive';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

type ApprovalStatus = 'Pending' | 'Submitted' | 'Approved' | 'Rejected';

const STATUS_CONFIG: Record<ApprovalStatus, { color: string; icon: React.ComponentType<any> }> = {
  Pending: { color: 'bg-warning/10 text-warning', icon: Clock },
  Submitted: { color: 'bg-primary/10 text-primary', icon: FileCheck },
  Approved: { color: 'bg-success/10 text-success', icon: CheckCircle2 },
  Rejected: { color: 'bg-destructive/10 text-destructive', icon: XCircle },
};

const ALL_STATUSES: ApprovalStatus[] = ['Pending', 'Submitted', 'Approved', 'Rejected'];

interface Props {
  documents: NormalizedDocument[];
  canEdit?: boolean;
}

export default function GovernmentApprovalsTable({ documents, canEdit = false }: Props) {
  const queryClient = useQueryClient();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusChange = async (id: string, status: ApprovalStatus) => {
    setUpdatingId(id);
    try {
      const { error } = await supabase.from('documents').update({ approval_status: status }).eq('id', id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success(`Status updated to ${status}`);
    } catch (err: any) {
      toast.error('Failed to update status: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border/40 shadow-sm overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Government Approvals</h3>
          <p className="text-xs text-muted-foreground mt-0.5">DM, DDA, DEWA, RTA, Civil Defense, NOCs & regulatory documents</p>
        </div>
        <span className="text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
          {documents.length} document{documents.length !== 1 ? 's' : ''}
        </span>
      </div>

      {documents.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center text-muted-foreground">
          <FileText className="w-10 h-10 mb-3 opacity-30" />
          <p className="text-sm">No government approval documents yet.</p>
          <p className="text-xs mt-1 opacity-70">Upload a document and select "Government Approvals" as the category.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 bg-muted/20">
                {['Document Name', 'Upload Date', 'Status', canEdit ? 'Change Status' : '', 'View'].filter(Boolean).map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {documents.map((doc, i) => {
                const status = (doc.approvalStatus as ApprovalStatus) || 'Submitted';
                const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['Submitted'];
                const Icon = cfg.icon;
                return (
                  <motion.tr
                    key={doc.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-border/20 last:border-0 hover:bg-muted/10 transition-colors"
                  >
                    <td className="px-5 py-4 font-medium text-foreground max-w-[240px] truncate" title={doc.name}>{doc.name}</td>
                    <td className="px-5 py-4 text-muted-foreground whitespace-nowrap text-xs">
                      {new Date(doc.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-semibold ${cfg.color}`}>
                        <Icon className="w-3 h-3" />
                        {status}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="px-5 py-4 whitespace-nowrap">
                        <select
                          value={status}
                          disabled={updatingId === doc.id || doc.source !== 'supabase'}
                          onChange={e => handleStatusChange(doc.id, e.target.value as ApprovalStatus)}
                          className="px-3 py-1.5 rounded-lg border border-border bg-background text-xs outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                        >
                          {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                    )}
                    <td className="px-5 py-4">
                      <button
                        onClick={() => window.open(doc.url, '_blank')}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
