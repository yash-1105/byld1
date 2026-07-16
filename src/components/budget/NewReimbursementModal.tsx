import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Receipt, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Portal from '@/components/ui/portal';
import { Reimbursement, Project } from '@/data/mockData';
import { useData } from '@/contexts/DataContext';
import { supabase } from '@/integrations/supabase/client';

const EXPENSE_TYPES = [
  'DM Approval Fee',
  'DEWA Connection',
  'DDA Approval',
  'RTA Road Access',
  'Civil Defense NOC',
  'Soil Investigation',
  'Consultant Fee',
  'Utility Connection',
  'Permit Cost',
  'Other',
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Reimbursement, 'id' | 'submissionDate' | 'status'>) => void;
  projects: Project[];
  currentUser: { id: string; name?: string; full_name?: string };
}

export default function NewReimbursementModal({ isOpen, onClose, onSubmit, projects, currentUser }: Props) {
  const { users, projectMembers } = useData();
  const [projectId, setProjectId] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [expenseType, setExpenseType] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [dateIncurred, setDateIncurred] = useState('');
  const [paymentDueDate, setPaymentDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const receiptRef = useRef<HTMLInputElement>(null);

  const selectedProject = projects.find(p => p.id === projectId);

  // Clients on the selected project (project_members with role='client', or all clients if no members yet)
  const projectClients = useMemo(() => {
    if (!projectId) return [];
    const memberIds = new Set(
      projectMembers.filter((m: any) => m.project_id === projectId).map((m: any) => m.user_id)
    );
    const scoped = users.filter((u: any) => u.role === 'client' && (memberIds.size === 0 || memberIds.has(u.id)));
    return scoped;
  }, [projectId, users, projectMembers]);

  const selectedClient = users.find((u: any) => u.id === selectedClientId);

  const resetForm = () => {
    setProjectId('');
    setSelectedClientId('');
    setExpenseType('');
    setAmount('');
    setDescription('');
    setDateIncurred('');
    setPaymentDueDate('');
    setNotes('');
    setReceiptFile(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !selectedClientId || !expenseType || !amount || !dateIncurred || !paymentDueDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    let receiptUrl: string | undefined;
    if (receiptFile) {
      try {
        setIsUploading(true);
        const ext = receiptFile.name.split('.').pop();
        const path = `reimbursements/${projectId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('chat-media').upload(path, receiptFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('chat-media').getPublicUrl(path);
        receiptUrl = publicUrl;
      } catch (err: any) {
        setIsUploading(false);
        toast.error('Failed to upload receipt: ' + err.message);
        return;
      }
      setIsUploading(false);
    }

    const submitterName = currentUser.full_name || currentUser.name || 'Architect';
    onSubmit({
      projectId,
      projectName: selectedProject?.name || '',
      clientId: selectedClientId,
      clientName: (selectedClient as any)?.full_name || (selectedClient as any)?.email || '',
      submittedBy: currentUser.id,
      submittedByName: submitterName,
      expenseType,
      amount: parseFloat(amount),
      currency: 'USD',
      description,
      dateIncurred,
      paymentDueDate,
      notes,
      receiptUrl,
    });
    toast.success('Reimbursement created as draft');
    handleClose();
  };

  return (
    <Portal>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 8 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            onClick={e => e.stopPropagation()}
            className="bg-card rounded-3xl border shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-border/50 flex items-center justify-between sticky top-0 bg-card z-10 rounded-t-3xl">
              <div>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-primary" />
                  New Reimbursement
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">Submit an expense for client reimbursement</p>
              </div>
              <button onClick={handleClose} className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form id="reimb-form" onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                    Project <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={projectId}
                    onChange={e => { setProjectId(e.target.value); setSelectedClientId(''); }}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/50 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="" disabled>Select project</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                    Client <span className="text-destructive">*</span>
                  </label>
                  {!projectId ? (
                    <p className="text-xs text-muted-foreground px-4 py-3 rounded-xl border border-dashed border-border bg-muted/20">
                      Select a project first to see its clients
                    </p>
                  ) : projectClients.length === 0 ? (
                    <p className="text-xs text-muted-foreground px-4 py-3 rounded-xl border border-dashed border-border bg-muted/20">
                      No clients found on this project
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {projectClients.map((client: any) => {
                        const isSelected = selectedClientId === client.id;
                        const initials = (client.full_name || client.email || 'C').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                        return (
                          <button
                            key={client.id}
                            type="button"
                            onClick={() => setSelectedClientId(isSelected ? '' : client.id)}
                            className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border text-sm font-medium transition-all ${
                              isSelected
                                ? 'bg-primary/10 border-primary/40 text-primary shadow-sm shadow-primary/10'
                                : 'bg-background/50 border-border text-foreground hover:border-primary/30 hover:bg-primary/5'
                            }`}
                          >
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                              {initials}
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-medium leading-tight">{client.full_name || client.email}</p>
                              {client.full_name && client.email && (
                                <p className="text-[10px] text-muted-foreground leading-tight">{client.email}</p>
                              )}
                            </div>
                            {isSelected && (
                              <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center ml-1 shrink-0">
                                <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                    Expense Type <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={expenseType}
                    onChange={e => setExpenseType(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/50 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="" disabled>Select expense type</option>
                    {EXPENSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                    Amount <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/50 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Description</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Brief description of the expense..."
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/50 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                    Date Incurred <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="date"
                    value={dateIncurred}
                    onChange={e => setDateIncurred(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/50 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                    Payment Due Date <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="date"
                    value={paymentDueDate}
                    onChange={e => setPaymentDueDate(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/50 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Receipt</label>
                  <input type="file" ref={receiptRef} className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setReceiptFile(e.target.files?.[0] || null)} />
                  <button
                    type="button"
                    onClick={() => receiptRef.current?.click()}
                    className={`w-full px-4 py-2.5 rounded-xl border border-dashed text-sm transition-colors flex items-center gap-2 ${receiptFile ? 'border-primary/40 text-foreground bg-primary/5' : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/40 bg-background/50'}`}
                  >
                    <Upload className="w-4 h-4" />
                    {receiptFile ? receiptFile.name : 'Upload receipt (PDF, JPG, PNG)'}
                  </button>
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Notes <span className="text-muted-foreground/60">(optional)</span></label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Additional notes or context..."
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/50 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                </div>
              </div>
            </form>

            <div className="p-6 pt-0 flex justify-end gap-3">
              <button type="button" onClick={handleClose} disabled={isUploading} className="px-5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button
                type="submit"
                form="reimb-form"
                disabled={isUploading}
                className="gradient-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-60"
              >
                {isUploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : 'Save as Draft'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </Portal>
  );
}
