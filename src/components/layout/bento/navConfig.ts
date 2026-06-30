import {
  LayoutGrid, Folder, ListChecks, Stamp, Package, GanttChart, HardHat,
  IndianRupee, FileText, Users, MessageSquare, HelpCircle, Bell, Settings,
} from 'lucide-react';

export interface RailItem {
  label: string;
  icon: React.ElementType;
  path: string;
  roles: string[];
  primary: boolean;  // true → shown in the rail; false → under "More"
  corner?: boolean;  // true → rendered as a top-bar corner icon, never in the rail/More
}

// Order + icons follow the BYLD/SPACE handoff spec.
export const NAV: RailItem[] = [
  { label: 'Dashboard',    icon: LayoutGrid,    path: '/dashboard',    roles: ['architect', 'contractor', 'client', 'consultant'], primary: true },
  { label: 'Projects',     icon: Folder,        path: '/projects',     roles: ['architect', 'client'],                            primary: true },
  { label: 'Tasks',        icon: ListChecks,    path: '/tasks',        roles: ['architect', 'contractor'],                        primary: true },
  { label: 'Approvals',    icon: Stamp,         path: '/approvals',    roles: ['architect', 'client'],                            primary: true },
  { label: 'Procurement',  icon: Package,       path: '/procurement',  roles: ['architect', 'contractor'],                        primary: true },
  { label: 'Timeline',     icon: GanttChart,    path: '/timeline',     roles: ['architect', 'contractor', 'client'],              primary: true },
  { label: 'Site',         icon: HardHat,       path: '/site-updates', roles: ['architect', 'contractor', 'client'],              primary: true },
  { label: 'Budget',       icon: IndianRupee,   path: '/budget',       roles: ['architect', 'client'],                            primary: true },
  { label: 'Documents',    icon: FileText,      path: '/documents',    roles: ['architect', 'contractor', 'client'],              primary: true },
  { label: 'Team',         icon: Users,         path: '/team',         roles: ['architect'],                                      primary: true },
  { label: 'Chat',         icon: MessageSquare, path: '/chat',         roles: ['architect', 'contractor', 'client', 'consultant'], primary: true },
  { label: 'Consultations',icon: HelpCircle,    path: '/consultations',roles: ['architect', 'consultant'],                        primary: true },
  // Corner icons (top bar), never in the rail:
  { label: 'Notifications',icon: Bell,          path: '/notifications',roles: ['architect', 'contractor', 'client', 'consultant'], primary: false, corner: true },
  { label: 'Settings',     icon: Settings,      path: '/settings',     roles: ['architect', 'contractor', 'client', 'consultant'], primary: false, corner: true },
];

export const navForRole = (role: string) => NAV.filter(n => n.roles.includes(role));
