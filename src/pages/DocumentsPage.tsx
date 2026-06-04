import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Folder, Upload, Search, Tag, Eye, Download, X, Grid, List, Building2, Users, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';

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
  const [uploadVisibility, setUploadVisibility] = useState<UserRole[]>(['client', 'contractor', 'consultant']);

  // Fetch documents from Supabase
  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const { data, error } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Filter documents by role visibility (architect sees all)
  const roleFilteredDocs = docs.filter(d => {
    if (user?.role === 'architect') return true;
    if (d.uploaded_by === user?.id) return true;
    if (d.visible_to && user?.role) {
      return d.visible_to.includes(user.role);
    }
    // If no visibility is defined, fallback to visible
    return true;
  });

  const filtered = roleFilteredDocs.filter(d => {
    const matchFolder = selectedFolder === 'All Files' || d.category === selectedFolder;
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

      // Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('project-documents')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('project-documents')
        .getPublicUrl(filePath);

      // Insert record in Database
      const category = selectedFolder === 'All Files' ? 'Reports' : selectedFolder;
      
      const { error: dbError } = await supabase.from('documents').insert({
        name: selectedFile.name,
        file_url: publicUrl,
        category: category,
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

  const deleteDocument = async (id: string, fileUrl: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      const filePath = fileUrl.split('project-documents/')[1];
      if (filePath) {
        await supabase.storage.from('project-documents').remove([filePath]);
      }
      
      const { error } = await supabase.from('documents').delete().eq('id', id);
      if (error) throw error;
      
      toast.success('Document deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    } catch (error: any) {
      console.error(error);
      toast.error(`Delete failed: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Documents</h1>
          <p className="text-muted-foreground text-sm mt-1">{roleFilteredDocs.length} files across {folders.length - 1} folders</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted rounded-lg p-0.5">
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-card shadow-sm' : ''}`}><List className="w-4 h-4 text-muted-foreground" /></button>
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-card shadow-sm' : ''}`}><Grid className="w-4 h-4 text-muted-foreground" /></button>
          </div>
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
                {f === 'All Files' ? roleFilteredDocs.length : roleFilteredDocs.filter(d => d.category === f).length}
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
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{d.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span>{d.category}</span>
                      <span>·</span>
                      <span>{new Date(d.created_at).toLocaleDateString()}</span>
                      {user?.role === 'architect' && d.visible_to && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1 text-primary/80">
                            <Eye className="w-3 h-3" />
                            {d.visible_to.length} roles
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {(user?.role === 'architect' || user?.id === d.uploaded_by) && (
                      <button onClick={() => deleteDocument(d.id, d.file_url)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
                    )}
                    <button onClick={() => window.open(d.file_url, '_blank')} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Eye className="w-4 h-4" /></button>
                    <a href={d.file_url} download className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Download className="w-4 h-4" /></a>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((d, i) => (
                <motion.div key={d.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }} className="glass-card-hover p-4 text-center group">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-sm font-medium text-foreground truncate" title={d.name}>{d.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{new Date(d.created_at).toLocaleDateString()}</div>
                  <div className="mt-3 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {(user?.role === 'architect' || user?.id === d.uploaded_by) && (
                      <button onClick={() => deleteDocument(d.id, d.file_url)} className="p-1.5 rounded-md bg-muted text-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    )}
                    <button onClick={() => window.open(d.file_url, '_blank')} className="p-1.5 rounded-md bg-muted text-foreground hover:bg-primary/10 hover:text-primary transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                    <a href={d.file_url} download className="p-1.5 rounded-md bg-muted text-foreground hover:bg-primary/10 hover:text-primary transition-colors"><Download className="w-3.5 h-3.5" /></a>
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
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
              onClick={() => setIsUploadModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, x: '-50%', y: '-40%' }}
              animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
              exit={{ opacity: 0, scale: 0.95, x: '-50%', y: '-40%' }}
              className="fixed left-1/2 top-1/2 w-full max-w-md bg-card border shadow-2xl rounded-2xl z-50 overflow-hidden"
            >
              <div className="p-4 flex items-center justify-between border-b border-border/60">
                <h2 className="text-lg font-semibold text-foreground">Upload Document</h2>
                <button onClick={() => setIsUploadModalOpen(false)} className="p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/60 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-5">
                <div className="bg-primary/5 p-3 rounded-xl flex items-center gap-3 border border-primary/10">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{selectedFile?.name}</div>
                    <div className="text-xs text-muted-foreground">{(selectedFile?.size || 0) / 1000} KB</div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    Project
                  </label>
                  <select 
                    value={uploadProject} 
                    onChange={e => setUploadProject(e.target.value)}
                    className="w-full bg-background border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="" disabled>Select a project</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {user?.role === 'architect' && (
                  <div>
                    <label className="text-sm font-medium mb-1.5 block flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      Who can view this document?
                    </label>
                    <div className="space-y-2">
                      {allRoles.map(role => (
                        <label key={role.value} className="flex items-center gap-3 p-2.5 rounded-xl border bg-background/50 hover:bg-background cursor-pointer transition-colors">
                          <input 
                            type="checkbox" 
                            checked={uploadVisibility.includes(role.value)}
                            onChange={() => toggleVisibility(role.value)}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
                          />
                          <span className="text-sm font-medium">{role.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-border/60 bg-muted/30 flex justify-end gap-2">
                <button 
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmUpload}
                  disabled={isUploading || !uploadProject}
                  className="gradient-primary text-primary-foreground px-6 py-2 rounded-xl text-sm font-medium hover:opacity-90 flex items-center gap-2 shadow-sm shadow-primary/20 disabled:opacity-50 transition-all"
                >
                  {isUploading ? (
                    <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Uploading...</>
                  ) : (
                    <><Upload className="w-4 h-4" /> Upload Document</>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
