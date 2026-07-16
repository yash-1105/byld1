import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Portal from '@/components/ui/portal';
import { Mail, Briefcase, Users, X, Trash2, UserPlus, Folder, Loader2, Search } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useActiveProject } from '@/contexts/ActiveProjectContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { getInitials } from '@/lib/utils';
import PendingInvites from '@/components/team/PendingInvites';
import MemberTasksModal from '@/components/team/MemberTasksModal';
import AvailabilityDot, { type AvailabilityStatus } from '@/components/team/AvailabilityDot';

const roleColors: Record<string, string> = {
  architect: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  client: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  contractor: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  consultant: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
};

// One exact-email match from lookup_user_for_invite — never a browsable list.
interface LookupResult {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  email: string;
}

export default function TeamPage() {
  const { user } = useAuth();
  const { users, projectMembers, projects, tasks } = useData();
  const { activeProjectId } = useActiveProject();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const inviteParam = searchParams.get('invite') || undefined;

  // Only architects & clients may add/invite members. Everyone else who can now reach /team
  // (contractors, consultants) still sees Current Members + their own PendingInvites.
  const canManageTeam = user?.role === 'architect' || user?.role === 'client';

  // Who can tap a member to see their assigned tasks. Consultants are excluded — they have no
  // Tasks access anywhere else in the app, so exposing task data here would be a new leak.
  const canViewMemberTasks = user?.role === 'architect' || user?.role === 'client' || user?.role === 'contractor';
  const [selectedMember, setSelectedMember] = useState<typeof users[number] | null>(null);

  const [showManageModal, setShowManageModal] = useState(false);
  const [modalProjectId, setModalProjectId] = useState('');

  // Email-lookup / invite state (replaces the old browse-all-users Add panel).
  const [lookupEmail, setLookupEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [inviting, setInviting] = useState(false);
  // 'idle' | 'not_found' | 'found' | 'already_member'
  const [lookupState, setLookupState] = useState<'idle' | 'not_found' | 'found' | 'already_member'>('idle');
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);

  const activeProject = activeProjectId !== 'all' ? projects.find(p => p.id === activeProjectId) : undefined;
  // The project members are added to/removed from — the active project if concrete, otherwise chosen in the modal.
  const targetProjectId = activeProjectId !== 'all' ? activeProjectId : modalProjectId;
  const targetProject = projects.find(p => p.id === targetProjectId);

  const resetLookup = () => {
    setLookupEmail('');
    setLookupResult(null);
    setLookupState('idle');
    setSearching(false);
  };

  const openManageModal = () => {
    setModalProjectId(prev => activeProjectId !== 'all' ? activeProjectId : (prev || projects[0]?.id || ''));
    resetLookup();
    setShowManageModal(true);
  };

  // Members of the active project, or the union of members across all accessible projects.
  const activeMembers = useMemo(() => {
    const memberIds = new Set(
      projectMembers
        .filter(m => activeProjectId === 'all' || m.project_id === activeProjectId)
        .map(m => m.user_id)
    );
    return users.filter(u => memberIds.has(u.id));
  }, [projectMembers, users, activeProjectId]);

  // Members of the modal's target project (for the Current Members list + already-member check)
  const targetMembers = useMemo(() => {
    const memberIds = new Set(
      projectMembers
        .filter(m => m.project_id === targetProjectId)
        .map(m => m.user_id)
    );
    return users.filter(u => memberIds.has(u.id));
  }, [projectMembers, users, targetProjectId]);

  const handleFind = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const email = lookupEmail.trim();
    if (!email) return;
    setSearching(true);
    setLookupState('idle');
    setLookupResult(null);
    try {
      const { data, error } = await supabase.rpc('lookup_user_for_invite', { p_email: email });
      if (error) throw error;
      const match = (data as LookupResult[] | null)?.[0] || null;
      if (!match) {
        setLookupState('not_found');
      } else if (targetMembers.some(m => m.id === match.id) || match.id === user?.id) {
        setLookupResult(match);
        setLookupState('already_member');
      } else {
        setLookupResult(match);
        setLookupState('found');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lookup failed');
      setLookupState('idle');
    } finally {
      setSearching(false);
    }
  };

  const handleInvite = async () => {
    if (!targetProjectId || !lookupResult || !user?.id) return;
    setInviting(true);
    try {
      // Create the pending invitation — membership is NOT written here, only on acceptance.
      const { data: newInvitation, error } = await supabase.from('team_invitations').insert({
        project_id: targetProjectId,
        invited_email: lookupResult.email,
        invited_user_id: lookupResult.id,
        role: lookupResult.role,
        invited_by: user.id,
        status: 'pending',
      }).select().single();
      if (error) throw error;

      // Send the invite email through the same Apps Script relay as approvals (best-effort).
      const { error: fnError } = await supabase.functions.invoke('send-team-invite-email', {
        body: {
          recipient: { email: lookupResult.email, name: lookupResult.full_name },
          invite: {
            inviteeName: lookupResult.full_name,
            inviteeEmail: lookupResult.email,
            inviterName: user.name || 'A team member',
            projectName: targetProject?.name || '',
            role: lookupResult.role,
            invitationId: newInvitation.id,
          },
        },
      });
      if (fnError) console.warn('send-team-invite-email failed', fnError);

      // In-app nudge for the invited user (the actionable UI is PendingInvites).
      try {
        await supabase.from('notifications').insert({
          type: 'info',
          message: `You've been invited to join ${targetProject?.name || 'a project'} as ${lookupResult.role}`,
          user_id: lookupResult.id,
          project_id: targetProjectId,
          link: '/team',
        });
      } catch { /* non-blocking */ }

      queryClient.invalidateQueries({ queryKey: ['team_invitations'] });
      toast.success(`Invite sent to ${lookupResult.full_name || lookupResult.email}`);
      resetLookup();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send invite');
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (userId: string, projectId?: string) => {
    const removeFrom = projectId || targetProjectId;
    if (!removeFrom || userId === user?.id) return;
    const userToRemove = users.find(u => u.id === userId);
    const { error } = await supabase.from('project_members')
      .delete()
      .eq('project_id', removeFrom)
      .eq('user_id', userId);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`${userToRemove?.full_name || 'User'} removed from ${projects.find(p => p.id === removeFrom)?.name}`);
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
      {/* Pending invitations for the current user (accept / decline) */}
      <PendingInvites highlightId={inviteParam} />

      {/* Member's assigned tasks (architect / client / contractor only) */}
      <AnimatePresence>
        {canViewMemberTasks && selectedMember && (
          <MemberTasksModal
            member={selectedMember}
            tasks={tasks}
            projects={projects}
            activeProjectId={activeProjectId}
            onClose={() => setSelectedMember(null)}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-foreground">Team</h1>
            <span className="text-[11px] px-2.5 py-1 rounded-full font-medium bg-muted text-muted-foreground">
              {activeProject ? activeProject.name : 'All projects'}
            </span>
          </div>
          <p className="text-muted-foreground text-sm mt-1">Manage your project team members</p>
        </div>
        {canManageTeam && (
          <button
            onClick={openManageModal}
            className="gradient-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 flex items-center gap-2 shadow-lg shadow-primary/20 shrink-0 self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" /> Add Members
          </button>
        )}
      </div>

      {/* Members Grid */}
      {activeMembers.length === 0 ? (
        <div className="bg-card border border-border/40 rounded-2xl p-12 text-center space-y-4">
          <Users className="w-12 h-12 mx-auto opacity-20" />
          <div>
            <p className="font-semibold text-foreground">No team members yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              {canManageTeam
                ? `Click "Add Members" to add people to ${activeProject ? activeProject.name : 'a project'}.`
                : 'Ask an architect or the client to add people to this project.'}
            </p>
          </div>
          {canManageTeam && (
            <button
              onClick={openManageModal}
              className="gradient-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 shadow-lg shadow-primary/20 inline-flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" /> Add Members
            </button>
          )}
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
                onClick={canViewMemberTasks ? () => setSelectedMember(m) : undefined}
                className={`bg-card rounded-2xl border border-border/40 p-3.5 sm:p-5 shadow-sm hover:shadow-md transition-all group relative ${canViewMemberTasks ? 'cursor-pointer' : ''}`}
              >
                {/* Remove button (only for non-self, and only when scoped to one project — ambiguous across "All projects") */}
                {!isSelf && activeProject && (
                  <button
                    onClick={e => { e.stopPropagation(); handleRemove(m.id, activeProject.id); }}
                    className="absolute top-3 right-3 w-7 h-7 rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-all sm:opacity-0 sm:group-hover:opacity-100 z-10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="relative shrink-0">
                    {m.avatar_url ? (
                      <img src={m.avatar_url} alt={m.full_name || ''} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground shadow-sm">
                        {getInitials(m.full_name || m.email)}
                      </div>
                    )}
                    <AvailabilityDot
                      status={(m.availability_status as AvailabilityStatus) || 'available'}
                      className="absolute bottom-0 right-0"
                    />
                  </div>
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
      <Portal>
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
                  {activeProjectId === 'all' ? (
                    <select
                      value={modalProjectId}
                      onChange={e => { setModalProjectId(e.target.value); resetLookup(); }}
                      className="mt-1 px-2.5 py-1 rounded-lg border border-border bg-background text-xs outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-0.5">{targetProject?.name}</p>
                  )}
                </div>
                <button onClick={() => setShowManageModal(false)} className="text-muted-foreground hover:text-foreground w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Current Members */}
              <div className="p-4 border-b border-border/30 shrink-0">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Current Members ({targetMembers.length})</p>
                <div className="flex flex-wrap gap-2">
                  {targetMembers.map(m => (
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
                  {targetMembers.length === 0 && <p className="text-xs text-muted-foreground">No members yet.</p>}
                </div>
              </div>

              {/* Invite by email — exact lookup only, no browsing. Second-layer gate: only
                  architects & clients can invite, even if they somehow reach this modal. */}
              {canManageTeam && (
              <div className="p-4 overflow-y-auto flex-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Invite by email</p>
                <form onSubmit={handleFind} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="email"
                      value={lookupEmail}
                      onChange={e => { setLookupEmail(e.target.value); if (lookupState !== 'idle') setLookupState('idle'); }}
                      placeholder="Enter an exact email address..."
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={searching || !lookupEmail.trim()}
                    className="bg-foreground text-background px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                  >
                    {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Find
                  </button>
                </form>

                <div className="mt-4">
                  {lookupState === 'not_found' && (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      No BYLD Space account found for that email.
                    </div>
                  )}

                  {lookupState === 'already_member' && lookupResult && (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      {lookupResult.full_name || lookupResult.email} is already on this project.
                    </div>
                  )}

                  {lookupState === 'found' && lookupResult && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/40">
                      {lookupResult.avatar_url ? (
                        <img src={lookupResult.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
                          {getInitials(lookupResult.full_name || lookupResult.email)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{lookupResult.full_name || 'Unknown'}</div>
                        <div className="text-xs text-muted-foreground truncate">{lookupResult.email}</div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border capitalize shrink-0 ${roleColors[lookupResult.role] || 'bg-muted text-muted-foreground border-border'}`}>{lookupResult.role}</span>
                      <button
                        onClick={handleInvite}
                        disabled={inviting}
                        className="gradient-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1 shrink-0 disabled:opacity-50"
                      >
                        {inviting ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />} Invite
                      </button>
                    </div>
                  )}
                </div>
              </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </Portal>
    </div>
  );
}
