import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FolderKanban, CheckSquare, Camera, FileText,
  DollarSign, Users, MessageSquare, Bot, Bell, Settings, ChevronLeft,
  ChevronRight, Building2, LogOut, ClipboardCheck, HelpCircle, Calendar
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  roles: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['architect', 'contractor', 'client', 'consultant'] },
  { label: 'Projects', icon: FolderKanban, path: '/projects', roles: ['architect', 'client'] },
  { label: 'Tasks', icon: CheckSquare, path: '/tasks', roles: ['architect', 'contractor'] },
  { label: 'Site Updates', icon: Camera, path: '/site-updates', roles: ['architect', 'contractor', 'client'] },
  { label: 'Documents', icon: FileText, path: '/documents', roles: ['architect', 'contractor', 'client'] },
  { label: 'Budget', icon: DollarSign, path: '/budget', roles: ['architect', 'client'] },
  { label: 'Approvals', icon: ClipboardCheck, path: '/approvals', roles: ['architect', 'client'] },
  { label: 'Team', icon: Users, path: '/team', roles: ['architect'] },
  { label: 'Calendar', icon: Calendar, path: '/calendar', roles: ['architect', 'contractor', 'client'] },
  { label: 'Chat', icon: MessageSquare, path: '/chat', roles: ['architect', 'contractor', 'client', 'consultant'] },
  { label: 'Consultations', icon: HelpCircle, path: '/consultations', roles: ['architect', 'consultant'] },
  { label: 'Notifications', icon: Bell, path: '/notifications', roles: ['architect', 'contractor', 'client', 'consultant'] },
  { label: 'Settings', icon: Settings, path: '/settings', roles: ['architect', 'contractor', 'client', 'consultant'] },
];

export default function AppSidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;

  const filteredNav = navItems.filter(item => item.roles.includes(user.role));

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="h-screen bg-card border-r border-border flex flex-col sticky top-0 z-30 overflow-hidden"
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-border/60">
        <motion.div
          whileHover={{ rotate: 8, scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-primary/15"
        >
          <Building2 className="w-4 h-4 text-primary-foreground" />
        </motion.div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="ml-3 font-bold text-lg tracking-tight text-foreground"
            >
              BYLD
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {filteredNav.map(item => {
          const active = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              }`}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary"
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                />
              )}
              <item.icon className={`w-[18px] h-[18px] flex-shrink-0 transition-colors ${active ? 'text-primary' : 'group-hover:text-foreground'}`} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* User + Collapse */}
      <div className="p-3 border-t border-border/60 space-y-2">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-xs font-semibold text-primary-foreground flex-shrink-0 shadow-sm shadow-primary/15">
            {user.avatar}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">{user.name}</div>
                <div className="text-xs text-muted-foreground capitalize">{user.role}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex gap-1">
          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors flex-1"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
          <button
            onClick={() => setCollapsed(c => !c)}
            className="p-2 rounded-xl text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
