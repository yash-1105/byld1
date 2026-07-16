import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, X, Search, Loader2, HardDrive, ArrowRight, CheckCircle2, Users, Lock, AlertTriangle } from 'lucide-react';
import Portal from '@/components/ui/portal';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface DriveExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

interface GoogleFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  webViewLink?: string;
  iconLink?: string;
}

export default function DriveExplorerModal({ isOpen, onClose, projectId }: DriveExplorerModalProps) {
  const { user } = useAuth();
  const { users, projectMembers } = useData();
  const [files, setFiles] = useState<GoogleFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedFile, setSelectedFile] = useState<GoogleFile | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const navigate = useNavigate();

  const [errorState, setErrorState] = useState<string | null>(null);
  const [uploadCategory, setUploadCategory] = useState<string>('Reports');
  const [visMode, setVisMode] = useState<'public' | 'private'>('public');
  const [taggedUserIds, setTaggedUserIds] = useState<string[]>([]);

  const memberOptions = useMemo(() => {
    const ids = new Set(projectMembers.filter((m: any) => m.project_id === projectId).map((m: any) => m.user_id));
    const scoped = users.filter((u: any) => ids.has(u.id));
    return (scoped.length > 0 ? scoped : users).filter((u: any) => u.id !== user?.id);
  }, [users, projectMembers, projectId, user?.id]);

  useEffect(() => {
    if (isOpen) {
      setErrorState(null);
      fetchFiles();
    } else {
      setSelectedFile(null);
      setSearch('');
    }
  }, [isOpen]);

  const fetchFiles = async () => {
    if (!user) return;
    setIsLoading(true);
    setErrorState(null);
    try {
      const { data, error } = await supabase.functions.invoke('google-drive-folders', {
        body: { userId: user.id }
      });
      
      if (error) throw error;
      setFiles(data?.files || []);
    } catch (error: any) {
      console.error('Fetch files error:', error);
      setErrorState(error.message || 'Could not fetch files. Ensure Edge Functions are deployed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkFile = async () => {
    if (!user || !selectedFile) return;
    if (visMode === 'private' && taggedUserIds.length === 0) {
      toast.error('Select at least one member, or set the document to Everyone.');
      return;
    }
    setIsLinking(true);
    try {
      const { error: insertError } = await supabase
        .from('drive_files')
        .insert({
          project_id: projectId,
          user_id: user.id,
          google_file_id: selectedFile.id,
          name: selectedFile.name,
          mime_type: selectedFile.mimeType,
          drive_link: selectedFile.webViewLink || `https://drive.google.com/file/d/${selectedFile.id}/view`,
          metadata_json: {
            category: uploadCategory,
            visible_to: visMode === 'private' ? taggedUserIds : null
          }
        });

      if (insertError) {
        if (insertError.code === '23505') throw new Error('This file has already been imported to this project.');
        throw insertError;
      }
      
      toast.success('File imported successfully!');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to import file');
    } finally {
      setIsLinking(false);
    }
  };

  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Portal>
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: '-50%', y: '-40%' }}
            animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
            exit={{ opacity: 0, scale: 0.95, x: '-50%', y: '-40%' }}
            className="fixed left-1/2 top-1/2 w-full max-w-2xl bg-card border shadow-2xl rounded-2xl z-50 overflow-hidden flex flex-col max-h-[85vh]"
          >
            <div className="p-4 flex items-center justify-between border-b border-border/60">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#4285F4]/10 flex items-center justify-center">
                  <HardDrive className="w-4 h-4 text-[#4285F4]" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Select Drive File</h2>
              </div>
              <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/60 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-border/60">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-muted/50 border-transparent rounded-xl text-sm focus:bg-background focus:border-border outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <Loader2 className="w-8 h-8 animate-spin mb-4" />
                  <p>Loading your Drive files...</p>
                </div>
              ) : errorState ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <div className="w-12 h-12 bg-destructive/10 text-destructive rounded-xl flex items-center justify-center mb-4">
                    <X className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-semibold mb-2">Connection Error</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mb-6">{errorState}</p>
                  <button 
                    onClick={() => {
                      onClose();
                      navigate('/settings');
                    }}
                    className="bg-foreground text-background px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-foreground/90 transition-all shadow-sm"
                  >
                    Go to Settings
                  </button>
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground text-center">
                  <FileText className="w-10 h-10 mb-4 opacity-20" />
                  <p>No files found matching "{search}"</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filteredFiles.map(file => (
                    <button
                      key={file.id}
                      onClick={() => setSelectedFile(file)}
                      className={`flex items-start gap-3 p-3 text-left rounded-xl border transition-all ${
                        selectedFile?.id === file.id 
                          ? 'border-[#4285F4] bg-[#4285F4]/5 ring-1 ring-[#4285F4]' 
                          : 'border-transparent hover:bg-muted'
                      }`}
                    >
                      {file.iconLink ? (
                         <img src={file.iconLink} alt="" className="w-5 h-5 shrink-0 mt-0.5" />
                      ) : (
                         <FileText className={`w-5 h-5 shrink-0 mt-0.5 ${selectedFile?.id === file.id ? 'text-[#4285F4]' : 'text-muted-foreground'}`} />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-foreground truncate">{file.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Modified {new Date(file.modifiedTime).toLocaleDateString()}
                        </div>
                      </div>
                      {selectedFile?.id === file.id && (
                        <CheckCircle2 className="w-5 h-5 text-[#4285F4] shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedFile && (
              <div className="p-4 border-t border-border/60 bg-muted/10 space-y-4">
                <div className="sm:max-w-xs">
                  <label className="text-sm font-medium mb-1.5 flex items-center gap-2">Category</label>
                  <select value={uploadCategory} onChange={e => setUploadCategory(e.target.value)} className="w-full bg-background border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4285F4]/20 border-border">
                    {['Contracts', 'Drawings', 'Invoices', 'Reports', 'Permits'].map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 flex items-center gap-2"><Users className="w-4 h-4 text-muted-foreground" /> Who can view this document?</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setVisMode('public'); setTaggedUserIds([]); }} className={`px-4 py-2 rounded-xl text-xs font-medium transition-all border ${visMode === 'public' ? 'bg-[#4285F4]/10 border-[#4285F4]/30 text-[#4285F4]' : 'bg-background border-border text-muted-foreground hover:border-foreground/30'}`}>
                      Public (Everyone)
                    </button>
                    <button type="button" onClick={() => setVisMode('private')} className={`px-4 py-2 rounded-xl text-xs font-medium transition-all border ${visMode === 'private' ? 'bg-[#4285F4]/10 border-[#4285F4]/30 text-[#4285F4]' : 'bg-background border-border text-muted-foreground hover:border-foreground/30'}`}>
                      Private (Tagged Members)
                    </button>
                  </div>
                  {visMode === 'private' && (
                    <div className="flex flex-col gap-2 p-3 mt-2 rounded-xl bg-background/50 border border-border/50 max-h-40 overflow-y-auto">
                      <label className="text-xs font-medium text-muted-foreground">Select members who can see this document</label>
                      {memberOptions.length === 0 ? (
                        <p className="text-[11px] text-muted-foreground">No other members on this project yet.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {memberOptions.map((u: any) => {
                            const isTagged = taggedUserIds.includes(u.id);
                            return (
                              <button key={u.id} type="button" onClick={() => setTaggedUserIds(prev => prev.includes(u.id) ? prev.filter(x => x !== u.id) : [...prev, u.id])}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${isTagged ? 'bg-[#4285F4]/10 border-[#4285F4]/30 text-[#4285F4]' : 'bg-background border-border text-muted-foreground hover:border-foreground/30'}`}>
                                {u.full_name || u.email || 'Team Member'}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {taggedUserIds.length > 0 ? (
                        <p className="text-[10px] text-[#4285F4] flex items-center gap-1"><Lock className="w-3 h-3" /> Only you and the tagged members will see this document.</p>
                      ) : (
                        <p className="text-[10px] text-destructive flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Please select at least one member.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="p-4 border-t border-border/60 bg-muted/30 flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                Selected file will be added to this project's documents.
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleLinkFile}
                  disabled={!selectedFile || isLinking}
                  className="bg-[#4285F4] text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-[#3367D6] flex items-center gap-2 disabled:opacity-50 transition-all shadow-sm shadow-[#4285F4]/20"
                >
                  {isLinking ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Importing...</>
                  ) : (
                    <>Import File <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </Portal>
  );
}
