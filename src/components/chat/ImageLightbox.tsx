import { motion, AnimatePresence } from 'framer-motion';
import { X, Pencil } from 'lucide-react';
import Portal from '@/components/ui/portal';

interface Props {
  src: string;
  onClose: () => void;
  onAnnotate?: () => void;
}

export default function ImageLightbox({ src, onClose, onAnnotate }: Props) {
  return (
    <Portal>
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center cursor-zoom-out"
        onClick={onClose}
        onKeyDown={e => e.key === 'Escape' && onClose()}
        tabIndex={0}
      >
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10" onClick={e => e.stopPropagation()}>
          {onAnnotate && (
            <button
              onClick={onAnnotate}
              aria-label="Annotate"
              className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <Pencil className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <motion.img
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          src={src}
          alt="Preview"
          className="max-w-[90vw] max-h-[90vh] rounded-xl object-contain shadow-2xl"
          onClick={e => e.stopPropagation()}
        />
      </motion.div>
    </AnimatePresence>
    </Portal>
  );
}
