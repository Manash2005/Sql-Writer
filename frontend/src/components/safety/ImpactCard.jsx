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
        'rounded-xl border p-4 text-center card-3d',
        isManyRows
          ? 'border-c3/50 bg-c3/10'
          : 'border-c2/50 bg-c2/10',
      ].join(' ')}
    >
      <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-text-secondary/60 mb-2">
        Estimated Impact
      </p>

      {isManyRows && (
        <div className="flex items-center justify-center gap-1.5 mb-2">
          <AlertTriangle size={13} className="text-c3" />
          <span className="text-xs text-c3 font-semibold">High impact operation</span>
        </div>
      )}

      <p
        className={[
          'text-4xl font-bold font-mono leading-none mb-1',
          isManyRows ? 'text-c3' : 'text-c2',
        ].join(' ')}
      >
        {estimatedRows.toLocaleString()}
      </p>
      <p className="text-sm text-text-secondary/80 font-medium">rows affected</p>
      <p className="text-xs text-text-muted mt-2 font-mono">Estimated prior to execution</p>
    </motion.div>
  );
}
