import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LayoutPanelLeft } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useActiveProject } from '@/contexts/ActiveProjectContext';
import { C, ProjectSwitcher } from '@/components/dashboards/bento/BentoKit';
import { navForRole } from './navConfig';

const isActive = (pathname: string, path: string) =>
  pathname === path || (path !== '/dashboard' && pathname.startsWith(path));

export default function BentoModuleRail() {
  const { user } = useAuth();
  const { projects } = useData();
  const { activeProjectId, setActiveProjectId } = useActiveProject();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  if (!user) return null;

  const nav = navForRole(user.role);
  const primary = nav.filter(n => n.primary);
  const overflow = nav.filter(n => !n.primary && !n.corner);
  const overflowActive = overflow.some(n => isActive(location.pathname, n.path));

  return (
    <nav className="lg-nav flex items-center gap-[3px] px-3 sm:px-[18px] py-[7px] sticky top-[62px] z-20 overflow-x-auto no-scrollbar">
      {/* mobile: all-modules bottom sheet (the pill rail scrolls, but this makes
          every module + the project switcher reachable without hunting) */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetTrigger asChild>
          <button
            aria-label="All modules"
            className="md:hidden flex items-center justify-center w-[34px] h-[31px] rounded-lg shrink-0 sticky left-0 z-10"
            style={{ background: C.surface, border: `1px solid ${C.hairStrong}`, color: C.muted }}
          >
            <LayoutPanelLeft size={15} />
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto pb-[calc(20px+env(safe-area-inset-bottom))]">
          <SheetHeader className="text-left">
            <SheetTitle className="font-display text-[15px]">Modules</SheetTitle>
          </SheetHeader>
          <div className="mt-3 mb-4">
            <ProjectSwitcher value={activeProjectId} onChange={setActiveProjectId} projects={projects} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {nav.filter(n => !n.corner).map(item => {
              const active = isActive(location.pathname, item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => { setMenuOpen(false); navigate(item.path); }}
                  className="flex flex-col items-center gap-1.5 rounded-xl py-3.5 px-2"
                  style={active
                    ? { background: C.ink, color: C.onDarkText }
                    : { background: C.surface, border: `1px solid ${C.hairSoft}`, color: C.muted }}
                >
                  <item.icon size={18} />
                  <span className="font-body font-medium text-[11.5px] leading-tight text-center">{item.label}</span>
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      {primary.map(item => {
        const active = isActive(location.pathname, item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            className="flex items-center gap-[7px] px-[11px] py-[7px] rounded-lg shrink-0 transition-colors"
            style={active
              ? { background: C.ink, color: C.onDarkText }
              : { color: C.muted, background: 'transparent' }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(74,93,64,0.07)'; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
          >
            <item.icon size={15} />
            <span className="font-body font-medium text-[12.5px] whitespace-nowrap">{item.label}</span>
          </Link>
        );
      })}

      {overflow.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-[7px] px-[11px] py-[7px] rounded-lg shrink-0 ml-auto transition-colors"
              style={overflowActive ? { background: C.ink, color: C.onDarkText } : { color: C.muted }}
            >
              <span className="font-body font-medium text-[12.5px]">More</span>
              <ChevronDown size={14} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[200px]">
            {overflow.map(item => (
              <DropdownMenuItem
                key={item.path}
                onClick={() => navigate(item.path)}
                className="gap-2.5 cursor-pointer font-body text-[13px]"
              >
                <item.icon size={15} style={{ color: C.muted }} />
                {item.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </nav>
  );
}
