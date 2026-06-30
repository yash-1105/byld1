import { createContext, useContext, useState, ReactNode } from 'react';

/**
 * Frontend-only UI state for the top-bar project switcher.
 * 'all' = every accessible project. No backend involvement.
 */
interface ActiveProjectCtx {
  activeProjectId: string;
  setActiveProjectId: (id: string) => void;
}

const Ctx = createContext<ActiveProjectCtx>({ activeProjectId: 'all', setActiveProjectId: () => {} });

export function ActiveProjectProvider({ children }: { children: ReactNode }) {
  const [activeProjectId, setActiveProjectId] = useState<string>('all');
  return <Ctx.Provider value={{ activeProjectId, setActiveProjectId }}>{children}</Ctx.Provider>;
}

export const useActiveProject = () => useContext(Ctx);
