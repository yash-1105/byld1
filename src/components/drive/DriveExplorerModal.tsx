import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, X, Search, Loader2, HardDrive, ArrowRight, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
  const [files, setFiles] = useState<GoogleFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedFile, setSelectedFile] = useState<GoogleFile | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const navigate = useNavigate();

  const [errorState, setErrorState] = useState<string | null>(null);
  const [uploadCategory, setUploadCategory] = useState<string>('Reports');
  const [uploadVisibility, setUploadVisibility] = useState<string[]>(['client', 'contractor', 'consultant']);

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
            visible_to: uploadVisibility
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
              <div className="p-4 border-t border-border/60 bg-muted/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 flex items-center gap-2">Category</label>
                  <select value={uploadCategory} onChange={e => setUploadCategory(e.target.value)} className="w-full bg-background border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4285F4]/20 border-border">
                    {['Contracts', 'Drawings', 'Invoices', 'Reports', 'Permits'].map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                {user?.role === 'architect' && (
                  <div>
                    <label className="text-sm font-medium mb-1.5 flex items-center gap-2">Who can view this document?</label>
                    <div className="space-y-1">
                      {[{value:'client', label:'Client'}, {value:'contractor', label:'Contractor'}, {value:'consultant', label:'Consultant'}].map(role => (
                        <label key={role.value} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-background/50 cursor-pointer text-sm">
                          <input type="checkbox" checked={uploadVisibility.includes(role.value)} onChange={() => {
                            setUploadVisibility(prev => prev.includes(role.value) ? prev.filter(r => r !== role.value) : [...prev, role.value])
                          }} className="w-4 h-4 rounded border-border text-[#4285F4] focus:ring-[#4285F4]/20" />
                          <span>{role.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
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
  );
}
