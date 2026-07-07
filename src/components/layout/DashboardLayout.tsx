import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ActiveProjectProvider } from '@/contexts/ActiveProjectContext';
import { C } from '@/components/dashboards/bento/BentoKit';
import BentoTopBar from './bento/BentoTopBar';
import BentoModuleRail from './bento/BentoModuleRail';
import CommandPalette from './bento/CommandPalette';
import InstallAppPrompt from '@/components/InstallAppPrompt';

export default function DashboardLayout() {
  const location = useLocation();
  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(o => !o);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <ActiveProjectProvider>
      <div
        className="min-h-screen w-full app-glass"
        style={{
          // Sage ambience (existing palette tones only, alpha-adjusted) — the
          // liquid-glass panels need clearly visible tonal variation behind
          // them or the backdrop blur has nothing to frost.
          background: `
            radial-gradient(880px 620px at 10% -6%, rgba(166, 197, 135, 0.45), transparent 68%),
            radial-gradient(760px 580px at 98% 34%, rgba(74, 93, 64, 0.28), transparent 66%),
            radial-gradient(840px 660px at 8% 96%, rgba(166, 197, 135, 0.38), transparent 66%),
            radial-gradient(520px 420px at 58% 52%, rgba(74, 93, 64, 0.14), transparent 70%),
            ${C.canvas}`,
        }}
      >
        <BentoTopBar onOpenSearch={() => setCmdOpen(true)} />
        <BentoModuleRail />
        <main className="px-4 sm:px-[22px] 2xl:px-8 py-5 sm:py-6">
          <div className="w-full max-w-[1920px] mx-auto">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <Outlet />
            </motion.div>
          </div>
        </main>
        <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
        <InstallAppPrompt />
      </div>
    </ActiveProjectProvider>
  );
}
