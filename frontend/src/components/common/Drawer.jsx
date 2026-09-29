import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * @param {Object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {string} [props.title]
 * @param {'right'|'left'} [props.side]
 * @param {string} [props.width]
 * @param {React.ReactNode} props.children
 */
export default function Drawer({ open, onClose, title, side = 'right', width = 'w-full max-w-2xl', children }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const slideIn = side === 'right'
    ? { x: '100%' }
    : { x: '-100%' };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label={title || 'Panel'}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={slideIn}
            animate={{ x: 0 }}
            exit={slideIn}
            transition={{ type: 'tween', duration: 0.25 }}
            className={[
              'relative ml-auto h-full bg-[#111318] border-l border-[#252a38]',
              'flex flex-col shadow-2xl',
              width,
            ].join(' ')}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#252a38] shrink-0">
              {title && (
                <h2 className="text-sm font-semibold text-[#e8eaf0] uppercase tracking-wider">
                  {title}
                </h2>
              )}
              <button
                onClick={onClose}
                className="ml-auto text-[#565c75] hover:text-[#e8eaf0] transition-colors p-1 rounded"
                aria-label="Close panel"
              >
                <X size={16} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
