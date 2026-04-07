import { useData } from '@/contexts/DataContext';
import { motion } from 'framer-motion';
import { Bell, CheckCheck } from 'lucide-react';

export default function NotificationsPage() {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useData();

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">{notifications.filter(n => !n.read).length} unread</p>
        </div>
        <button onClick={markAllNotificationsRead} className="text-sm text-primary hover:underline flex items-center gap-1">
          <CheckCheck className="w-4 h-4" /> Mark all read
        </button>
      </div>

      <div className="space-y-2">
        {notifications.map((n, i) => (
          <motion.button
            key={n.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => markNotificationRead(n.id)}
            className={`w-full text-left glass-card p-4 transition-all hover:shadow-md ${!n.read ? 'border-l-2 border-l-primary' : ''}`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                n.type === 'error' ? 'bg-destructive/10' : n.type === 'warning' ? 'bg-warning/10' : n.type === 'success' ? 'bg-success/10' : 'bg-primary/10'
              }`}>
                <Bell className={`w-4 h-4 ${
                  n.type === 'error' ? 'text-destructive' : n.type === 'warning' ? 'text-warning' : n.type === 'success' ? 'text-success' : 'text-primary'
                }`} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">{n.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{n.message}</div>
                <div className="text-xs text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleString()}</div>
              </div>
              {!n.read && <div className="w-2 h-2 rounded-full bg-primary mt-2" />}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
