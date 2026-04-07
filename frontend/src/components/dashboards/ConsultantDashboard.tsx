import { motion } from 'framer-motion';
import { MessageSquare, FileText, Clock, CheckCircle } from 'lucide-react';

const fadeIn = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

const consultations = [
  { id: '1', project: 'Harbor View Residences', topic: 'Structural Assessment', status: 'pending', date: '2025-03-28' },
  { id: '2', project: 'Green Valley Mall', topic: 'Environmental Compliance', status: 'in_progress', date: '2025-03-25' },
  { id: '3', project: 'Skyline Tower', topic: 'Facade Materials Review', status: 'completed', date: '2025-03-20' },
];

export default function ConsultantDashboard() {
  const stats = [
    { label: 'Active Requests', value: 2, icon: MessageSquare, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Pending Review', value: 1, icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
    { label: 'Completed', value: 5, icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
    { label: 'Shared Files', value: 12, icon: FileText, color: 'text-primary', bg: 'bg-primary/10' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Consultant Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage consultation requests and communications</p>
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
          {consultations.map(c => (
            <div key={c.id} className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted transition-colors">
              <div className={`w-2 h-2 rounded-full ${c.status === 'completed' ? 'bg-success' : c.status === 'pending' ? 'bg-warning' : 'bg-primary'}`} />
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">{c.topic}</div>
                <div className="text-xs text-muted-foreground">{c.project}</div>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${
                c.status === 'completed' ? 'bg-success/10 text-success' : c.status === 'pending' ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary'
              }`}>{c.status.replace('_', ' ')}</span>
              <span className="text-xs text-muted-foreground">{new Date(c.date).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
