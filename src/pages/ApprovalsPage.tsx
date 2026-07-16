import { useState, useRef, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardCheck, Layers, DollarSign, FileText, AlertTriangle,
  ShoppingCart, Wrench, Plus, X, Clock, CheckCircle, XCircle, PauseCircle,
  ImagePlus, Loader2, Mic,
} from 'lucide-react';
import ApprovalCard from '@/components/projects/ApprovalCard';
import { useData } from '@/contexts/DataContext';
import { useActiveProject } from '@/contexts/ActiveProjectContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { USD_RATES } from '@/lib/preferences';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { isVoiceInputSupported } from '@/lib/voiceSupport';
import type { VoiceExtractedFields } from '@/components/approvals/VoiceApprovalDialog';

const VoiceApprovalDialog = lazy(() => import('@/components/approvals/VoiceApprovalDialog'));

const CATEGORIES = [
  { key: 'all',         label: 'All Requests', icon: ClipboardCheck },
  { key: 'design',      label: 'Design',        icon: Layers },
  { key: 'procurement', label: 'Procurement',   icon: ShoppingCart },
  { key: 'financial',   label: 'Financial',     icon: DollarSign },
  { key: 'contracts',   label: 'Contracts',     icon: FileText },
  { key: 'execution',   label: 'Execution',     icon: Wrench },
  { key: 'issues',      label: 'Issues',        icon: AlertTriangle },
];

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'on_hold';

const STATUS_FILTERS: { key: StatusFilter; label: string; icon: React.ElementType; color: string }[] = [
  { key: 'all',      label: 'All',      icon: ClipboardCheck, color: 'text-foreground' },
  { key: 'pending',  label: 'Pending',  icon: Clock,          color: 'text-warning' },
  { key: 'approved', label: 'Approved', icon: CheckCircle,    color: 'text-success' },
  { key: 'rejected', label: 'Rejected', icon: XCircle,        color: 'text-destructive' },
  { key: 'on_hold',  label: 'On Hold',  icon: PauseCircle,    color: 'text-muted-foreground' },
];

export default function ApprovalsPage() {
  const { approvals, addApproval, updateApproval, addBudgetItem, budgetItems, projects, users } = useData();
  const { user } = useAuth();
  const { preferences, formatCurrency } = usePreferences();
  const { activeProjectId } = useActiveProject();

  const [activeCategory, setActiveCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showNewForm, setShowNewForm] = useState(false);
  const [showVoiceDialog, setShowVoiceDialog] = useState(false);
  const [flaggedFields, setFlaggedFields] = useState<Set<string>>(new Set());
  const voiceSupported = isVoiceInputSupported();

  // New request form state
  const [newTitle, setNewTitle]       = useState('');
  const [newCategory, setNewCategory] = useState('Design');
  const [newProject, setNewProject]   = useState('');
  const [newDesc, setNewDesc]         = useState('');
  const [shareRoles, setShareRoles]   = useState<string[]>([]); // extra roles beyond architect+client
  const [costType, setCostType]       = useState<'none' | 'fixed' | 'variable'>('none');
  const [costInput, setCostInput]     = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [photoFiles, setPhotoFiles]   = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleShareRole = (role: string) =>
    setShareRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);

  // Who may decide a given approval:
  //  - never your own request
  //  - architect's request → only a client decides; client's request → only an architect
  //  - other requesters (contractor/consultant) → any architect or client decides
  const canDecideApproval = (requestedById: string): boolean => {
    if (!user) return false;
    if (requestedById === user.id) return false;
    const requesterRole = users.find(u => u.id === requestedById)?.role;
    if (requesterRole === 'architect') return user.role === 'client';
    if (requesterRole === 'client') return user.role === 'architect';
    return user.role === 'architect' || user.role === 'client';
  };

  // Resolve user display name
  const resolveUser = (userId: string) => {
    const u = users.find(u => u.id === userId);
    return u?.full_name || u?.name || 'Unknown';
  };

  // Resolve a user's role (architect / client / contractor / consultant)
  const resolveRole = (userId: string): string | undefined => {
    const u = users.find(u => u.id === userId);
    return u?.role || undefined;
  };

  // Filtered approvals
  const filtered = approvals
    .filter(a => activeCategory === 'all' || a.category.toLowerCase() === activeCategory)
    .filter(a => statusFilter === 'all' || a.status === statusFilter)
    .filter(a => activeProjectId === 'all' || a.projectId === activeProjectId);

  // Counts
  const counts = {
    pending:  approvals.filter(a => a.status === 'pending').length,
    approved: approvals.filter(a => a.status === 'approved').length,
    rejected: approvals.filter(a => a.status === 'rejected').length,
    on_hold:  approvals.filter(a => a.status === 'on_hold').length,
  };

  const categoryCounts = (key: string) =>
    key === 'all'
      ? approvals.filter(a => a.status === 'pending').length
      : approvals.filter(a => a.category.toLowerCase() === key && a.status === 'pending').length;

  // My decided actions
  const myDecisions = CATEGORIES.slice(1).map(c => ({
    ...c,
    count: approvals.filter(a =>
      a.category.toLowerCase() === c.key &&
      a.decidedBy === user?.id
    ).length,
  })).filter(c => c.count > 0);

  const handleAction = (id: string, action: 'approved' | 'rejected' | 'on_hold', reason?: string) => {
    updateApproval(id, {
      status: action,
      reason: reason || undefined,
      decidedBy: user?.id,
      decidedAt: new Date().toISOString(),
    });

    // On approval, push any attached cost into the project budget (idempotent via APR marker).
    if (action === 'approved') {
      const appr = approvals.find(a => a.id === id);
      if (appr && appr.costAmount && appr.projectId) {
        const alreadyLogged = budgetItems.some(b => b.description.startsWith(`APR:${id}`));
        if (!alreadyLogged) {
          const estTag = appr.costType === 'variable' ? ' [est]' : '';
          addBudgetItem({
            projectId: appr.projectId,
            category: appr.category || 'Approvals',
            description: `APR:${id}${estTag} · ${appr.title}`,
            amount: appr.costAmount, // stored in USD base
            type: 'expense',
            date: new Date().toISOString().split('T')[0],
            status: 'approved',
          });
          toast.success(
            appr.costType === 'variable'
              ? 'Approved — estimated cost added to Budget (editable when work is done)'
              : 'Approved — cost added to Budget'
          );
        }
      }
    }
  };

  const handleSubmitNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) { toast.error('Title is required'); return; }
    setSubmitting(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of photoFiles) {
        const ext = file.name.split('.').pop();
        const path = `approvals/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('chat-media').upload(path, file);
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('chat-media').getPublicUrl(path);
          uploadedUrls.push(publicUrl);
        }
      }
      // Convert entered cost (in the user's display currency) to the app's USD base.
      const rate = USD_RATES[preferences.currency] ?? 1;
      const costUSD = costType !== 'none' && costInput
        ? parseFloat(costInput) / rate
        : undefined;

      addApproval({
        title: newTitle.trim(),
        category: newCategory,
        status: 'pending',
        description: newDesc.trim(),
        images: uploadedUrls.length > 0 ? uploadedUrls : undefined,
        projectId: newProject || '',
        requestedBy: user?.id || '',
        visibleRoles: shareRoles, // architect + client added automatically in DataContext
        costType: costType === 'none' ? undefined : costType,
        costAmount: costUSD,
        costCurrency: costType !== 'none' ? preferences.currency : undefined,
      });
      toast.success('Approval request submitted');
      setNewTitle(''); setNewCategory('Design'); setNewProject(''); setNewDesc(''); setPhotoFiles([]); setShareRoles([]);
      setCostType('none'); setCostInput(''); setFlaggedFields(new Set());
      setShowNewForm(false);
    } catch {
      toast.error('Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVoiceExtracted = (fields: VoiceExtractedFields) => {
    if (fields.title) setNewTitle(fields.title);
    if (fields.category) setNewCategory(fields.category);
    if (fields.projectId) setNewProject(fields.projectId);
    setNewDesc(fields.description);
    if (fields.shareRoles.length > 0) setShareRoles(fields.shareRoles);
    if (fields.costType && fields.costType !== 'none') {
      setCostType(fields.costType);
      if (fields.costAmount !== null) setCostInput(String(fields.costAmount));
    }
    setFlaggedFields(new Set(fields.flaggedFields));
    setShowNewForm(true);
  };

  const clearFlag = (field: string) =>
    setFlaggedFields(prev => {
      if (!prev.has(field)) return prev;
      const next = new Set(prev);
      next.delete(field);
      return next;
    });

  const flaggedClass = (field: string) =>
    flaggedFields.has(field) ? 'border-l-4 border-l-warning' : '';

  return (
    <div className="flex gap-6 min-h-[calc(100vh-120px)]">
      {/* Sidebar */}
      <div className="w-56 flex-shrink-0 hidden lg:block">
        <div className="soft-card p-4 space-y-1 sticky top-6">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1">Categories</h3>
          {CATEGORIES.map(cat => {
            const pending = categoryCounts(cat.key);
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeCategory === cat.key
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                }`}
              >
                <cat.icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{cat.label}</span>
                {pending > 0 && (
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-warning/15 text-warning font-semibold shrink-0">
                    {pending}
                  </span>
                )}
              </button>
            );
          })}

          {/* My Decisions */}
          {myDecisions.length > 0 && (
            <div className="pt-4 mt-4 border-t border-border/60">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">My Decisions</h3>
              {myDecisions.map(a => (
                <div key={a.key} className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground">
                  <a.icon className="w-4 h-4" />
                  <span className="truncate">{a.label}</span>
                  <span className="ml-auto text-[10px] font-semibold">{a.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 space-y-5 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Approval Center</h1>
              <span className="text-[11px] px-2.5 py-1 rounded-full font-medium bg-muted text-muted-foreground">
                {activeProjectId === 'all' ? 'All projects' : projects.find(p => p.id === activeProjectId)?.name}
              </span>
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              {counts.pending > 0
                ? <><span className="font-semibold text-warning">{counts.pending} pending</span> approval{counts.pending !== 1 ? 's' : ''} need attention</>
                : 'All caught up — no pending approvals'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {voiceSupported && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowVoiceDialog(true)}
                title="Speak to create"
                className="flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm font-semibold hover:bg-muted transition-colors"
              >
                <Mic className="w-4 h-4" /> <span className="hidden sm:inline">Speak to create</span>
              </motion.button>
            )}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => { setNewProject(activeProjectId !== 'all' ? activeProjectId : ''); setFlaggedFields(new Set()); setShowNewForm(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold shadow-md shadow-primary/20 hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" /> New Request
            </motion.button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {[
            { label: 'Pending',  count: counts.pending,  color: 'text-warning',         bg: 'bg-warning/8',         icon: Clock },
            { label: 'Approved', count: counts.approved, color: 'text-success',         bg: 'bg-success/8',         icon: CheckCircle },
            { label: 'Rejected', count: counts.rejected, color: 'text-destructive',     bg: 'bg-destructive/8',     icon: XCircle },
            { label: 'On Hold',  count: counts.on_hold,  color: 'text-muted-foreground', bg: 'bg-muted/60',         icon: PauseCircle },
          ].map(s => (
            <button
              key={s.label}
              onClick={() => setStatusFilter(statusFilter === s.label.toLowerCase().replace(' ', '_') as StatusFilter ? 'all' : s.label.toLowerCase().replace(' ', '_') as StatusFilter)}
              className={`soft-card p-2 sm:p-4 flex flex-col sm:flex-row items-center gap-1 sm:gap-3 hover:ring-2 hover:ring-primary/20 transition-all text-center sm:text-left ${s.bg}`}
            >
              <s.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${s.color} shrink-0`} />
              <div>
                <div className={`text-base sm:text-xl font-bold leading-tight ${s.color}`}>{s.count}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">{s.label}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Mobile filters — the category sidebar is hidden below lg */}
        <div className="grid grid-cols-1 gap-2 lg:hidden">
          <select
            value={activeCategory}
            onChange={e => setActiveCategory(e.target.value)}
            className="w-full bg-card border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            aria-label="Filter by category"
          >
            {CATEGORIES.map(cat => {
              const pending = categoryCounts(cat.key);
              return (
                <option key={cat.key} value={cat.key}>
                  {cat.label}{pending > 0 ? ` (${pending})` : ''}
                </option>
              );
            })}
          </select>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap shrink-0 transition-all duration-200 ${
                statusFilter === f.key
                  ? 'gradient-primary text-primary-foreground shadow-md shadow-primary/15'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:shadow-sm'
              }`}
            >
              <f.icon className="w-3.5 h-3.5" />
              {f.label}
              {f.key !== 'all' && counts[f.key as keyof typeof counts] > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${statusFilter === f.key ? 'bg-white/20 text-white' : f.color + ' bg-current/10'}`}>
                  {counts[f.key as keyof typeof counts]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Cards Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
            {filtered.map((item, i) => {
              const project = projects.find(p => p.id === item.projectId);
              const decidedByName = item.decidedBy ? resolveUser(item.decidedBy) : undefined;
              return (
                <ApprovalCard
                  key={item.id}
                  item={{
                    id: item.id,
                    title: item.title,
                    category: item.category,
                    status: item.status,
                    requestedBy: resolveUser(item.requestedBy),
                    requestedByRole: resolveRole(item.requestedBy),
                    date: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—',
                    description: item.description,
                    images: item.images,
                    reason: item.reason,
                    decidedBy: decidedByName,
                    decidedByRole: item.decidedBy ? resolveRole(item.decidedBy) : undefined,
                    projectName: project?.name,
                    cost: item.costAmount !== undefined ? formatCurrency(item.costAmount) : undefined,
                    costType: item.costType,
                  }}
                  index={i}
                  onAction={handleAction}
                  canDecide={canDecideApproval(item.requestedBy)}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 soft-card">
            <ClipboardCheck className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm font-medium text-foreground">No approvals found</p>
            <p className="text-xs text-muted-foreground mt-1">
              {approvals.length === 0 ? 'Submit a new request to get started' : 'Try adjusting your filters'}
            </p>
          </div>
        )}
      </div>

      {/* Speak to create */}
      {showVoiceDialog && (
        <Suspense fallback={null}>
          <VoiceApprovalDialog
            open={showVoiceDialog}
            onOpenChange={setShowVoiceDialog}
            projects={projects}
            defaultProjectId={activeProjectId !== 'all' ? activeProjectId : ''}
            onExtracted={handleVoiceExtracted}
          />
        </Suspense>
      )}

      {/* New Request Modal */}
      <AnimatePresence>
        {showNewForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) setShowNewForm(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', stiffness: 280, damping: 26 }}
              className="bg-card rounded-3xl border shadow-2xl w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold text-foreground">New Approval Request</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Submit for review by the project team</p>
                </div>
                <button onClick={() => setShowNewForm(false)} className="p-2 rounded-xl hover:bg-muted transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <form onSubmit={handleSubmitNew} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Title *</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={e => { setNewTitle(e.target.value); clearFlag('title'); }}
                    placeholder="e.g. Italian Marble Selection"
                    className={`w-full px-4 py-2.5 rounded-xl border bg-background/50 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all ${flaggedClass('title')}`}
                    required
                  />
                  {flaggedFields.has('title') && (
                    <p className="text-[11px] text-warning mt-1">Confirm this — voice input couldn't catch a title</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Category</label>
                    <select
                      value={newCategory}
                      onChange={e => { setNewCategory(e.target.value); clearFlag('category'); }}
                      className={`w-full px-3 py-2.5 rounded-xl border bg-background/50 text-sm outline-none focus:ring-2 focus:ring-primary/20 ${flaggedClass('category')}`}
                    >
                      {CATEGORIES.slice(1).map(c => (
                        <option key={c.key} value={c.label}>{c.label}</option>
                      ))}
                    </select>
                    {flaggedFields.has('category') && (
                      <p className="text-[11px] text-warning mt-1">Confirm this</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Project</label>
                    <select
                      value={newProject}
                      onChange={e => { setNewProject(e.target.value); clearFlag('project'); }}
                      className={`w-full px-3 py-2.5 rounded-xl border bg-background/50 text-sm outline-none focus:ring-2 focus:ring-primary/20 ${flaggedClass('project')}`}
                    >
                      <option value="">No project</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    {flaggedFields.has('project') && (
                      <p className="text-[11px] text-warning mt-1">Confirm this</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Description</label>
                  <textarea
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    placeholder="Provide context, specifications, or reasoning for this request..."
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border bg-background/50 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all"
                  />
                </div>

                {/* Cost */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Cost</label>
                    <select
                      value={costType}
                      onChange={e => { setCostType(e.target.value as 'none' | 'fixed' | 'variable'); clearFlag('cost'); }}
                      className={`w-full px-3 py-2.5 rounded-xl border bg-background/50 text-sm outline-none focus:ring-2 focus:ring-primary/20 ${flaggedClass('cost')}`}
                    >
                      <option value="none">No cost</option>
                      <option value="fixed">Fixed cost</option>
                      <option value="variable">Variable cost (estimate)</option>
                    </select>
                    {flaggedFields.has('cost') && (
                      <p className="text-[11px] text-warning mt-1">Confirm this</p>
                    )}
                  </div>
                  {costType !== 'none' && (
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                        {costType === 'variable' ? `Approx. Amount (${preferences.currency})` : `Amount (${preferences.currency})`}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={costInput}
                        onChange={e => { setCostInput(e.target.value); clearFlag('cost'); }}
                        placeholder="0.00"
                        className={`w-full px-4 py-2.5 rounded-xl border bg-background/50 text-sm outline-none focus:ring-2 focus:ring-primary/20 ${flaggedClass('cost')}`}
                      />
                    </div>
                  )}
                </div>
                {costType === 'variable' && (
                  <p className="text-[11px] text-muted-foreground -mt-2">
                    This is an estimate. Once approved it's added to the Budget, where the assignee can set the final cost after the work is done.
                  </p>
                )}

                {/* Share with additional roles */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Share with</label>
                  <p className="text-[11px] text-muted-foreground mb-2">Architects & clients always see this. Optionally share it with:</p>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { role: 'contractor', label: 'Contractor' },
                      { role: 'consultant', label: 'Consultant' },
                    ].map(({ role, label }) => {
                      const active = shareRoles.includes(role);
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => toggleShareRole(role)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${
                            active
                              ? 'bg-primary/10 border-primary/30 text-primary'
                              : 'bg-background border-border text-muted-foreground hover:border-foreground/30'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Photo upload */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Photos (optional)</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={e => setPhotoFiles(Array.from(e.target.files || []))}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all"
                  >
                    <ImagePlus className="w-4 h-4" />
                    {photoFiles.length > 0 ? `${photoFiles.length} photo${photoFiles.length > 1 ? 's' : ''} selected` : 'Add photos'}
                  </button>
                  {photoFiles.length > 0 && (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {photoFiles.map((f, i) => (
                        <div key={i} className="relative group">
                          <img
                            src={URL.createObjectURL(f)}
                            alt={f.name}
                            className="w-16 h-16 rounded-lg object-cover border border-border"
                          />
                          <button
                            type="button"
                            onClick={() => setPhotoFiles(files => files.filter((_, idx) => idx !== i))}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowNewForm(false)}
                    className="flex-1 py-3 rounded-xl text-sm text-muted-foreground bg-muted/50 hover:bg-muted transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    disabled={submitting}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold gradient-primary text-primary-foreground shadow-md shadow-primary/20 hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : 'Submit Request'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
