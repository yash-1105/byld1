import { useState } from 'react';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, HardHat, User, Briefcase, ArrowRight } from 'lucide-react';

const roles: { role: UserRole; label: string; icon: React.ElementType; desc: string; stat: string }[] = [
  { role: 'architect', label: 'Architect', icon: Building2, desc: 'Full project control, design management, and team coordination', stat: 'Full Access' },
  { role: 'contractor', label: 'Contractor', icon: HardHat, desc: 'Task execution, site updates, and progress reporting', stat: 'Task Focus' },
  { role: 'client', label: 'Client', icon: User, desc: 'Project overview, budget tracking, and approval decisions', stat: 'Approvals' },
  { role: 'consultant', label: 'Consultant', icon: Briefcase, desc: 'Consultation requests, expert advice, and file sharing', stat: 'Advisory' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (!selected) return;
    setLoading(true);
    setTimeout(() => {
      login(selected);
      navigate('/dashboard');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-background noise-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" style={{ animation: 'morph-blob 12s ease-in-out infinite' }} />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-warning/5 rounded-full blur-[100px]" style={{ animation: 'morph-blob 15s ease-in-out infinite reverse' }} />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg relative"
      >
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: 'spring' }}
            className="inline-flex items-center gap-2.5 mb-4"
          >
            <div className="w-11 h-11 gradient-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-foreground">BYLD</span>
          </motion.div>
          <p className="text-muted-foreground text-sm">Select your role to continue</p>
        </div>

        <div className="space-y-3">
          {roles.map((r, i) => (
            <motion.button
              key={r.role}
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.08, type: 'spring', stiffness: 200 }}
              onClick={() => setSelected(r.role)}
              whileHover={{ x: 4 }}
              className={`w-full p-5 rounded-2xl border text-left transition-all duration-300 flex items-center gap-4 ${
                selected === r.role
                  ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                  : 'border-border bg-card hover:border-primary/30 hover:shadow-md'
              }`}
            >
              <motion.div
                animate={{ rotate: selected === r.role ? 8 : 0 }}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  selected === r.role ? 'gradient-primary shadow-md shadow-primary/20' : 'bg-muted'
                }`}
              >
                <r.icon className={`w-5 h-5 ${selected === r.role ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
              </motion.div>
              <div className="flex-1">
                <div className="font-semibold text-foreground flex items-center gap-2">
                  {r.label}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${selected === r.role ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{r.stat}</span>
                </div>
                <div className="text-sm text-muted-foreground mt-0.5">{r.desc}</div>
              </div>
              {selected === r.role && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center shadow-sm shadow-primary/20"
                >
                  <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>

        <motion.button
          onClick={handleLogin}
          disabled={!selected || loading}
          className={`w-full mt-8 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
            selected ? 'gradient-primary text-primary-foreground hover:opacity-90 shadow-xl shadow-primary/20' : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
          whileTap={selected ? { scale: 0.98 } : undefined}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              Signing in...
            </span>
          ) : (
            <>Continue <ArrowRight className="w-4 h-4" /></>
          )}
        </motion.button>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Demo mode — no credentials required
        </p>
      </motion.div>
    </div>
  );
}
