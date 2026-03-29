import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Folder, Upload, Search, Tag, Eye, Download, X, Grid, List } from 'lucide-react';
import { toast } from 'sonner';

const folders = ['All Files', 'Contracts', 'Drawings', 'Invoices', 'Reports', 'Permits'];

const mockDocs = [
  { id: '1', name: 'Structural Analysis Report.pdf', folder: 'Reports', size: '2.4 MB', date: '2025-03-25', tags: ['drawing'], version: 'v2.1' },
  { id: '2', name: 'Main Contract v2.docx', folder: 'Contracts', size: '1.1 MB', date: '2025-03-20', tags: ['contract'], version: 'v2.0' },
  { id: '3', name: 'Foundation Plan.dwg', folder: 'Drawings', size: '8.7 MB', date: '2025-03-18', tags: ['drawing'], version: 'v3.0' },
  { id: '4', name: 'Invoice #1042.pdf', folder: 'Invoices', size: '340 KB', date: '2025-03-15', tags: ['invoice'], version: 'v1.0' },
  { id: '5', name: 'Building Permit.pdf', folder: 'Permits', size: '520 KB', date: '2025-03-10', tags: ['permit'], version: 'v1.0' },
  { id: '6', name: 'MEP Coordination.pdf', folder: 'Drawings', size: '5.2 MB', date: '2025-03-08', tags: ['drawing'], version: 'v1.3' },
  { id: '7', name: 'Design Decision Log.xlsx', folder: 'Reports', size: '890 KB', date: '2025-03-27', tags: ['design'], version: 'v4.0' },
  { id: '8', name: 'Change Order #12.pdf', folder: 'Contracts', size: '210 KB', date: '2025-03-28', tags: ['contract', 'change-order'], version: 'v1.0' },
];

export default function DocumentsPage() {
  const [selectedFolder, setSelectedFolder] = useState('All Files');
  const [search, setSearch] = useState('');
  const [docs, setDocs] = useState(mockDocs);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [previewDoc, setPreviewDoc] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const filtered = docs.filter(d => {
    const matchFolder = selectedFolder === 'All Files' || d.folder === selectedFolder;
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase());
    return matchFolder && matchSearch;
  });

  const handleUpload = () => {
    const newDoc = {
      id: crypto.randomUUID(),
      name: `New Document ${docs.length + 1}.pdf`,
      folder: selectedFolder === 'All Files' ? 'Reports' : selectedFolder,
      size: '1.0 MB',
      date: new Date().toISOString().split('T')[0],
      tags: ['new'],
      version: 'v1.0',
    };
    setDocs(prev => [newDoc, ...prev]);
    toast.success('Document uploaded successfully');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Documents</h1>
          <p className="text-muted-foreground text-sm mt-1">{docs.length} files across {folders.length - 1} folders</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted rounded-lg p-0.5">
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-card shadow-sm' : ''}`}><List className="w-4 h-4 text-muted-foreground" /></button>
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-card shadow-sm' : ''}`}><Grid className="w-4 h-4 text-muted-foreground" /></button>
          </div>
          <button onClick={handleUpload} className="gradient-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 flex items-center gap-2">
            <Upload className="w-4 h-4" /> Upload
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="w-48 space-y-1 flex-shrink-0">
          {folders.map(f => (
            <button
              key={f}
              onClick={() => setSelectedFolder(f)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${selectedFolder === f ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted'}`}
            >
              <Folder className="w-4 h-4" /> {f}
              <span className="ml-auto text-xs text-muted-foreground">
                {f === 'All Files' ? docs.length : docs.filter(d => d.folder === f).length}
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
            onDrop={e => { e.preventDefault(); setDragOver(false); handleUpload(); }}
            className={`border-2 border-dashed rounded-xl p-4 text-center text-sm transition-colors ${dragOver ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground'}`}
          >
            <Upload className="w-5 h-5 mx-auto mb-1 opacity-50" />
            Drop files here or click Upload
          </div>

          {viewMode === 'list' ? (
            <div className="space-y-2">
              {filtered.map((d, i) => (
                <motion.div key={d.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="glass-card-hover p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{d.name}</div>
                    <div className="text-xs text-muted-foreground">{d.folder} · {d.size} · {d.date} · {d.version}</div>
                  </div>
                  <div className="flex gap-1">
                    {d.tags.map(t => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground flex items-center gap-0.5">
                        <Tag className="w-2.5 h-2.5" /> {t}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setPreviewDoc(d.id)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Eye className="w-4 h-4" /></button>
                    <button onClick={() => toast.success(`Downloading ${d.name}`)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Download className="w-4 h-4" /></button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((d, i) => (
                <motion.div key={d.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }} className="glass-card-hover p-4 text-center">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-sm font-medium text-foreground truncate">{d.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{d.size} · {d.version}</div>
                </motion.div>
              ))}
            </div>
          )}

          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No documents found</p>
              <button onClick={handleUpload} className="text-sm text-primary hover:underline mt-2">Upload a document</button>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewDoc && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-foreground/50 flex items-center justify-center p-4" onClick={() => setPreviewDoc(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-card rounded-2xl border border-border shadow-2xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">File Preview</h3>
                <button onClick={() => setPreviewDoc(null)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
              </div>
              <div className="bg-muted/50 rounded-xl p-12 flex items-center justify-center mb-4">
                <FileText className="w-16 h-16 text-primary/30" />
              </div>
              <p className="text-sm text-muted-foreground text-center">File preview is a demo feature. In production, documents would render inline.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
