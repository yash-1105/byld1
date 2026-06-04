import { useState } from 'react';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, HardHat, User, Briefcase, ArrowRight, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const roles: { role: UserRole; label: string; icon: React.ElementType; desc: string; stat: string }[] = [
  { role: 'architect', label: 'Architect', icon: Building2, desc: 'Full project control', stat: 'Full Access' },
  { role: 'contractor', label: 'Contractor', icon: HardHat, desc: 'Task execution & updates', stat: 'Task Focus' },
  { role: 'client', label: 'Client', icon: User, desc: 'Project overview & approvals', stat: 'Approvals' },
  { role: 'consultant', label: 'Consultant', icon: Briefcase, desc: 'Expert advice & sharing', stat: 'Advisory' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [selectedRole, setSelectedRole] = useState<UserRole>('client');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/dashboard');
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        if (data.user) {
          const { error: profileError } = await supabase.from('users').insert({
            id: data.user.id,
            email,
            full_name: name,
            role: selectedRole,
          });
          
          // If a trigger already created the row (duplicate key), update it instead
          if (profileError && profileError.code === '23505') {
            const { error: updateError } = await supabase.from('users').update({
              full_name: name,
              role: selectedRole,
            }).eq('id', data.user.id);
            if (updateError) console.error('Failed to update trigger-created profile:', updateError);
          } else if (profileError) {
            console.error('Profile creation error:', profileError);
            // Don't throw, let them proceed to dashboard even if profile fails
          }
        }
        
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setErrorMsg(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background noise-bg flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" style={{ animation: 'morph-blob 12s ease-in-out infinite' }} />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-warning/5 rounded-full blur-[100px]" style={{ animation: 'morph-blob 15s ease-in-out infinite reverse' }} />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative bg-card p-8 rounded-3xl border shadow-xl z-10"
      >
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-6 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to home
        </Link>
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <img src="/images/byld-logo.jpeg" alt="BYLD" className="w-11 h-11 rounded-xl object-cover shadow-lg shadow-primary/20" />
            <span className="text-2xl tracking-[0.2em] text-foreground" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 300 }}>BYLD</span>
          </div>
          <p className="text-muted-foreground text-sm">
            {isLogin ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <AnimatePresence>
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 overflow-hidden"
              >
                <div>
                  <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Full Name</label>
                  <input
                    type="text"
                    required={!isLogin}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    placeholder="John Doe"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block text-muted-foreground">Select Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    {roles.map((r) => (
                      <button
                        key={r.role}
                        type="button"
                        onClick={() => setSelectedRole(r.role)}
                        className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                          selectedRole === r.role 
                          ? 'border-primary bg-primary/5 text-primary' 
                          : 'border-border hover:border-primary/30'
                        }`}
                      >
                        <r.icon className="w-4 h-4" />
                        <span className="text-xs font-semibold">{r.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none"
              placeholder="you@example.com"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none"
              placeholder="••••••••"
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm font-medium text-center">
              {errorMsg}
            </div>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 gradient-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20 disabled:opacity-50"
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                Processing...
              </span>
            ) : (
              <>{isLogin ? 'Sign In' : 'Create Account'} <ArrowRight className="w-4 h-4" /></>
            )}
          </motion.button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
