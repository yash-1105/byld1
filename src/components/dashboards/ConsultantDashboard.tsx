import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { MessageSquare, FileText, Clock, CheckCircle } from 'lucide-react';

const fadeIn = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

export default function ConsultantDashboard() {
  const { tasks, projects } = useData();
  const { user } = useAuth();

  // "Consultation Requests" are just tasks assigned to the Consultant
  const myTasks = tasks.filter(t => t.assignee === user?.id);
  const activeRequests = myTasks.filter(t => t.status === 'todo' || t.status === 'in_progress').length;
  const pendingReview = myTasks.filter(t => t.status === 'review').length;
  const completed = myTasks.filter(t => t.status === 'done').length;

  const stats = [
    { label: 'Active Requests', value: activeRequests, icon: MessageSquare, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Pending Review', value: pendingReview, icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
    { label: 'Completed', value: completed, icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
    { label: 'Shared Files', value: 0, icon: FileText, color: 'text-primary', bg: 'bg-primary/10' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Consultant Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your assigned consultation requests and tasks</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} {...fadeIn} transition={{ delay: i * 0.05 }} className="glass-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div {...fadeIn} transition={{ delay: 0.2 }} className="glass-card p-5">
        <h3 className="font-semibold text-foreground mb-4">Consultation Requests</h3>
        <div className="space-y-2">
          {myTasks.length > 0 ? myTasks.map(t => {
            const project = projects.find(p => p.id === t.projectId);
            return (
              <div key={t.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
                <div className={`w-2 h-2 rounded-full ${t.status === 'done' ? 'bg-success' : t.status === 'review' ? 'bg-warning' : 'bg-primary'}`} />
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">{t.title}</div>
                  <div className="text-xs text-muted-foreground">{project?.name || 'Unknown Project'}</div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${
                  t.status === 'done' ? 'bg-success/10 text-success' : t.status === 'review' ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary'
                }`}>{t.status.replace('_', ' ')}</span>
                <span className="text-xs text-muted-foreground">{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'N/A'}</span>
              </div>
            );
          }) : (
            <div className="text-sm text-muted-foreground py-6 text-center border border-border border-dashed rounded-lg">
              No consultation requests assigned to you yet.
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
