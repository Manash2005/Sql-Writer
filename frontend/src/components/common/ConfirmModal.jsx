import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X } from 'lucide-react';

/**
 * In-app confirmation modal replacing native browser window.confirm() popups.
 */
export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger' | 'brand'
}) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-bg-base/80 backdrop-blur-xl"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="glass-card-3d relative w-full max-w-md rounded-3xl p-6 space-y-5 z-10 font-sans shadow-2xl"
        >
          {/* Top Bar with Icon & Close */}
          <div className="flex items-start justify-between">
            <div
              className={`h-11 w-11 rounded-2xl flex items-center justify-center ${
                variant === 'danger'
                  ? 'bg-c3/20 text-c3 border border-c3/40 shadow-sm'
                  : 'bg-c2/20 text-c2 border border-c2/40 shadow-sm'
              }`}
            >
              {variant === 'danger' ? <Trash2 size={20} /> : <AlertTriangle size={20} />}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-text-muted hover:text-text-primary hover:bg-bg-overlay transition-colors"
              aria-label="Close modal"
            >
              <X size={16} />
            </button>
          </div>

          {/* Title & Message */}
          <div className="space-y-2">
            <h3 className="font-display font-bold text-lg sm:text-xl text-text-primary tracking-tight">
              {title}
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed font-sans">
              {message}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-text-secondary hover:text-text-primary bg-bg-elevated hover:bg-bg-overlay border border-c4 transition-colors"
            >
              {cancelText}
            </button>

            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold ${
                variant === 'danger' ? 'btn-3d-danger' : 'btn-3d-gold'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
