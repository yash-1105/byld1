import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Folder, Upload, Search, Tag } from 'lucide-react';
import { toast } from 'sonner';

const folders = ['Contracts', 'Drawings', 'Invoices', 'Reports', 'Permits'];

const mockDocs = [
  { id: '1', name: 'Structural Analysis Report.pdf', folder: 'Reports', size: '2.4 MB', date: '2025-03-25', tags: ['drawing'] },
  { id: '2', name: 'Main Contract v2.docx', folder: 'Contracts', size: '1.1 MB', date: '2025-03-20', tags: ['contract'] },
  { id: '3', name: 'Foundation Plan.dwg', folder: 'Drawings', size: '8.7 MB', date: '2025-03-18', tags: ['drawing'] },
  { id: '4', name: 'Invoice #1042.pdf', folder: 'Invoices', size: '340 KB', date: '2025-03-15', tags: ['invoice'] },
  { id: '5', name: 'Building Permit.pdf', folder: 'Permits', size: '520 KB', date: '2025-03-10', tags: ['permit'] },
  { id: '6', name: 'MEP Coordination.pdf', folder: 'Drawings', size: '5.2 MB', date: '2025-03-08', tags: ['drawing'] },
];

export default function DocumentsPage() {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [docs, setDocs] = useState(mockDocs);

  const filtered = docs.filter(d => {
    const matchFolder = !selectedFolder || d.folder === selectedFolder;
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase());
    return matchFolder && matchSearch;
  });

  const handleUpload = () => {
    const newDoc = {
      id: crypto.randomUUID(),
      name: `New Document ${docs.length + 1}.pdf`,
      folder: selectedFolder || 'Reports',
      size: '1.0 MB',
      date: new Date().toISOString().split('T')[0],
      tags: ['new'],
    };
    setDocs(prev => [newDoc, ...prev]);
    toast.success('Document uploaded');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Documents</h1>
          <p className="text-muted-foreground text-sm mt-1">Project files and documentation</p>
        </div>
        <button onClick={handleUpload} className="gradient-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 flex items-center gap-2">
          <Upload className="w-4 h-4" /> Upload
        </button>
      </div>

      <div className="flex gap-4">
        {/* Sidebar */}
        <div className="w-48 space-y-1 flex-shrink-0">
          <button
            onClick={() => setSelectedFolder(null)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${!selectedFolder ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
          >
            All Files
          </button>
          {folders.map(f => (
            <button
              key={f}
              onClick={() => setSelectedFolder(f)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${selectedFolder === f ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted'}`}
            >
              <Folder className="w-4 h-4" /> {f}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-primary/20" />
          </div>

          <div className="space-y-2">
            {filtered.map((d, i) => (
              <motion.div key={d.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="glass-card-hover p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{d.name}</div>
                  <div className="text-xs text-muted-foreground">{d.folder} · {d.size} · {d.date}</div>
                </div>
                <div className="flex gap-1">
                  {d.tags.map(t => (
                    <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground flex items-center gap-0.5">
                      <Tag className="w-2.5 h-2.5" /> {t}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">No documents found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
