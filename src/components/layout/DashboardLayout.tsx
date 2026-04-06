import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AppSidebar from './AppSidebar';
import TopNavbar from './TopNavbar';

export default function DashboardLayout() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar />
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
