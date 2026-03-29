import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Search, Bell, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function TopNavbar() {
  const { user } = useAuth();
  const { notifications, markNotificationRead, markAllNotificationsRead, projects, tasks } = useData();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const searchResults = searchQuery.length > 1 ? [
    ...projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(p => ({ type: 'Project' as const, label: p.name, path: '/projects' })),
    ...tasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase())).map(t => ({ type: 'Task' as const, label: t.title, path: '/tasks' })),
  ].slice(0, 6) : [];

  if (!user) return null;

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-foreground capitalize">
          {user.role} Portal
        </h2>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative">
          <button
            onClick={() => setSearchOpen(o => !o)}
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>
          <AnimatePresence>
            {searchOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, width: 200 }}
                animate={{ opacity: 1, y: 0, width: 320 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute right-0 top-12 bg-card rounded-xl border border-border shadow-lg overflow-hidden"
              >
                <div className="flex items-center px-4 py-3 border-b border-border">
                  <Search className="w-4 h-4 text-muted-foreground mr-2" />
                  <input
                    ref={searchRef}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search projects, tasks..."
                    className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  />
                  <button onClick={() => { setSearchOpen(false); setSearchQuery(''); }} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {searchResults.length > 0 && (
                  <div className="py-2">
                    {searchResults.map((r, i) => (
                      <Link
                        key={i}
                        to={r.path}
                        onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors"
                      >
                        <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-primary/10 text-primary">{r.type}</span>
                        <span className="text-sm text-foreground">{r.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
                {searchQuery.length > 1 && searchResults.length === 0 && (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">No results found</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(o => !o)}
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute right-0 top-12 w-80 bg-card rounded-xl border border-border shadow-lg overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <span className="font-semibold text-sm text-foreground">Notifications</span>
                  <button onClick={markAllNotificationsRead} className="text-xs text-primary hover:underline">Mark all read</button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.slice(0, 5).map(n => (
                    <button
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`w-full text-left px-4 py-3 hover:bg-muted transition-colors border-b border-border last:border-0 ${!n.read ? 'bg-primary/5' : ''}`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                          n.type === 'error' ? 'bg-destructive' : n.type === 'warning' ? 'bg-warning' : n.type === 'success' ? 'bg-success' : 'bg-primary'
                        }`} />
                        <div>
                          <div className="text-sm font-medium text-foreground">{n.title}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{n.message}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <Link
                  to="/notifications"
                  onClick={() => setNotifOpen(false)}
                  className="block text-center py-3 text-xs text-primary hover:bg-muted transition-colors border-t border-border"
                >
                  View all notifications
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-xs font-semibold text-primary-foreground">
          {user.avatar}
        </div>
      </div>
    </header>
  );
}
