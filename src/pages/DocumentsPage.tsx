import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Folder, Upload, Search, Tag, Eye, Download, X, Grid, List, Building2, Users, Trash2, HardDrive, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { NormalizedDocument } from '@/types/drive';
import DriveExplorerModal from '@/components/drive/DriveExplorerModal';

const folders = ['All Files', 'Contracts', 'Drawings', 'Invoices', 'Reports', 'Permits'];
const allRoles: { value: UserRole, label: string }[] = [
  { value: 'client', label: 'Client' },
  { value: 'contractor', label: 'Contractor' },
  { value: 'consultant', label: 'Consultant' }
];

export default function DocumentsPage() {
  const { user } = useAuth();
  const { projects } = useData();
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
  const [uploadVisibility, setUploadVisibility] = useState<UserRole[]>(['client', 'contractor', 'consultant']);

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
      if (user?.role === 'architect') return true;
      if (d.uploaded_by === user?.id) return true;
      if (d.visible_to && user?.role) return d.visible_to.includes(user.role);
      return true;
    }).map(d => ({
      id: d.id,
      name: d.name,
      source: 'supabase' as const,
      url: d.file_url,
      created_at: d.created_at,
      uploaded_by: d.uploaded_by,
      category: d.category
    })),
    ...driveDocs.filter(d => {
      if (user?.role === 'architect') return true;
      if (d.user_id === user?.id) return true;
      const visible_to = d.metadata_json?.visible_to;
      if (visible_to && user?.role) return visible_to.includes(user.role);
      return true;
    }).map(d => ({
      id: d.id,
      name: d.name,
      source: 'google_drive' as const,
      url: d.drive_link,
      created_at: d.created_at,
      uploaded_by: d.user_id,
      category: d.metadata_json?.category || 'Drive Import'
    }))
  ];

  const filtered = normalizedDocs.filter(d => {
    const matchFolder = selectedFolder === 'All Files' || (d as any).category === selectedFolder;
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase());
    return matchFolder && matchSearch;
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setIsUploadModalOpen(true);
      if (projects.length > 0 && !uploadProject) {
        setUploadProject(projects[0].id);
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
      if (projects.length > 0 && !uploadProject) {
        setUploadProject(projects[0].id);
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
        visible_to: uploadVisibility
      });

      if (dbError) throw dbError;

      toast.success('Document uploaded successfully');
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setIsUploadModalOpen(false);
      setSelectedFile(null);
    } catch (error: any) {
      console.error(error);
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleVisibility = (role: UserRole) => {
    setUploadVisibility(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
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
    setDriveProject(projects[0].id);
    setIsDriveModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Documents</h1>
          <p className="text-muted-foreground text-sm mt-1">{normalizedDocs.length} files across sources</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted rounded-lg p-0.5">
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-card shadow-sm' : ''}`}><List className="w-4 h-4 text-muted-foreground" /></button>
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-card shadow-sm' : ''}`}><Grid className="w-4 h-4 text-muted-foreground" /></button>
          </div>
          
          <button 
            onClick={openDriveModal}
            className="flex items-center gap-2 text-sm font-medium px-4 py-2 border border-border rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" alt="Google Drive" className="w-4 h-4" />
            Google Drive Import
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
        <div className="w-full md:w-48 space-y-1 flex-shrink-0">
          {folders.map(f => (
            <button
              key={f}
              onClick={() => setSelectedFolder(f)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${selectedFolder === f ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted'}`}
            >
              <Folder className="w-4 h-4" /> {f}
              <span className="ml-auto text-xs text-muted-foreground">
                {f === 'All Files' ? normalizedDocs.length : normalizedDocs.filter(d => (d as any).category === f).length}
              </span>
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-primary/20" />
          </div>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center text-sm transition-colors cursor-pointer ${dragOver ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}
          >
            <Upload className="w-6 h-6 mx-auto mb-2 opacity-50" />
            <div className="font-medium mb-1">Drop files here or click to browse</div>
            <div className="text-xs text-muted-foreground">Support for PDF, DOCX, JPG, PNG</div>
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

                {user?.role === 'architect' && (
                  <div>
                    <label className="text-sm font-medium mb-1.5 flex items-center gap-2"><Users className="w-4 h-4 text-muted-foreground" /> Who can view this document?</label>
                    <div className="space-y-2">
                      {allRoles.map(role => (
                        <label key={role.value} className="flex items-center gap-3 p-2.5 rounded-xl border bg-background/50 cursor-pointer">
                          <input type="checkbox" checked={uploadVisibility.includes(role.value)} onChange={() => toggleVisibility(role.value)} className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20" />
                          <span className="text-sm font-medium">{role.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
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
