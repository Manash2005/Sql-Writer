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
          ? 'border-[#DF301C]/50 bg-[#DF301C]/10'
          : 'border-[#FF9100]/50 bg-[#FF9100]/10',
      ].join(' ')}
    >
      <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[#FFF1D1]/60 mb-2">
        Estimated Impact
      </p>

      {isManyRows && (
        <div className="flex items-center justify-center gap-1.5 mb-2">
          <AlertTriangle size={13} className="text-[#DF301C]" />
          <span className="text-xs text-[#DF301C] font-semibold">High impact operation</span>
        </div>
      )}

      <p
        className={[
          'text-4xl font-bold font-mono leading-none mb-1',
          isManyRows ? 'text-[#DF301C]' : 'text-[#FF9100]',
        ].join(' ')}
      >
        {estimatedRows.toLocaleString()}
      </p>
      <p className="text-sm text-[#FFF1D1]/80 font-medium">rows affected</p>
      <p className="text-xs text-[#8b91a8] mt-2 font-mono">Estimated prior to execution</p>
    </motion.div>
  );
}
