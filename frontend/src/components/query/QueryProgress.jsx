import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

/**
 * Shows a simple spinner with a contextual message while the backend processes.
 * Only reflects real frontend loading state — no fabricated steps.
 *
 * @param {Object} props
 * @param {string} props.message
 */
export default function QueryProgress({ message }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-3 px-4 py-3 bg-[#111318] border border-[#252a38] rounded-lg"
    >
      <Loader2 size={16} className="text-indigo-400 animate-spin shrink-0" />
      <p className="text-sm text-[#8b91a8]">{message}</p>
    </motion.div>
  );
}
