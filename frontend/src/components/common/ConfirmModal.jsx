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
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="relative w-full max-w-md bg-[#0e1017] border border-white/[0.12] rounded-3xl p-6 shadow-2xl space-y-5 z-10"
        >
          {/* Top Bar with Icon & Close */}
          <div className="flex items-start justify-between">
            <div
              className={`h-11 w-11 rounded-2xl flex items-center justify-center ${
                variant === 'danger'
                  ? 'bg-red-500/15 text-red-400 border border-red-500/30 shadow-[0_0_16px_rgba(239,68,68,0.2)]'
                  : 'bg-[#76C457]/15 text-[#76C457] border border-[#76C457]/30 shadow-[0_0_16px_rgba(118,196,87,0.2)]'
              }`}
            >
              {variant === 'danger' ? <Trash2 size={20} /> : <AlertTriangle size={20} />}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              aria-label="Close modal"
            >
              <X size={16} />
            </button>
          </div>

          {/* Title & Message */}
          <div className="space-y-2">
            <h3 className="font-display font-bold text-lg sm:text-xl text-white tracking-tight">
              {title}
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed font-sans">
              {message}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-gray-300 hover:text-white bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] transition-colors"
            >
              {cancelText}
            </button>

            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-95 shadow-lg ${
                variant === 'danger'
                  ? 'bg-red-500 text-white hover:bg-red-600 shadow-[0_0_16px_rgba(239,68,68,0.4)]'
                  : 'bg-[#76C457] text-black hover:bg-[#86d965] shadow-[0_0_16px_rgba(118,196,87,0.4)]'
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
