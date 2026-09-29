import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

/**
 * @param {Object} props
 * @param {number|null} props.estimatedRows
 * @param {string} props.intent
 */
export default function ImpactCard({ estimatedRows, intent }) {
  if (estimatedRows === null || estimatedRows === undefined) return null;
  const isWrite = intent && intent.toLowerCase() !== 'read';
  if (!isWrite) return null;

  const isManyRows = estimatedRows > 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className={[
        'rounded-lg border p-4 text-center',
        isManyRows
          ? 'border-red-500/40 bg-red-500/5'
          : 'border-amber-500/40 bg-amber-500/5',
      ].join(' ')}
    >
      <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[#565c75] mb-2">
        Estimated Impact
      </p>

      {isManyRows && (
        <div className="flex items-center justify-center gap-1.5 mb-2">
          <AlertTriangle size={13} className="text-red-400" />
          <span className="text-xs text-red-400 font-medium">High impact operation</span>
        </div>
      )}

      <p
        className={[
          'text-4xl font-bold font-mono leading-none mb-1',
          isManyRows ? 'text-red-400' : 'text-amber-400',
        ].join(' ')}
      >
        {estimatedRows.toLocaleString()}
      </p>
      <p className="text-sm text-[#8b91a8]">rows affected</p>
      <p className="text-xs text-[#565c75] mt-2">Estimated before execution</p>
    </motion.div>
  );
}
