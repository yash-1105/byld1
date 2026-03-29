import { useState } from 'react';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, HardHat, User, Briefcase } from 'lucide-react';

const roles: { role: UserRole; label: string; icon: React.ElementType; desc: string }[] = [
  { role: 'architect', label: 'Architect', icon: Building2, desc: 'Full project control, design management, and team coordination' },
  { role: 'contractor', label: 'Contractor', icon: HardHat, desc: 'Task execution, site updates, and progress reporting' },
  { role: 'client', label: 'Client', icon: User, desc: 'Project overview, budget tracking, and approval decisions' },
  { role: 'consultant', label: 'Consultant', icon: Briefcase, desc: 'Consultation requests, expert advice, and file sharing' },
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-foreground">BYLD</span>
          </div>
          <p className="text-muted-foreground">Select your role to continue</p>
        </div>

        <div className="space-y-3">
          {roles.map((r, i) => (
            <motion.button
              key={r.role}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => setSelected(r.role)}
              className={`w-full p-4 rounded-xl border text-left transition-all duration-200 flex items-center gap-4 ${
                selected === r.role
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-border bg-card hover:border-primary/30 hover:shadow-sm'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                selected === r.role ? 'gradient-primary' : 'bg-muted'
              }`}>
                <r.icon className={`w-5 h-5 ${selected === r.role ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-foreground">{r.label}</div>
                <div className="text-sm text-muted-foreground">{r.desc}</div>
              </div>
              {selected === r.role && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-5 h-5 rounded-full gradient-primary flex items-center justify-center"
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
          className={`w-full mt-6 py-3 rounded-xl font-semibold text-primary-foreground transition-all duration-200 ${
            selected ? 'gradient-primary hover:opacity-90 shadow-lg' : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
          whileTap={selected ? { scale: 0.98 } : undefined}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              Signing in...
            </span>
          ) : 'Continue'}
        </motion.button>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Demo mode — no credentials required
        </p>
      </motion.div>
    </div>
  );
}
