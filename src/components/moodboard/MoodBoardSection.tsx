import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Palette, Trash2, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MoodBoardEditor from './MoodBoardEditor';
import Portal from '@/components/ui/portal';

export interface MoodBoardRow {
  id: string;
  project_id: string;
  title: string;
  canvas_data: Record<string, unknown>;
  thumbnail_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface SectionProject {
  id: string;
  name: string;
}

interface Props {
  user: { id: string } | null;
  projects: SectionProject[];
  activeProjectId: string; // 'all' or a project id
}

export default function MoodBoardSection({ user, projects, activeProjectId }: Props) {
  const queryClient = useQueryClient();
  const [editorBoard, setEditorBoard] = useState<MoodBoardRow | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('Untitled Board');
  const [newProject, setNewProject] = useState('');
  const [creating, setCreating] = useState(false);

  const { data: rawBoards = [], isLoading } = useQuery({
    queryKey: ['mood_boards'],
    queryFn: async () => {
      const { data, error } = await supabase.from('mood_boards').select('*').order('updated_at', { ascending: false });
      if (error && (error as { code?: string }).code !== '42P01') throw error;
      return (data || []) as MoodBoardRow[];
    },
    enabled: !!user,
  });

  const accessibleIds = useMemo(() => new Set(projects.map(p => p.id)), [projects]);
  const boards = useMemo(() =>
    rawBoards
      .filter(b => accessibleIds.has(b.project_id))
      .filter(b => activeProjectId === 'all' || b.project_id === activeProjectId),
    [rawBoards, accessibleIds, activeProjectId]
  );

  const deleteBoardMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('mood_boards').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mood_boards'] });
      toast.success('Board deleted');
    },
    onError: (e: Error) => toast.error(`Failed to delete board: ${e.message}`),
  });

  const openCreate = () => {
    setNewTitle('Untitled Board');
    setNewProject(activeProjectId !== 'all' ? activeProjectId : (projects[0]?.id || ''));
    setShowCreate(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newProject) return;
    setCreating(true);
    try {
      const { data, error } = await supabase.from('mood_boards').insert({
        project_id: newProject,
        title: newTitle.trim() || 'Untitled Board',
        created_by: user.id,
      }).select().single();
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['mood_boards'] });
      setShowCreate(false);
      setEditorBoard(data as MoodBoardRow); // straight into the editor
    } catch (err) {
      toast.error(`Failed to create board: ${err instanceof Error ? err.message : 'unknown error'}`);
    } finally {
      setCreating(false);
    }
  };

  const closeEditor = () => {
    setEditorBoard(null);
    queryClient.invalidateQueries({ queryKey: ['mood_boards'] }); // refresh thumbnails/titles
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* New board card */}
          <motion.button
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            onClick={openCreate}
            className="rounded-2xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2 min-h-[190px] text-muted-foreground hover:text-primary"
          >
            <Plus className="w-6 h-6" />
            <span className="text-sm font-medium">New Board</span>
          </motion.button>

          {boards.map((b, i) => {
            const project = projects.find(p => p.id === b.project_id);
            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="soft-card overflow-hidden text-left group hover:shadow-md transition-shadow cursor-pointer relative"
                onClick={() => setEditorBoard(b)}
              >
                <div className="h-36 relative overflow-hidden border-b border-border/40 bg-white">
                  {b.thumbnail_url ? (
                    <img src={b.thumbnail_url} alt="" className="w-full h-full object-cover object-top" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted/40">
                      <Palette className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                  )}
                  {activeProjectId === 'all' && project && (
                    <span className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full font-medium bg-card/80 text-foreground backdrop-blur-sm border border-border/50">
                      {project.name}
                    </span>
                  )}
                </div>
                <div className="p-3.5 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground truncate">{b.title}</div>
                    <div className="text-[11px] text-muted-foreground mt-1">
                      Updated {formatDistanceToNow(new Date(b.updated_at), { addSuffix: true })}
                    </div>
                  </div>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      if (confirm(`Delete "${b.title}"?`)) deleteBoardMutation.mutate(b.id);
                    }}
                    className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                    title="Delete board"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create dialog */}
      <Portal>
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget && !creating) setShowCreate(false); }}
          >
            <motion.form
              onSubmit={handleCreate}
              initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="bg-card rounded-3xl border shadow-2xl w-full max-w-sm p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">New Mood Board</h2>
                <button type="button" onClick={() => setShowCreate(false)} className="p-2 rounded-xl hover:bg-muted text-muted-foreground"><X className="w-4 h-4" /></button>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Title</label>
                <input
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  onFocus={e => e.target.select()}
                  autoFocus
                  className="w-full px-4 py-2.5 rounded-xl border bg-background/50 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              {activeProjectId === 'all' && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Project</label>
                  <select value={newProject} onChange={e => setNewProject(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border bg-background/50 text-sm outline-none focus:ring-2 focus:ring-primary/20">
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              )}
              <button
                type="submit"
                disabled={creating || !newProject}
                className="w-full py-3 rounded-xl text-sm font-semibold gradient-primary text-primary-foreground shadow-md shadow-primary/20 hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : 'Create & Open'}
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
      </Portal>

      {/* Editor (full-screen) */}
      {editorBoard && (
        <MoodBoardEditor board={editorBoard} onClose={closeEditor} />
      )}
    </div>
  );
}
