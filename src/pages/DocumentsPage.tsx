import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Folder, Upload, Search, Tag, Eye, Download, X, Grid, List, Building2, Users, Trash2, HardDrive, Loader2, Lock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useActiveProject } from '@/contexts/ActiveProjectContext';
import { NormalizedDocument } from '@/types/drive';
import DriveExplorerModal from '@/components/drive/DriveExplorerModal';
import GovernmentApprovalsTable from '@/components/documents/GovernmentApprovalsTable';

const folders = ['All Files', 'Contracts', 'Drawings', 'Reports', 'Permits', 'Government Approvals', 'Invoices'];

// `visible_to` now holds tagged user IDs (private) or is null/empty (public).
// Older documents stored role names here — treat those as public for back-compat.
const KNOWN_ROLES = ['client', 'contractor', 'consultant', 'architect'];
const isRoleBasedVis = (vis?: string[] | null) => !!vis && vis.length > 0 && vis.some(v => KNOWN_ROLES.includes(v));
const isPrivateVis = (vis?: string[] | null) => !!vis && vis.length > 0 && !isRoleBasedVis(vis);

/** Chip showing whether a document is public or privately tagged to specific members. */
function VisibilityBadge({ vis, users, className = '' }: { vis?: string[] | null; users: any[]; className?: string }) {
  if (!isPrivateVis(vis)) {
    return (
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground ${className}`}>
        <Users className="w-3 h-3" /> Everyone
      </span>
    );
  }
  const names = vis!.map(id => { const u = users.find(x => x.id === id); return u?.full_name || u?.email; }).filter(Boolean) as string[];
  const label = names.length ? names.join(', ') : `${vis!.length} member${vis!.length > 1 ? 's' : ''}`;
  return (
    <span title={`Private · visible to: ${label}`} className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-warning/10 text-warning ${className}`}>
      <Lock className="w-3 h-3" /> Private · {names.length || vis!.length}
    </span>
  );
}

export default function DocumentsPage() {
  const { user } = useAuth();
  const { projects, users, projectMembers } = useData();
  const { activeProjectId } = useActiveProject();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFolder, setSelectedFolder] = useState('All Files');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [dragOver, setDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProject, setUploadProject] = useState<string>('');
  const [uploadCategory, setUploadCategory] = useState<string>('Reports');
  const [uploadApprovalStatus, setUploadApprovalStatus] = useState<string>('Submitted');
  const [uploadVisMode, setUploadVisMode] = useState<'public' | 'private'>('public');
  const [taggedUserIds, setTaggedUserIds] = useState<string[]>([]);

  // Project members that can be tagged (members of the chosen project, minus you;
  // falls back to all users if the project has no explicit members yet).
  const memberOptions = useMemo(() => {
    const ids = new Set(projectMembers.filter((m: any) => m.project_id === uploadProject).map((m: any) => m.user_id));
    const scoped = users.filter((u: any) => ids.has(u.id));
    return (scoped.length > 0 ? scoped : users).filter((u: any) => u.id !== user?.id);
  }, [users, projectMembers, uploadProject, user?.id]);

  // Drive Explorer Modal
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [driveProject, setDriveProject] = useState<string>('');

  // Fetch Supabase documents
  const { data: supabaseDocs = [], isLoading: isLoadingSupa } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const { data, error } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch Drive documents
  const { data: driveDocs = [], isLoading: isLoadingDrive } = useQuery({
    queryKey: ['drive_files'],
    queryFn: async () => {
      const { data, error } = await supabase.from('drive_files').select('*').order('created_at', { ascending: false });
      if (error && error.code !== '42P01') throw error; // Ignore table not found if migrations pending
      return data || [];
    },
    enabled: !!user,
  });

  const isLoading = isLoadingSupa || isLoadingDrive;

  // Filter and Normalize
  const normalizedDocs: NormalizedDocument[] = [
    ...supabaseDocs.filter(d => {
      if (d.uploaded_by === user?.id) return true;          // your own upload
      if (isPrivateVis(d.visible_to)) return d.visible_to!.includes(user?.id ?? ''); // private → tagged only
      return true;                                          // public (or legacy role-based)
    }).map(d => ({
      id: d.id,
      name: d.name,
      source: 'supabase' as const,
      url: d.file_url,
      created_at: d.created_at,
      uploaded_by: d.uploaded_by,
      category: d.category,
      visibleTo: d.visible_to,
      approvalStatus: (d as any).approval_status || undefined,
      projectId: d.project_id || undefined,
    })),
    ...driveDocs.filter(d => {
      if (d.user_id === user?.id) return true;
      const visible_to = d.metadata_json?.visible_to as string[] | undefined;
      if (isPrivateVis(visible_to)) return visible_to!.includes(user?.id ?? '');
      return true;
    }).map(d => ({
      id: d.id,
      name: d.name,
      source: 'google_drive' as const,
      url: d.drive_link,
      created_at: d.created_at,
      uploaded_by: d.user_id,
      category: d.metadata_json?.category || 'Drive Import',
      visibleTo: d.metadata_json?.visible_to,
      projectId: d.project_id || undefined,
    }))
  ];

  const projectScopedDocs = normalizedDocs.filter(d => activeProjectId === 'all' || d.projectId === activeProjectId);

  const filtered = projectScopedDocs.filter(d => {
    const matchFolder = selectedFolder === 'All Files' || (d as any).category === selectedFolder;
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase());
    return matchFolder && matchSearch;
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setIsUploadModalOpen(true);
      if (projects.length > 0) {
        setUploadProject(prev => prev || (activeProjectId !== 'all' ? activeProjectId : projects[0].id));
      }
      setUploadCategory(selectedFolder === 'All Files' ? 'Reports' : selectedFolder);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
      setIsUploadModalOpen(true);
      if (projects.length > 0) {
        setUploadProject(prev => prev || (activeProjectId !== 'all' ? activeProjectId : projects[0].id));
      }
      setUploadCategory(selectedFolder === 'All Files' ? 'Reports' : selectedFolder);
    }
  };

  const confirmUpload = async () => {
    if (!user) {
      toast.error('You must be logged in to upload files');
      return;
    }
    if (!selectedFile) return;
    if (uploadVisMode === 'private' && taggedUserIds.length === 0) {
      toast.error('Select at least one member, or set the document to Everyone.');
      return;
    }

    setIsUploading(true);
    toast.info('Uploading file...');
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('project-documents')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('project-documents')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase.from('documents').insert({
        name: selectedFile.name,
        file_url: publicUrl,
        category: uploadCategory,
        uploaded_by: user.id,
        project_id: uploadProject || null,
        visible_to: uploadVisMode === 'private' ? taggedUserIds : null,
        ...(uploadCategory === 'Government Approvals' ? { approval_status: uploadApprovalStatus } : {}),
      });

      if (dbError) throw dbError;

      toast.success('Document uploaded successfully');
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setIsUploadModalOpen(false);
      setSelectedFile(null);
      setUploadVisMode('public');
      setTaggedUserIds([]);
      setUploadApprovalStatus('Submitted');
    } catch (error: any) {
      console.error(error);
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleMember = (id: string) => {
    setTaggedUserIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const deleteDocument = async (id: string, url: string, source: 'supabase' | 'google_drive') => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      if (source === 'supabase') {
        const filePath = url.split('project-documents/')[1];
        if (filePath) {
          await supabase.storage.from('project-documents').remove([filePath]);
        }
        const { error } = await supabase.from('documents').delete().eq('id', id);
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ['documents'] });
      } else {
        const { error } = await supabase.from('drive_files').delete().eq('id', id);
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ['drive_files'] });
      }
      toast.success('Document deleted successfully');
    } catch (error: any) {
      console.error(error);
      toast.error(`Delete failed: ${error.message}`);
    }
  };

  const openDriveModal = () => {
    if (projects.length === 0) {
      toast.error('You need to create a project first to link a Drive folder.');
      return;
    }
    setDriveProject(activeProjectId !== 'all' ? activeProjectId : projects[0].id);
    setIsDriveModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-foreground">Documents</h1>
            <span className="text-[11px] px-2.5 py-1 rounded-full font-medium bg-muted text-muted-foreground">
              {activeProjectId === 'all' ? 'All projects' : projects.find(p => p.id === activeProjectId)?.name}
            </span>
          </div>
          <p className="text-muted-foreground text-sm mt-1">{projectScopedDocs.length} files across sources</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-muted rounded-lg p-0.5">
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-card shadow-sm' : ''}`}><List className="w-4 h-4 text-muted-foreground" /></button>
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-card shadow-sm' : ''}`}><Grid className="w-4 h-4 text-muted-foreground" /></button>
          </div>
          
          <button 
            onClick={openDriveModal}
            className="flex items-center gap-2 text-sm font-medium px-4 py-2 border border-border rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" alt="Google Drive" className="w-4 h-4" />
            <span className="hidden sm:inline">Google Drive Import</span>
            <span className="sm:hidden">Drive</span>
          </button>

          <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
          <button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={isUploading}
            className="gradient-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 flex items-center gap-2 disabled:opacity-50"
          >
            <Upload className="w-4 h-4" /> Upload
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Categories: horizontal chips on mobile, sidebar on md+ */}
        <div className="flex md:flex-col md:w-48 flex-shrink-0 gap-1.5 md:gap-0 md:space-y-1 overflow-x-auto scrollbar-none pb-1 md:pb-0">
          {folders.map(f => {
            const count = f === 'All Files' ? projectScopedDocs.length : projectScopedDocs.filter(d => (d as any).category === f).length;
            const active = selectedFolder === f;
            return (
              <button
                key={f}
                onClick={() => setSelectedFolder(f)}
                className={`flex items-center gap-2 text-sm transition-colors whitespace-nowrap shrink-0 md:w-full md:text-left px-3 py-1.5 md:py-2 rounded-full md:rounded-lg border md:border-transparent ${
                  active
                    ? 'bg-primary/10 text-primary font-medium border-primary/20'
                    : 'text-muted-foreground bg-card md:bg-transparent border-border hover:bg-muted'
                }`}
              >
                <Folder className="w-4 h-4 hidden md:block" /> {f}
                <span className={`text-xs md:ml-auto ${active ? 'text-primary/70' : 'text-muted-foreground'}`}>{count}</span>
              </button>
            );
          })}
        </div>

        <div className="flex-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-primary/20" />
          </div>

          {selectedFolder === 'Government Approvals' ? (
            <GovernmentApprovalsTable
              documents={projectScopedDocs.filter(d => (d as any).category === 'Government Approvals')}
              canEdit={user?.role === 'architect'}
            />
          ) : (
            <>
              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-3 sm:p-8 text-center text-sm transition-colors cursor-pointer ${dragOver ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}
              >
                <div className="flex sm:block items-center justify-center gap-2">
                  <Upload className="w-4 h-4 sm:w-6 sm:h-6 sm:mx-auto sm:mb-2 opacity-50" />
                  <div className="font-medium sm:mb-1">
                    <span className="sm:hidden">Tap to upload a file</span>
                    <span className="hidden sm:inline">Drop files here or click to browse</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground hidden sm:block">Support for PDF, DOCX, JPG, PNG</div>
              </div>

              {isLoading ? (
                <div className="py-12 flex justify-center">
                  <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
              ) : viewMode === 'list' ? (
                <div className="space-y-2">
                  {filtered.map((d, i) => (
                    <motion.div key={d.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="glass-card-hover p-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        {d.source === 'google_drive' ? (
                           <HardDrive className="w-5 h-5 text-[#4285F4]" />
                        ) : (
                           <FileText className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{d.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                          {d.source === 'google_drive' ? (
                            <span className="bg-[#4285F4]/10 text-[#4285F4] px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider">Drive</span>
                          ) : (
                            <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider">Storage</span>
                          )}
                          <span>·</span>
                          <span>{new Date(d.created_at).toLocaleDateString()}</span>
                          {(user?.role === 'architect' || user?.id === d.uploaded_by) && (
                            <><span>·</span><VisibilityBadge vis={d.visibleTo} users={users} /></>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {(user?.role === 'architect' || user?.id === d.uploaded_by) && (
                          <button onClick={() => deleteDocument(d.id, d.url, d.source)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
                        )}
                        <button onClick={() => window.open(d.url, '_blank')} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Eye className="w-4 h-4" /></button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {filtered.map((d, i) => (
                    <motion.div key={d.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }} className="glass-card-hover p-4 text-center group relative">
                      {d.source === 'google_drive' ? (
                        <div className="absolute top-2 left-2 bg-[#4285F4]/10 text-[#4285F4] px-1.5 py-0.5 rounded text-[10px] font-bold uppercase">Drive</div>
                      ) : (
                        <div className="absolute top-2 left-2 bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px] font-bold uppercase">Storage</div>
                      )}

                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 mt-4">
                        {d.source === 'google_drive' ? (
                           <HardDrive className="w-6 h-6 text-[#4285F4]" />
                        ) : (
                           <FileText className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      <div className="text-sm font-medium text-foreground truncate" title={d.name}>{d.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">{new Date(d.created_at).toLocaleDateString()}</div>
                      {(user?.role === 'architect' || user?.id === d.uploaded_by) && (
                        <div className="mt-1.5 flex justify-center"><VisibilityBadge vis={d.visibleTo} users={users} /></div>
                      )}
                      <div className="mt-3 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {(user?.role === 'architect' || user?.id === d.uploaded_by) && (
                          <button onClick={() => deleteDocument(d.id, d.url, d.source)} className="p-1.5 rounded-md bg-muted text-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        )}
                        <button onClick={() => window.open(d.url, '_blank')} className="p-1.5 rounded-md bg-muted text-foreground hover:bg-primary/10 hover:text-primary transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {!isLoading && filtered.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No documents found</p>
                  <button onClick={() => fileInputRef.current?.click()} className="text-sm text-primary hover:underline mt-2">Upload a document</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="w-full max-w-md bg-card border shadow-2xl rounded-2xl overflow-hidden">
              <div className="p-4 flex items-center justify-between border-b border-border/60">
                <h2 className="text-lg font-semibold text-foreground">Upload Document</h2>
                <button onClick={() => setIsUploadModalOpen(false)} className="p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/60"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-5 space-y-5">
                <div className="bg-primary/5 p-3 rounded-xl flex items-center gap-3 border border-primary/10">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><FileText className="w-5 h-5 text-primary" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{selectedFile?.name}</div>
                    <div className="text-xs text-muted-foreground">{(selectedFile?.size || 0) / 1000} KB</div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 flex items-center gap-2"><Building2 className="w-4 h-4 text-muted-foreground" /> Project</label>
                  <select value={uploadProject} onChange={e => setUploadProject(e.target.value)} className="w-full bg-background border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="" disabled>Select a project</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 flex items-center gap-2"><Folder className="w-4 h-4 text-muted-foreground" /> Category</label>
                  <select value={uploadCategory} onChange={e => setUploadCategory(e.target.value)} className="w-full bg-background border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20">
                    {folders.filter(f => f !== 'All Files').map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>

                {uploadCategory === 'Government Approvals' && (
                  <div>
                    <label className="text-sm font-medium mb-1.5 flex items-center gap-2"><Tag className="w-4 h-4 text-muted-foreground" /> Approval Status</label>
                    <select value={uploadApprovalStatus} onChange={e => setUploadApprovalStatus(e.target.value)} className="w-full bg-background border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20">
                      <option value="Pending">Pending</option>
                      <option value="Submitted">Submitted</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium mb-1.5 flex items-center gap-2"><Users className="w-4 h-4 text-muted-foreground" /> Who can view this document?</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setUploadVisMode('public'); setTaggedUserIds([]); }} className={`px-4 py-2 rounded-xl text-xs font-medium transition-all border ${uploadVisMode === 'public' ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-background border-border text-muted-foreground hover:border-foreground/30'}`}>
                      Public (Everyone)
                    </button>
                    <button type="button" onClick={() => setUploadVisMode('private')} className={`px-4 py-2 rounded-xl text-xs font-medium transition-all border ${uploadVisMode === 'private' ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-background border-border text-muted-foreground hover:border-foreground/30'}`}>
                      Private (Tagged Members)
                    </button>
                  </div>

                  {uploadVisMode === 'private' && (
                    <div className="flex flex-col gap-2 p-4 mt-2 rounded-xl bg-muted/30 border border-border/50">
                      <label className="text-xs font-medium text-muted-foreground">Select members who can see this document</label>
                      {memberOptions.length === 0 ? (
                        <p className="text-[11px] text-muted-foreground">No other members on this project yet.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {memberOptions.map((u: any) => {
                            const isTagged = taggedUserIds.includes(u.id);
                            return (
                              <button key={u.id} type="button" onClick={() => toggleMember(u.id)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${isTagged ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-background border-border text-muted-foreground hover:border-foreground/30'}`}>
                                {u.full_name || u.email || 'Team Member'}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {taggedUserIds.length > 0 ? (
                        <p className="text-[10px] text-primary flex items-center gap-1 mt-1"><Lock className="w-3 h-3" /> Only you and the tagged members will see this document.</p>
                      ) : (
                        <p className="text-[10px] text-destructive flex items-center gap-1 mt-1"><AlertTriangle className="w-3 h-3" /> Please select at least one member.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 border-t border-border/60 bg-muted/30 flex justify-end gap-2">
                <button onClick={() => setIsUploadModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted">Cancel</button>
                <button onClick={confirmUpload} disabled={isUploading || !uploadProject} className="gradient-primary text-primary-foreground px-6 py-2 rounded-xl text-sm font-medium hover:opacity-90 flex items-center gap-2 disabled:opacity-50">
                  {isUploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : <><Upload className="w-4 h-4" /> Upload Document</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Project Selection for Drive Modal Wrapper */}
      <AnimatePresence>
        {isDriveModalOpen && !driveProject ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <div className="bg-card p-6 rounded-2xl border shadow-2xl max-w-sm w-full">
               <h3 className="text-lg font-bold mb-4">Select Project to Link</h3>
               <select value={driveProject} onChange={e => setDriveProject(e.target.value)} className="w-full bg-background border rounded-xl px-3 py-2.5 text-sm mb-4">
                  <option value="" disabled>Select a project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setIsDriveModalOpen(false)} className="px-4 py-2 text-sm text-muted-foreground">Cancel</button>
                  <button onClick={() => { if(driveProject) setIsDriveModalOpen(true) }} className="px-4 py-2 bg-[#4285F4] text-white rounded-lg text-sm">Next</button>
                </div>
             </div>
          </motion.div>
        ) : isDriveModalOpen && driveProject ? (
          <DriveExplorerModal 
            isOpen={isDriveModalOpen} 
            onClose={() => { setIsDriveModalOpen(false); setDriveProject(''); queryClient.invalidateQueries({queryKey: ['drive_files']}); }} 
            projectId={driveProject} 
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
