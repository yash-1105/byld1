import { useData } from '@/contexts/DataContext';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Camera, ClipboardCheck } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Link } from 'react-router-dom';

const fadeIn = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

export default function ClientDashboard() {
  const { projects, siteUpdates, budgetItems } = useData();
  const mainProject = projects[0];
  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const totalSpent = projects.reduce((s, p) => s + p.spent, 0);

  const stats = [
    { label: 'Overall Progress', value: `${mainProject.progress}%`, icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Budget Spent', value: `$${(totalSpent / 1000000).toFixed(1)}M`, icon: DollarSign, color: 'text-warning', bg: 'bg-warning/10' },
    { label: 'Site Updates', value: siteUpdates.length, icon: Camera, color: 'text-success', bg: 'bg-success/10' },
    { label: 'Pending Approvals', value: 2, icon: ClipboardCheck, color: 'text-destructive', bg: 'bg-destructive/10' },
  ];

  const budgetData = [
    { name: 'Spent', value: totalSpent },
    { name: 'Remaining', value: totalBudget - totalSpent },
  ];
  const colors = ['#F59E0B', '#E5E7EB'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Project Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">Track your construction projects at a glance</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div {...fadeIn} transition={{ delay: 0.2 }} className="glass-card p-5">
          <h3 className="font-semibold text-foreground mb-4">Project Progress</h3>
          {projects.slice(0, 3).map(p => (
            <div key={p.id} className="mb-4">
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-medium text-foreground">{p.name}</span>
                <span className="text-muted-foreground">{p.progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${p.progress}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="h-full rounded-full gradient-primary"
                />
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div {...fadeIn} transition={{ delay: 0.25 }} className="glass-card p-5">
          <h3 className="font-semibold text-foreground mb-4">Budget Allocation</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={budgetData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                {budgetData.map((_, i) => <Cell key={i} fill={colors[i]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => `$${(v / 1000000).toFixed(1)}M`} contentStyle={{ borderRadius: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="text-center text-sm text-muted-foreground">
            ${(totalSpent / 1000000).toFixed(1)}M of ${(totalBudget / 1000000).toFixed(1)}M spent
          </div>
        </motion.div>
      </div>

      <motion.div {...fadeIn} transition={{ delay: 0.3 }} className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Latest Updates</h3>
          <Link to="/site-updates" className="text-sm text-primary hover:underline">View all</Link>
        </div>
        <div className="space-y-3">
          {siteUpdates.slice(0, 3).map(u => (
            <div key={u.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
              <div className={`w-2 h-2 rounded-full mt-2 ${u.type === 'milestone' ? 'bg-success' : u.type === 'issue' ? 'bg-destructive' : 'bg-primary'}`} />
              <div>
                <div className="text-sm font-medium text-foreground">{u.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{new Date(u.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
