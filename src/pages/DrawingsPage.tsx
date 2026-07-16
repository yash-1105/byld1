import { useState, useRef, useMemo, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, Folder, Loader2, Upload, History, Eye, GitCompareArrows,
  FileText, Image as ImageIcon, PencilRuler, Trash2, Download, MessageSquarePlus,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useActiveProject } from '@/contexts/ActiveProjectContext';
import { renderVersionToCanvas, drawingFileType, type DrawingFileType } from '@/lib/drawingRender';
import DrawingCommentLayer, { type DrawingComment } from '@/components/drawings/DrawingCommentLayer';

const DrawingCompareDialog = lazy(() => import('@/components/drawings/DrawingCompareDialog'));
const MoodBoardSection = lazy(() => import('@/components/moodboard/MoodBoardSection'));

export interface DrawingVersion {
  id: string;
  drawing_id: string;
  version_number: number;
  file_url: string;
  file_type: DrawingFileType;
  notes: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface DrawingRow {
  id: string;
  project_id: string;
  title: string;
  drawing_number: string | null;
  discipline: string;
  created_by: string | null;
  created_at: string;
}

const DISCIPLINES = ['Architectural', 'Structural', 'Interior', 'Electrical', 'Plumbing', 'HVAC', 'Landscape', 'Other'];

// ─── Thumbnail (module-level cache so re-renders don't re-rasterize) ─────────
const thumbCache = new Map<string, string>();

function DrawingThumb({ version, className = '' }: { version?: DrawingVersion; className?: string }) {
  const [src, setSrc] = useState<string | null>(version ? thumbCache.get(version.file_url) || null : null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!version) return;
    const cached = thumbCache.get(version.file_url);
    if (cached) { setSrc(cached); return; }
    let cancelled = false;
    setSrc(null); // drop the previous revision's thumb while the new one rasterizes
    renderVersionToCanvas(version.file_url, version.file_type, 480)
      .then(canvas => {
        const url = canvas.toDataURL('image/jpeg', 0.8);
        thumbCache.set(version.file_url, url);
        if (!cancelled) setSrc(url);
      })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [version?.file_url, version?.file_type]);

  if (!version || failed) {
    return (
      <div className={`flex items-center justify-center bg-muted/40 ${className}`}>
        <PencilRuler className="w-8 h-8 text-muted-foreground/30" />
      </div>
    );
  }
  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-muted/30 ${className}`}>
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/40" />
      </div>
    );
  }
  return <img src={src} alt="" className={`object-cover object-top bg-white ${className}`} />;
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function DrawingsPage() {
  const { user } = useAuth();
  const { projects, users } = useData();
  const { activeProjectId } = useActiveProject();
  const queryClient = useQueryClient();

  const [disciplineFilter, setDisciplineFilter] = useState('All');
  const [showUpload, setShowUpload] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const [placingComment, setPlacingComment] = useState(false);
  // Mood Board is architect-only: for everyone else this stays 'sheets' forever and
  // the Mood Board component tree is never mounted (RLS is the DB-level backstop).
  const [drawingsTab, setDrawingsTab] = useState<'sheets' | 'moodboard'>('sheets');
  const isArchitect = user?.role === 'architect';

  // Placement mode shouldn't survive switching to a different drawing
  useEffect(() => { setPlacingComment(false); }, [detailId]);

  // Upload form state (shared between "new drawing" and "new revision")
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadNumber, setUploadNumber] = useState('');
  const [uploadDiscipline, setUploadDiscipline] = useState('Architectural');
  const [uploadProject, setUploadProject] = useState('');
  const [uploadNotes, setUploadNotes] = useState('');
  const [revisionTarget, setRevisionTarget] = useState<DrawingRow | null>(null); // null → new drawing
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const canUpload = user?.role === 'architect' || user?.role === 'contractor';

  const { data: rawDrawings = [], isLoading: loadingDrawings } = useQuery({
    queryKey: ['drawings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('drawings').select('*').order('created_at', { ascending: false });
      if (error && (error as { code?: string }).code !== '42P01') throw error;
      return (data || []) as DrawingRow[];
    },
    enabled: !!user,
  });

  const { data: rawVersions = [], isLoading: loadingVersions } = useQuery({
    queryKey: ['drawing_versions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('drawing_versions').select('*').order('version_number', { ascending: false });
      if (error && (error as { code?: string }).code !== '42P01') throw error;
      return (data || []) as DrawingVersion[];
    },
    enabled: !!user,
  });

  const { data: rawComments = [] } = useQuery({
    queryKey: ['drawing_comments'],
    queryFn: async () => {
      const { data, error } = await supabase.from('drawing_comments').select('*');
      if (error && (error as { code?: string }).code !== '42P01') throw error;
      return (data || []) as DrawingComment[];
    },
    enabled: !!user,
  });

  const addCommentMutation = useMutation({
    mutationFn: async (payload: { drawing_version_id: string; x_pct: number; y_pct: number; comment_text: string }) => {
      const { error } = await supabase.from('drawing_comments').insert({ ...payload, created_by: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drawing_comments'] });
      setPlacingComment(false);
      toast.success('Comment pinned');
    },
    onError: (e: Error) => toast.error(`Failed to add comment: ${e.message}`),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('drawing_comments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drawing_comments'] });
      toast.success('Comment deleted');
    },
    onError: (e: Error) => toast.error(`Failed to delete comment: ${e.message}`),
  });

  const isLoading = loadingDrawings || loadingVersions;
  const accessibleIds = useMemo(() => new Set(projects.map(p => p.id)), [projects]);

  const versionsByDrawing = useMemo(() => {
    const map = new Map<string, DrawingVersion[]>();
    rawVersions.forEach(v => {
      const list = map.get(v.drawing_id) || [];
      list.push(v);
      map.set(v.drawing_id, list);
    });
    // rawVersions is already sorted desc, so list[0] is the current revision
    return map;
  }, [rawVersions]);

  const drawings = useMemo(() =>
    rawDrawings
      .filter(d => accessibleIds.has(d.project_id))
      .filter(d => activeProjectId === 'all' || d.project_id === activeProjectId)
      .filter(d => disciplineFilter === 'All' || d.discipline === disciplineFilter),
    [rawDrawings, accessibleIds, activeProjectId, disciplineFilter]
  );

  const disciplineCounts = useMemo(() => {
    const scoped = rawDrawings
      .filter(d => accessibleIds.has(d.project_id))
      .filter(d => activeProjectId === 'all' || d.project_id === activeProjectId);
    const counts: Record<string, number> = { All: scoped.length };
    scoped.forEach(d => { counts[d.discipline] = (counts[d.discipline] || 0) + 1; });
    return counts;
  }, [rawDrawings, accessibleIds, activeProjectId]);

  const detail = detailId ? rawDrawings.find(d => d.id === detailId) : null;
  const detailVersions = detail ? (versionsByDrawing.get(detail.id) || []) : [];
  // Pins are scoped to the specific current revision — never carried across revisions
  const currentVersionComments = detailVersions[0]
    ? rawComments.filter(c => c.drawing_version_id === detailVersions[0].id)
    : [];

  const resolveName = (id: string | null) => {
    const u = users.find(x => x.id === id);
    return u?.full_name || u?.email || 'Unknown';
  };
  const activeProject = activeProjectId !== 'all' ? projects.find(p => p.id === activeProjectId) : undefined;

  // ─── Upload flows ──────────────────────────────────────────────────────────
  const openNewDrawing = () => {
    setRevisionTarget(null);
    setUploadFile(null);
    setUploadTitle('');
    setUploadNumber('');
    setUploadNotes('');
    setUploadDiscipline('Architectural');
    setUploadProject(activeProjectId !== 'all' ? activeProjectId : (projects[0]?.id || ''));
    setShowUpload(true);
  };

  const openNewRevision = (drawing: DrawingRow) => {
    setRevisionTarget(drawing);
    setUploadFile(null);
    setUploadNotes('');
    setShowUpload(true);
  };

  const handleFilePicked = (file: File | null) => {
    if (!file) return;
    if (!drawingFileType(file)) {
      toast.error('Only PDF, PNG, JPEG, or WebP drawings are supported');
      return;
    }
    setUploadFile(file);
    if (!revisionTarget && !uploadTitle) {
      setUploadTitle(file.name.replace(/\.[^.]+$/, ''));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !user) return;
    const fileType = drawingFileType(uploadFile);
    if (!fileType) return;
    if (!revisionTarget && (!uploadTitle.trim() || !uploadProject)) {
      toast.error('Title and project are required');
      return;
    }

    setUploading(true);
    try {
      const projectId = revisionTarget ? revisionTarget.project_id : uploadProject;
      const ext = uploadFile.name.split('.').pop();
      const path = `drawings/${projectId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('chat-media').upload(path, uploadFile);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('chat-media').getPublicUrl(path);

      let drawingId = revisionTarget?.id;
      let versionNumber = 1;

      if (revisionTarget) {
        const existing = versionsByDrawing.get(revisionTarget.id) || [];
        versionNumber = (existing[0]?.version_number || 0) + 1;
      } else {
        const { data: drawing, error: drawingError } = await supabase.from('drawings').insert({
          project_id: projectId,
          title: uploadTitle.trim(),
          drawing_number: uploadNumber.trim() || null,
          discipline: uploadDiscipline,
          created_by: user.id,
        }).select().single();
        if (drawingError) throw drawingError;
        drawingId = drawing.id;
      }

      const { error: versionError } = await supabase.from('drawing_versions').insert({
        drawing_id: drawingId!,
        version_number: versionNumber,
        file_url: publicUrl,
        file_type: fileType,
        notes: uploadNotes.trim() || null,
        uploaded_by: user.id,
      });
      if (versionError) throw versionError;

      toast.success(revisionTarget
        ? `Revision ${versionNumber} uploaded — now the current version`
        : 'Drawing uploaded');
      queryClient.invalidateQueries({ queryKey: ['drawings'] });
      queryClient.invalidateQueries({ queryKey: ['drawing_versions'] });
      setShowUpload(false);
    } catch (err) {
      toast.error(`Upload failed: ${err instanceof Error ? err.message : 'unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (drawing: DrawingRow) => {
    if (!confirm(`Delete "${drawing.title}" and its full revision history?`)) return;
    const { error } = await supabase.from('drawings').delete().eq('id', drawing.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Drawing deleted');
      setDetailId(null);
      queryClient.invalidateQueries({ queryKey: ['drawings'] });
      queryClient.invalidateQueries({ queryKey: ['drawing_versions'] });
    }
  };

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
        <Folder className="w-12 h-12 mb-4 opacity-30" />
        <p>No projects found. Create a project first to manage drawings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Drawings</h1>
            <span className="text-[11px] px-2.5 py-1 rounded-full font-medium bg-muted text-muted-foreground">
              {activeProject ? activeProject.name : 'All projects'}
            </span>
          </div>
          <p className="text-muted-foreground text-sm mt-1">Plan uploads, automatic version history, and revision compare</p>
        </div>
        {canUpload && drawingsTab === 'sheets' && (
          <button
            onClick={openNewDrawing}
            className="gradient-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 flex items-center gap-2 shadow-lg shadow-primary/20 shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Upload Drawing
          </button>
        )}
      </div>

      {/* Sheets / Mood Board tabs — architects only; everyone else gets exactly the old page */}
      {isArchitect && (
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          {([['sheets', 'Sheets'], ['moodboard', 'Mood Board']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setDrawingsTab(key)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
                drawingsTab === key
                  ? 'gradient-primary text-primary-foreground shadow-md shadow-primary/15'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {isArchitect && drawingsTab === 'moodboard' ? (
        <Suspense fallback={<div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>}>
          <MoodBoardSection user={user} projects={projects} activeProjectId={activeProjectId} />
        </Suspense>
      ) : (
      <>
      {/* Discipline chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {['All', ...DISCIPLINES].map(d => {
          const count = disciplineCounts[d] || 0;
          if (d !== 'All' && count === 0) return null;
          return (
            <button
              key={d}
              onClick={() => setDisciplineFilter(d)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap shrink-0 transition-all ${
                disciplineFilter === d
                  ? 'bg-foreground text-background shadow-md'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {d}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${disciplineFilter === d ? 'bg-background/20' : 'bg-muted'}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : drawings.length === 0 ? (
        <div className="bg-card border border-border/40 rounded-2xl p-12 text-center text-muted-foreground">
          <PencilRuler className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium text-foreground">No drawings yet</p>
          <p className="text-xs mt-1">{canUpload ? 'Upload the first plan set for this project.' : 'Drawings uploaded by the project team will appear here.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {drawings.map((d, i) => {
            const versions = versionsByDrawing.get(d.id) || [];
            const current = versions[0];
            const project = projects.find(p => p.id === d.project_id);
            return (
              <motion.button
                key={d.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setDetailId(d.id)}
                className="soft-card overflow-hidden text-left group hover:shadow-md transition-shadow"
              >
                <div className="h-36 relative overflow-hidden border-b border-border/40">
                  <DrawingThumb version={current} className="w-full h-full" />
                  <span className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full font-bold bg-foreground/80 text-background backdrop-blur-sm">
                    Rev {current?.version_number ?? '—'}
                  </span>
                  {activeProjectId === 'all' && project && (
                    <span className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full font-medium bg-card/80 text-foreground backdrop-blur-sm border border-border/50">
                      {project.name}
                    </span>
                  )}
                </div>
                <div className="p-3.5">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground truncate">
                    {current?.file_type === 'pdf'
                      ? <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                      : <ImageIcon className="w-3.5 h-3.5 text-primary shrink-0" />}
                    <span className="truncate">{d.title}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
                    {d.drawing_number && <span className="font-mono">{d.drawing_number}</span>}
                    {d.drawing_number && <span>·</span>}
                    <span>{d.discipline}</span>
                    <span className="ml-auto flex items-center gap-1"><History className="w-3 h-3" /> {versions.length}</span>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Detail modal: preview + version history */}
      <AnimatePresence>
        {detail && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) setDetailId(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="bg-card rounded-3xl border shadow-2xl w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden"
            >
              <div className="border-b border-border/40 shrink-0">
                <div className="flex items-start justify-between gap-3 p-4 sm:p-5 pb-3">
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-bold text-foreground truncate">{detail.title}</h2>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                      {detail.drawing_number && <span className="font-mono">{detail.drawing_number}</span>}
                      {detail.drawing_number && <span>·</span>}
                      <span>{detail.discipline}</span>
                      <span>·</span>
                      <span>{projects.find(p => p.id === detail.project_id)?.name}</span>
                    </div>
                  </div>
                  <button onClick={() => setDetailId(null)} className="p-2 -m-1 rounded-xl hover:bg-muted text-muted-foreground shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2 px-4 sm:px-5 pb-4 sm:pb-5 overflow-x-auto scrollbar-none">
                  {detailVersions.length >= 2 && (
                    <button
                      onClick={() => setCompareOpen(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold gradient-primary text-primary-foreground shadow-md shadow-primary/20 hover:opacity-90 shrink-0 whitespace-nowrap"
                    >
                      <GitCompareArrows className="w-3.5 h-3.5" /> Compare Revisions
                    </button>
                  )}
                  {canUpload && (
                    <button
                      onClick={() => openNewRevision(detail)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-card border border-border text-foreground hover:bg-muted shrink-0 whitespace-nowrap"
                    >
                      <Upload className="w-3.5 h-3.5" /> New Revision
                    </button>
                  )}
                  {detailVersions[0] && (
                    <button
                      onClick={() => setPlacingComment(p => !p)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 whitespace-nowrap transition-colors ${
                        placingComment
                          ? 'bg-foreground text-background'
                          : 'bg-card border border-border text-foreground hover:bg-muted'
                      }`}
                      title={placingComment ? 'Click the drawing to place a pin — or click again to cancel' : 'Pin a comment to a spot on this revision'}
                    >
                      <MessageSquarePlus className="w-3.5 h-3.5" />
                      {placingComment ? 'Click drawing to pin…' : 'Comment'}
                      {!placingComment && currentVersionComments.length > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-bold">{currentVersionComments.length}</span>
                      )}
                    </button>
                  )}
                  {user?.id === detail.created_by && (
                    <button onClick={() => handleDelete(detail)} title="Delete" className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col md:flex-row min-h-0 flex-1 overflow-y-auto md:overflow-hidden">
                {/* Current revision preview — the relative inline-block wrapper hugs the
                    image's own rendered box, so pin percentages track the image exactly
                    (not the padded flex-centering container around it) */}
                <div className="md:flex-[3] bg-muted/20 flex items-start justify-center p-4 md:overflow-auto">
                  <div className="relative inline-block">
                    <DrawingThumb version={detailVersions[0]} className="max-w-full rounded-lg border border-border/50 shadow-sm" />
                    {detailVersions[0] && (
                      <DrawingCommentLayer
                        comments={currentVersionComments}
                        users={users}
                        currentUserId={user?.id}
                        canModerate={user?.role === 'architect'}
                        placing={placingComment}
                        submitting={addCommentMutation.isPending}
                        onAddComment={(x_pct, y_pct, text) =>
                          addCommentMutation.mutate({
                            drawing_version_id: detailVersions[0].id,
                            x_pct,
                            y_pct,
                            comment_text: text,
                          })
                        }
                        onDeleteComment={id => deleteCommentMutation.mutate(id)}
                      />
                    )}
                  </div>
                </div>

                {/* Version history — the audit trail */}
                <div className="md:flex-[2] border-t md:border-t-0 md:border-l border-border/40 p-4 md:overflow-y-auto">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" /> Version History
                  </h3>
                  <div className="space-y-2.5">
                    {detailVersions.map((v, idx) => (
                      <div key={v.id} className={`rounded-xl border p-3 ${idx === 0 ? 'border-primary/30 bg-primary/5' : 'border-border/50 bg-background/40'}`}>
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${idx === 0 ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            Rev {v.version_number}
                          </span>
                          {idx === 0 && <span className="text-[10px] font-semibold text-primary uppercase tracking-wide">Current</span>}
                          <div className="ml-auto flex items-center gap-1">
                            <button onClick={() => window.open(v.file_url, '_blank')} title="Open" className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <a href={v.file_url} download title="Download" className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-1.5">
                          {resolveName(v.uploaded_by)} · {new Date(v.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                        </div>
                        {v.notes && <div className="text-xs text-foreground mt-1.5 leading-relaxed">{v.notes}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compare dialog (lazy) */}
      {compareOpen && detail && (
        <Suspense fallback={null}>
          <DrawingCompareDialog
            open={compareOpen}
            onOpenChange={setCompareOpen}
            drawingTitle={detail.title}
            versions={detailVersions}
          />
        </Suspense>
      )}

      {/* Upload modal (new drawing OR new revision) */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget && !uploading) setShowUpload(false); }}
          >
            <motion.form
              onSubmit={handleUpload}
              initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="bg-card rounded-3xl border shadow-2xl w-full max-w-md p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    {revisionTarget ? 'Upload New Revision' : 'Upload Drawing'}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {revisionTarget
                      ? `${revisionTarget.title} — becomes Rev ${((versionsByDrawing.get(revisionTarget.id) || [])[0]?.version_number || 0) + 1}; earlier revisions stay in the history`
                      : 'PDF, PNG, JPEG, or WebP plan files'}
                  </p>
                </div>
                <button type="button" onClick={() => setShowUpload(false)} className="p-2 rounded-xl hover:bg-muted text-muted-foreground"><X className="w-4 h-4" /></button>
              </div>

              <input type="file" accept="application/pdf,image/png,image/jpeg,image/webp" ref={fileRef} className="hidden" onChange={e => handleFilePicked(e.target.files?.[0] || null)} />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all"
              >
                <Upload className="w-4 h-4" />
                {uploadFile ? uploadFile.name : 'Choose drawing file'}
              </button>

              {!revisionTarget && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Title *</label>
                      <input value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} placeholder="e.g. Ground Floor Plan" className="w-full px-4 py-2.5 rounded-xl border bg-background/50 text-sm outline-none focus:ring-2 focus:ring-primary/20" required />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Drawing No.</label>
                      <input value={uploadNumber} onChange={e => setUploadNumber(e.target.value)} placeholder="A-101" className="w-full px-4 py-2.5 rounded-xl border bg-background/50 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Discipline</label>
                      <select value={uploadDiscipline} onChange={e => setUploadDiscipline(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border bg-background/50 text-sm outline-none focus:ring-2 focus:ring-primary/20">
                        {DISCIPLINES.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                  {activeProjectId === 'all' && (
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Project</label>
                      <select value={uploadProject} onChange={e => setUploadProject(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border bg-background/50 text-sm outline-none focus:ring-2 focus:ring-primary/20">
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                  {revisionTarget ? 'Revision notes' : 'Notes'} (optional)
                </label>
                <textarea
                  value={uploadNotes}
                  onChange={e => setUploadNotes(e.target.value)}
                  placeholder={revisionTarget ? 'What changed in this revision?' : 'Anything the team should know'}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border bg-background/50 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={uploading || !uploadFile}
                className="w-full py-3 rounded-xl text-sm font-semibold gradient-primary text-primary-foreground shadow-md shadow-primary/20 hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : (revisionTarget ? 'Upload Revision' : 'Upload Drawing')}
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
      </>
      )}
    </div>
  );
}
