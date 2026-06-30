import { useNavigate } from 'react-router-dom';
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem,
} from '@/components/ui/command';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { navForRole } from './navConfig';

export default function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { projects, tasks } = useData();
  if (!user) return null;

  const nav = navForRole(user.role);
  const go = (path: string) => { onOpenChange(false); navigate(path); };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search projects, tasks, or jump to…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigate">
          {nav.map(n => (
            <CommandItem key={n.path} value={`go ${n.label}`} onSelect={() => go(n.path)}>
              <n.icon className="mr-2 h-4 w-4" />
              {n.label}
            </CommandItem>
          ))}
        </CommandGroup>
        {projects.length > 0 && (
          <CommandGroup heading="Projects">
            {projects.slice(0, 8).map(p => (
              <CommandItem key={p.id} value={`project ${p.name}`} onSelect={() => go(`/projects/${p.id}`)}>
                {p.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {tasks.length > 0 && (
          <CommandGroup heading="Tasks">
            {tasks.slice(0, 8).map(t => (
              <CommandItem key={t.id} value={`task ${t.title}`} onSelect={() => go('/tasks')}>
                {t.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
