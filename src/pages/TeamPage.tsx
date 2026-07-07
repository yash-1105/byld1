import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Briefcase, Users, Plus, X, Search, Trash2, UserPlus, Folder } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const roleColors: Record<string, string> = {
  architect: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  client: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  contractor: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  consultant: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
};

export default function TeamPage() {
  const { user } = useAuth();
  const { users, projectMembers, projects } = useData();
  const queryClient = useQueryClient();

  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const [showManageModal, setShowManageModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  // Set default project once loaded
  useMemo(() => {
    if (projects.length > 0 && !activeProjectId) setActiveProjectId(projects[0].id);
  }, [projects, activeProjectId]);

  const activeProject = projects.find(p => p.id === activeProjectId);

  // Members of the ACTIVE project only
  const activeMembers = useMemo(() => {
    const memberIds = new Set(
      projectMembers
        .filter(m => m.project_id === activeProjectId)
        .map(m => m.user_id)
    );
    return users.filter(u => memberIds.has(u.id));
  }, [projectMembers, users, activeProjectId]);

  // All users NOT already in this project (for the Add panel)
  const nonMembers = useMemo(() => {
    const memberIds = new Set(
      projectMembers
        .filter(m => m.project_id === activeProjectId)
        .map(m => m.user_id)
    );
    return users.filter(u =>
      !memberIds.has(u.id) && u.id !== user?.id &&
      (search === '' ||
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()))
    );
  }, [projectMembers, users, activeProjectId, search, user?.id]);

  const filteredNonMembers = useMemo(() => {
    if (filterRole === 'all') return nonMembers;
    return nonMembers.filter(u => u.role === filterRole);
  }, [nonMembers, filterRole]);

  const handleAdd = async (userId: string) => {
    if (!activeProjectId) return;
    setLoading(true);
    const userToAdd = users.find(u => u.id === userId);
    const { error } = await supabase.from('project_members').insert({
      project_id: activeProjectId,
      user_id: userId,
      role: userToAdd?.role || 'member'
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`${userToAdd?.full_name || 'User'} added to ${activeProject?.name}`);
      queryClient.invalidateQueries({ queryKey: ['project_members'] });
    }
    setLoading(false);
  };

  const handleRemove = async (userId: string) => {
    if (!activeProjectId || userId === user?.id) return;
    const userToRemove = users.find(u => u.id === userId);
    const { error } = await supabase.from('project_members')
      .delete()
      .eq('project_id', activeProjectId)
      .eq('user_id', userId);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`${userToRemove?.full_name || 'User'} removed from ${activeProject?.name}`);
      queryClient.invalidateQueries({ queryKey: ['project_members'] });
    }
  };

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
        <Folder className="w-12 h-12 mb-4 opacity-30" />
        <p>No projects found. Create a project first to manage your team.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your project team members</p>
        </div>
        <button
          onClick={() => setShowManageModal(true)}
          className="gradient-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 flex items-center gap-2 shadow-lg shadow-primary/20 shrink-0 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" /> Add Members
        </button>
      </div>

      {/* Project Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {projects.map(p => (
          <button
            key={p.id}
            onClick={() => setActiveProjectId(p.id)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              activeProjectId === p.id
                ? 'bg-foreground text-background shadow-md'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Members Grid */}
      {activeMembers.length === 0 ? (
        <div className="bg-card border border-border/40 rounded-2xl p-12 text-center space-y-4">
          <Users className="w-12 h-12 mx-auto opacity-20" />
          <div>
            <p className="font-semibold text-foreground">No team members yet</p>
            <p className="text-sm text-muted-foreground mt-1">Click "Add Members" to add people to {activeProject?.name}.</p>
          </div>
          <button
            onClick={() => setShowManageModal(true)}
            className="gradient-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 shadow-lg shadow-primary/20 inline-flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" /> Add Members
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeMembers.map((m, i) => {
            const roleColor = roleColors[m.role] || 'bg-muted text-muted-foreground border-border';
            const isSelf = m.id === user?.id;
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-2xl border border-border/40 p-3.5 sm:p-5 shadow-sm hover:shadow-md transition-all group relative"
              >
                {/* Remove button (only for non-self); always visible on touch, hover-revealed on desktop */}
                {!isSelf && (
                  <button
                    onClick={() => handleRemove(m.id)}
                    className="absolute top-3 right-3 w-7 h-7 rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-all sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                <div className="flex items-center gap-3 sm:gap-4">
                  {m.avatar_url ? (
                    <img src={m.avatar_url} alt={m.full_name || ''} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground shadow-sm shrink-0">
                      {getInitials(m.full_name || m.email)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground truncate flex items-center gap-1.5 pr-6 sm:pr-0">
                      {m.full_name || 'Unknown'}
                      {isSelf && <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-medium">You</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1 min-w-0">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border inline-flex items-center gap-1 shrink-0 ${roleColor}`}>
                        <Briefcase className="w-2.5 h-2.5" /> {m.role}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground min-w-0 sm:hidden">
                        <Mail className="w-3 h-3 shrink-0" />
                        <span className="truncate">{m.email}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{m.email}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add Members Modal */}
      <AnimatePresence>
        {showManageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowManageModal(false)}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-border/40 shrink-0">
                <div>
                  <h2 className="font-bold text-foreground">Manage Team</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{activeProject?.name}</p>
                </div>
                <button onClick={() => setShowManageModal(false)} className="text-muted-foreground hover:text-foreground w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Current Members */}
              <div className="p-4 border-b border-border/30 shrink-0">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Current Members ({activeMembers.length})</p>
                <div className="flex flex-wrap gap-2">
                  {activeMembers.map(m => (
                    <div key={m.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/50 border border-border/40 text-xs">
                      <span className="font-medium text-foreground">{m.full_name || m.email?.split('@')[0]}</span>
                      <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-medium border ${roleColors[m.role] || 'bg-muted border-border text-muted-foreground'}`}>{m.role}</span>
                      {m.id !== user?.id && (
                        <button onClick={() => handleRemove(m.id)} className="ml-0.5 text-muted-foreground/40 hover:text-destructive transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                  {activeMembers.length === 0 && <p className="text-xs text-muted-foreground">No members yet.</p>}
                </div>
              </div>

              {/* Search + Filter */}
              <div className="p-4 border-b border-border/30 space-y-3 shrink-0">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {['all', 'architect', 'client', 'contractor', 'consultant'].map(role => (
                    <button
                      key={role}
                      onClick={() => setFilterRole(role)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all capitalize ${
                        filterRole === role
                          ? 'bg-foreground text-background'
                          : 'bg-muted border border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* User List to Add */}
              <div className="overflow-y-auto flex-1 p-4">
                {filteredNonMembers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    {users.length <= activeMembers.length
                      ? 'All registered users are already in this project.'
                      : 'No users match your search.'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredNonMembers.map((u) => {
                      const roleColor = roleColors[u.role] || 'bg-muted text-muted-foreground border-border';
                      return (
                        <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 hover:bg-muted/40 border border-border/40 transition-colors">
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
                              {getInitials(u.full_name || u.email)}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">{u.full_name || 'Unknown'}</div>
                            <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border capitalize shrink-0 ${roleColor}`}>{u.role}</span>
                          <button
                            onClick={() => handleAdd(u.id)}
                            disabled={loading}
                            className="gradient-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1 shrink-0 disabled:opacity-50"
                          >
                            <Plus className="w-3 h-3" /> Add
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
