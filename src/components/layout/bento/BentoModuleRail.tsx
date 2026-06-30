import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { C } from '@/components/dashboards/bento/BentoKit';
import { navForRole } from './navConfig';

const isActive = (pathname: string, path: string) =>
  pathname === path || (path !== '/dashboard' && pathname.startsWith(path));

export default function BentoModuleRail() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  if (!user) return null;

  const nav = navForRole(user.role);
  const primary = nav.filter(n => n.primary);
  const overflow = nav.filter(n => !n.primary && !n.corner);
  const overflowActive = overflow.some(n => isActive(location.pathname, n.path));

  return (
    <nav
      className="flex items-center gap-[3px] px-3 sm:px-[18px] py-[7px] sticky top-[62px] z-20 overflow-x-auto no-scrollbar"
      style={{ background: C.white, borderBottom: `1px solid ${C.hairSoft}` }}
    >
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
