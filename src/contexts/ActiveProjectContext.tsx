import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';

/**
 * Frontend-only UI state for the top-bar project switcher.
 * 'all' = every accessible project. No backend involvement.
 */
interface ActiveProjectCtx {
  activeProjectId: string;
  setActiveProjectId: (id: string) => void;
}

const Ctx = createContext<ActiveProjectCtx>({ activeProjectId: 'all', setActiveProjectId: () => {} });

const STORAGE_KEY = 'byld.activeProject.v1';

export function ActiveProjectProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { projects } = useData();
  const [activeProjectId, setActiveProjectIdState] = useState<string>(() =>
    (user && localStorage.getItem(`${STORAGE_KEY}:${user.id}`)) || 'all'
  );

  // Drop back to 'all' if the persisted project is no longer accessible (removed, or a different user's id).
  useEffect(() => {
    if (activeProjectId !== 'all' && projects.length > 0 && !projects.some(p => p.id === activeProjectId)) {
      setActiveProjectIdState('all');
    }
  }, [projects, activeProjectId]);

  const setActiveProjectId = (id: string) => {
    setActiveProjectIdState(id);
    if (user) localStorage.setItem(`${STORAGE_KEY}:${user.id}`, id);
  };

  return <Ctx.Provider value={{ activeProjectId, setActiveProjectId }}>{children}</Ctx.Provider>;
}

export const useActiveProject = () => useContext(Ctx);
