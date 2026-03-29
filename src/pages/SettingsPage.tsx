import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Shield, Palette } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState({ email: true, push: true, updates: false });

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account preferences</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <User className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Profile</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-lg font-bold text-primary-foreground">{user.avatar}</div>
            <div>
              <div className="font-semibold text-foreground">{user.name}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
              <div className="text-xs text-primary capitalize mt-0.5">{user.role}</div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Notifications</h3>
        </div>
        <div className="space-y-3">
          {[
            { key: 'email', label: 'Email notifications' },
            { key: 'push', label: 'Push notifications' },
            { key: 'updates', label: 'Product updates' },
          ].map(item => (
            <label key={item.key} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer">
              <span className="text-sm text-foreground">{item.label}</span>
              <button
                onClick={() => {
                  setNotifications(n => ({ ...n, [item.key]: !n[item.key as keyof typeof n] }));
                  toast.success('Preference updated');
                }}
                className={`w-10 h-5 rounded-full transition-colors relative ${notifications[item.key as keyof typeof notifications] ? 'bg-primary' : 'bg-border'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-card absolute top-0.5 transition-all ${notifications[item.key as keyof typeof notifications] ? 'left-5' : 'left-0.5'}`} />
              </button>
            </label>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Security</h3>
        </div>
        <button onClick={() => toast.info('Password change is a demo feature')} className="text-sm text-primary hover:underline">Change password</button>
      </motion.div>
    </div>
  );
}
