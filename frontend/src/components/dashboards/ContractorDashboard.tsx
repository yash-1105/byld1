import { useData } from '@/contexts/DataContext';
import { motion } from 'framer-motion';
import { CheckSquare, Clock, AlertTriangle, Camera } from 'lucide-react';
import { Link } from 'react-router-dom';

const fadeIn = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

export default function ContractorDashboard() {
  const { tasks, siteUpdates } = useData();
  const myTasks = tasks.filter(t => t.assignee === 'Mike Johnson');
  const pending = myTasks.filter(t => t.status !== 'done').length;
  const urgent = myTasks.filter(t => t.priority === 'urgent').length;
  const done = myTasks.filter(t => t.status === 'done').length;

  const stats = [
    { label: 'Pending Tasks', value: pending, icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
    { label: 'Urgent', value: urgent, icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' },
    { label: 'Completed', value: done, icon: CheckSquare, color: 'text-success', bg: 'bg-success/10' },
    { label: 'Site Updates', value: siteUpdates.length, icon: Camera, color: 'text-primary', bg: 'bg-primary/10' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Contractor Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Your assigned tasks and site updates</p>
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">My Tasks</h3>
          <Link to="/tasks" className="text-sm text-primary hover:underline">View all</Link>
        </div>
        <div className="space-y-2">
          {myTasks.filter(t => t.status !== 'done').map(t => (
            <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
              <div className={`w-2 h-2 rounded-full ${t.priority === 'urgent' ? 'bg-destructive' : t.priority === 'high' ? 'bg-warning' : 'bg-primary'}`} />
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">{t.title}</div>
                <div className="text-xs text-muted-foreground">Due {new Date(t.deadline).toLocaleDateString()}</div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                t.status === 'in_progress' ? 'bg-primary/10 text-primary' : t.status === 'review' ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground'
              }`}>
                {t.status.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div {...fadeIn} transition={{ delay: 0.3 }} className="glass-card p-5">
        <h3 className="font-semibold text-foreground mb-4">Recent Site Updates</h3>
        <div className="space-y-3">
          {siteUpdates.slice(0, 3).map(u => (
            <div key={u.id} className="p-3 rounded-lg hover:bg-muted transition-colors">
              <div className="text-sm font-medium text-foreground">{u.title}</div>
              <div className="text-xs text-muted-foreground mt-1">{u.description.slice(0, 100)}...</div>
              <div className="text-xs text-muted-foreground mt-1">{new Date(u.createdAt).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
