import { useNavigate } from 'react-router-dom';
import { Search, Bell, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useActiveProject } from '@/contexts/ActiveProjectContext';
import BrandLogo from '@/components/BrandLogo';
import { C, ProjectSwitcher } from '@/components/dashboards/bento/BentoKit';

export default function BentoTopBar({ onOpenSearch }: { onOpenSearch: () => void }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { projects, notifications } = useData();
  const { activeProjectId, setActiveProjectId } = useActiveProject();
  if (!user) return null;

  const unread = notifications.filter(n => !n.read).length;

  return (
    <header className="lg-nav h-[62px] flex items-center justify-between gap-4 px-4 sm:px-[22px] sticky top-0 z-30">
      {/* left: logo + role */}
      <div className="flex items-center gap-5 min-w-0">
        <BrandLogo size="lg" />
        <div className="hidden sm:block w-px h-[22px]" style={{ background: C.hairStrong }} />
        <span className="hidden sm:inline font-mono text-[11px] uppercase tracking-[0.08em]" style={{ color: C.faint }}>
          {user.role}
        </span>
      </div>

      {/* center: project switcher */}
      <div className="hidden md:flex flex-1 justify-center">
        <ProjectSwitcher value={activeProjectId} onChange={setActiveProjectId} projects={projects} />
      </div>

      {/* right: search · bell · avatar */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenSearch}
          aria-label="Search"
          className="flex items-center justify-center gap-2 rounded-[9px] w-9 h-9 sm:w-auto sm:h-auto sm:px-[11px] sm:py-2"
          style={{ background: C.surface, border: `1px solid ${C.hairStrong}`, color: C.mono }}
        >
          <Search size={15} />
          <span className="hidden sm:inline font-body text-[12px]" style={{ color: C.faint2 }}>Search</span>
          <span className="hidden sm:inline font-mono text-[10px] px-[5px] py-px rounded-[4px]" style={{ background: C.tint, color: C.mono }}>⌘K</span>
        </button>

        <button
          onClick={() => navigate('/settings')}
          aria-label="Settings"
          className="w-9 h-9 rounded-[9px] flex items-center justify-center"
          style={{ border: `1px solid ${C.hairStrong}`, color: C.muted }}
        >
          <Settings size={16} />
        </button>

        <button
          onClick={() => navigate('/notifications')}
          aria-label="Notifications"
          className="relative w-9 h-9 rounded-[9px] flex items-center justify-center"
          style={{ border: `1px solid ${C.hairStrong}`, color: C.muted }}
        >
          <Bell size={16} />
          {unread > 0 && (
            <span
              className="absolute -top-[5px] -right-[5px] min-w-[16px] h-4 px-[3px] rounded-lg flex items-center justify-center font-mono text-[9px] font-semibold"
              style={{ background: C.sage, color: C.white }}
            >
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </button>

        <button
          onClick={() => navigate('/settings')}
          aria-label="Account"
          className="w-9 h-9 rounded-[9px] flex items-center justify-center font-display font-semibold text-[12px] overflow-hidden"
          style={{ background: C.ink, color: C.onDarkText }}
        >
          {user.avatarUrl
            ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            : (user.avatar || user.name?.slice(0, 2) || 'U').toUpperCase()}
        </button>
      </div>
    </header>
  );
}
