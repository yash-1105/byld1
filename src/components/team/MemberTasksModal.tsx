import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, CheckSquare, CalendarDays } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import AvailabilityDot, { type AvailabilityStatus } from './AvailabilityDot';
import type { Task, Project } from '@/data/mockData';
import Portal from '@/components/ui/portal';

interface MemberUser {
  id: string;
  full_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  role: string;
  availability_status?: string | null;
}

const roleColors: Record<string, string> = {
  architect: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  client: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  contractor: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  consultant: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
};

// Status labels + pill colors mirror TasksPage.tsx's column semantics (todo→muted, in_progress→primary,
// review→warning, done→success). Ordered so the flat list reads todo → done.
const STATUS_META: { key: Task['status']; label: string; cls: string }[] = [
  { key: 'todo', label: 'To Do', cls: 'bg-muted text-muted-foreground' },
  { key: 'in_progress', label: 'In Progress', cls: 'bg-primary/10 text-primary' },
  { key: 'review', label: 'Review', cls: 'bg-warning/10 text-warning' },
  { key: 'done', label: 'Done', cls: 'bg-success/10 text-success' },
];

const statusOrder: Record<string, number> = { todo: 0, in_progress: 1, review: 2, done: 3 };

// Priority pill colors — identical mapping to TasksPage.tsx.
const priorityColors: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-primary/10 text-primary',
  high: 'bg-warning/10 text-warning',
  urgent: 'bg-destructive/10 text-destructive',
};

export default function MemberTasksModal({
  member,
  tasks,
  projects,
  activeProjectId,
  onClose,
}: {
  member: MemberUser;
  tasks: Task[];
  projects: Project[];
  activeProjectId: string;
  onClose: () => void;
}) {
  const name = member.full_name || member.email || 'Unknown';
  const roleColor = roleColors[member.role] || 'bg-muted text-muted-foreground border-border';
  const showProjectName = activeProjectId === 'all';

  const memberTasks = useMemo(() => {
    return tasks
      .filter(t => t.assignee === member.id)
      .filter(t => activeProjectId === 'all' || t.projectId === activeProjectId)
      .sort((a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9));
  }, [tasks, member.id, activeProjectId]);

  const projectName = (id: string) => projects.find(p => p.id === id)?.name || 'Unknown project';

  return (
    <Portal>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col"
      >
        {/* Header — reuses the member-card avatar/name/role styling */}
        <div className="flex items-center justify-between p-5 border-b border-border/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              {member.avatar_url ? (
                <img src={member.avatar_url} alt={name} className="w-11 h-11 rounded-full object-cover" />
              ) : (
                <div className="w-11 h-11 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground shadow-sm">
                  {getInitials(member.full_name || member.email)}
                </div>
              )}
              <AvailabilityDot
                status={(member.availability_status as AvailabilityStatus) || 'available'}
                className="absolute -bottom-0.5 -right-0.5"
              />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-foreground truncate">{name}</div>
              <span className={`mt-0.5 inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-medium border capitalize ${roleColor}`}>
                {member.role}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Task list */}
        <div className="p-4 overflow-y-auto flex-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Assigned Tasks ({memberTasks.length})
          </p>

          {memberTasks.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <CheckSquare className="w-9 h-9 mx-auto mb-3 opacity-25" />
              <p className="text-sm">No tasks currently assigned to {name}.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {memberTasks.map(t => {
                const status = STATUS_META.find(s => s.key === t.status);
                return (
                  <div key={t.id} className="bg-card border border-border/40 p-4 rounded-xl">
                    <div className="text-sm font-medium text-foreground">{t.title}</div>
                    <div className="flex items-center gap-2 flex-wrap mt-2.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${status?.cls || 'bg-muted text-muted-foreground'}`}>
                        {status?.label || t.status}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${priorityColors[t.priority] || priorityColors.medium}`}>
                        {t.priority}
                      </span>
                      {showProjectName && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">
                          {projectName(t.projectId)}
                        </span>
                      )}
                    </div>
                    {t.deadline && (
                      <div className="text-[10px] text-muted-foreground mt-2.5 border-t border-border/30 pt-2 flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        Due {new Date(t.deadline).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
    </Portal>
  );
}
