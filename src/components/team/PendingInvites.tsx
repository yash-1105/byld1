import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Mail, Loader2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const roleColors: Record<string, string> = {
  architect: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  client: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  contractor: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  consultant: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
};

interface PendingInvite {
  id: string;
  project_id: string;
  role: string;
  status: string;
  created_at: string;
  invited_by: string | null;
  project: { name: string } | null;
  inviter: { full_name: string | null } | null;
}

export default function PendingInvites({ highlightId }: { highlightId?: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: invites = [] } = useQuery({
    queryKey: ['team_invitations', 'pending', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_invitations')
        .select(`
          id, project_id, role, status, created_at, invited_by,
          project:projects!team_invitations_project_id_fkey(name),
          inviter:users!team_invitations_invited_by_fkey(full_name)
        `)
        .eq('invited_user_id', user!.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      // Swallow "table does not exist" so the page still renders before the migration is applied.
      if (error && (error as { code?: string }).code !== '42P01') throw error;
      return (data || []) as unknown as PendingInvite[];
    },
    enabled: !!user?.id,
  });

  // Deep-link from the invite email (/team?invite=<id>) — scroll the panel into view when
  // the highlighted invite is present and still pending.
  useEffect(() => {
    if (highlightId && invites.some(i => i.id === highlightId)) {
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [highlightId, invites]);

  const handleAccept = async (invite: PendingInvite) => {
    if (!user?.id) return;
    setRespondingId(invite.id);
    try {
      // Membership is only written on acceptance — same shape as the old handleAdd insert.
      const { error: memberError } = await supabase.from('project_members').insert({
        project_id: invite.project_id,
        user_id: user.id,
        role: invite.role,
      });
      if (memberError) throw memberError;
      const { error: updateError } = await supabase
        .from('team_invitations')
        .update({ status: 'accepted', responded_at: new Date().toISOString() })
        .eq('id', invite.id);
      if (updateError) throw updateError;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['project_members'] }),
        queryClient.invalidateQueries({ queryKey: ['team_invitations'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications'] }),
      ]);
      toast.success(`Joined ${invite.project?.name || 'the project'}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to accept invite');
    } finally {
      setRespondingId(null);
    }
  };

  const handleDecline = async (invite: PendingInvite) => {
    setRespondingId(invite.id);
    try {
      const { error } = await supabase
        .from('team_invitations')
        .update({ status: 'declined', responded_at: new Date().toISOString() })
        .eq('id', invite.id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ['team_invitations'] });
      toast.success('Invitation declined');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to decline invite');
    } finally {
      setRespondingId(null);
    }
  };

  if (invites.length === 0) return null;

  return (
    <div ref={containerRef} className="space-y-2.5">
      <div className="flex items-center gap-2">
        <Mail className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">
          Pending Invitations <span className="text-muted-foreground font-normal">({invites.length})</span>
        </h2>
      </div>
      <AnimatePresence initial={false}>
        {invites.map(invite => {
          const inviterName = invite.inviter?.full_name || 'A team member';
          const projectName = invite.project?.name || 'a project';
          const roleColor = roleColors[invite.role] || 'bg-muted text-muted-foreground border-border';
          const isResponding = respondingId === invite.id;
          const isHighlighted = highlightId === invite.id;
          return (
            <motion.div
              key={invite.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border p-4 ${
                isHighlighted ? 'border-primary/50 bg-primary/5 ring-2 ring-primary/20' : 'border-border/60 bg-card'
              }`}
            >
              <p className="text-sm text-foreground">
                <span className="font-semibold">{inviterName}</span> invited you to join{' '}
                <span className="font-semibold">{projectName}</span> as a{' '}
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium border capitalize ${roleColor}`}>{invite.role}</span>
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleAccept(invite)}
                  disabled={isResponding}
                  className="gradient-primary text-primary-foreground px-4 py-2 rounded-lg text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isResponding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Accept
                </button>
                <button
                  onClick={() => handleDecline(invite)}
                  disabled={isResponding}
                  className="px-4 py-2 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <X className="w-3.5 h-3.5" /> Decline
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
