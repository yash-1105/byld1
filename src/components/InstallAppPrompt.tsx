import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share, SquarePlus, Download } from 'lucide-react';

/* Mobile-only "install the app" banner (PWA).
   - Android/Chrome: captures the `beforeinstallprompt` event and triggers the
     native install dialog.
   - iOS Safari: no install API exists, so it shows Share → Add to Home Screen
     instructions instead.
   Dismissal is remembered in localStorage. Hidden entirely when already
   running as an installed app (standalone). */

const DISMISS_KEY = 'byld-install-dismissed';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as unknown as { standalone?: boolean }).standalone === true;

const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export default function InstallAppPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(DISMISS_KEY)) return;

    if (isIOS()) {
      // small delay so the banner doesn't compete with first paint
      const t = setTimeout(() => setVisible(true), 2500);
      return () => clearTimeout(t);
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const dismiss = () => {
    setVisible(false);
    setShowIOSGuide(false);
    localStorage.setItem(DISMISS_KEY, '1');
  };

  const install = async () => {
    if (installEvent) {
      await installEvent.prompt();
      const { outcome } = await installEvent.userChoice;
      if (outcome === 'accepted') setVisible(false);
      setInstallEvent(null);
      localStorage.setItem(DISMISS_KEY, '1');
    } else {
      setShowIOSGuide(true);
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 90, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          className="fixed bottom-4 inset-x-4 z-[80] md:hidden"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="rounded-2xl bg-[#22281f] text-white shadow-2xl shadow-black/30 border border-white/10 p-4">
            {showIOSGuide ? (
              <div>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold">Add BYLD to your Home Screen</p>
                  <button onClick={dismiss} aria-label="Dismiss" className="shrink-0 opacity-70">
                    <X size={18} />
                  </button>
                </div>
                <ol className="mt-3 space-y-2 text-[13px] text-white/85">
                  <li className="flex items-center gap-2">
                    1. Tap the <Share size={15} className="inline shrink-0" /> <span className="font-semibold">Share</span> button below
                  </li>
                  <li className="flex items-center gap-2">
                    2. Choose <SquarePlus size={15} className="inline shrink-0" /> <span className="font-semibold">Add to Home Screen</span>
                  </li>
                </ol>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <img src="/pwa-192.png" alt="" className="w-10 h-10 rounded-xl bg-white shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-tight">Get the BYLD app</p>
                  <p className="text-xs text-white/70 mt-0.5">Faster access, right from your home screen.</p>
                </div>
                <button
                  onClick={install}
                  className="shrink-0 inline-flex items-center gap-1.5 bg-white text-[#22281f] text-[13px] font-bold px-3.5 py-2 rounded-xl"
                >
                  <Download size={14} /> Install
                </button>
                <button onClick={dismiss} aria-label="Dismiss" className="shrink-0 opacity-70">
                  <X size={18} />
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
