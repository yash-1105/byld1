import { motion } from 'framer-motion';
import { teamMembers } from '@/data/mockData';
import { Mail, Briefcase } from 'lucide-react';

export default function TeamPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Team</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your project team members</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teamMembers.map((m, i) => (
          <motion.div key={m.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card-hover p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                {m.avatar}
              </div>
              <div>
                <div className="font-semibold text-foreground">{m.name}</div>
                <div className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                  <Briefcase className="w-3 h-3" /> {m.role}
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="w-3 h-3" /> {m.email}
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {m.projects.map(p => (
                <span key={p} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{p}</span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
