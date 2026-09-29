import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, XCircle, Shield } from 'lucide-react';
import ImpactCard from './ImpactCard';

/**
 * @param {Object} props
 * @param {import('../../lib/api').QueryResponse} props.result
 */
export default function SafetyPanel({ result }) {
  const hasFlags = result.risk_flags && result.risk_flags.length > 0;
  const isBlocked = result.workflow_status === 'blocked';

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-[#252a38] bg-[#111318] overflow-hidden"
    >
      {/* Header */}
      <div
        className={[
          'flex items-center gap-2 px-4 py-3 border-b',
          isBlocked
            ? 'border-red-500/30 bg-red-500/5'
            : hasFlags
            ? 'border-amber-500/30 bg-amber-500/5'
            : 'border-emerald-500/20 bg-emerald-500/5',
        ].join(' ')}
      >
        {isBlocked ? (
          <XCircle size={14} className="text-red-400 shrink-0" />
        ) : hasFlags ? (
          <AlertTriangle size={14} className="text-amber-400 shrink-0" />
        ) : (
          <Shield size={14} className="text-emerald-400 shrink-0" />
        )}
        <p
          className={[
            'text-[10px] font-mono font-semibold uppercase tracking-widest',
            isBlocked ? 'text-red-400' : hasFlags ? 'text-amber-400' : 'text-emerald-400',
          ].join(' ')}
        >
          {isBlocked ? 'Blocked' : hasFlags ? 'Review Required' : 'Safety Analysis'}
        </p>
      </div>

      <div className="p-4 space-y-3">
        {/* Blocked state */}
        {isBlocked && (
          <div className="rounded border border-red-500/30 bg-red-500/5 p-3">
            <p className="text-xs font-semibold text-red-400 mb-1">Execution Blocked</p>
            <p className="text-xs text-[#8b91a8]">
              This SQL was blocked by deterministic validation. It cannot be executed.
            </p>
          </div>
        )}

        {/* Safe checklist */}
        {!isBlocked && !hasFlags && result.generated_sql && (
          <ul className="space-y-1.5">
            {[
              'SQL syntax validated',
              'Tables verified against schema',
              'Columns verified',
              'No blocked operations detected',
            ].map((check) => (
              <li key={check} className="flex items-center gap-2 text-xs text-[#8b91a8]">
                <CheckCircle size={13} className="text-emerald-400 shrink-0" />
                {check}
              </li>
            ))}
          </ul>
        )}

        {/* Risk flags */}
        {hasFlags && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-amber-400 mb-2">Risk Flags Detected:</p>
            {result.risk_flags.map((flag, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-[#e8eaf0]">
                <AlertTriangle size={12} className="text-amber-400 shrink-0 mt-0.5" />
                <span>{flag}</span>
              </div>
            ))}
          </div>
        )}

        {/* Validation authority note */}
        <div className="pt-1 border-t border-[#1a1f2e]">
          <p className="text-[11px] text-[#565c75] leading-relaxed">
            {!isBlocked && !hasFlags && result.generated_sql
              ? 'Deterministic validation passed. AI-generated SQL is not inherently safe — validation is performed independently.'
              : isBlocked
              ? 'Schema-changing or otherwise blocked operations are not allowed regardless of LLM output.'
              : 'Deterministic validation detected issues. Review before approving.'}
          </p>
        </div>

        {/* Impact card for write ops */}
        <ImpactCard
          estimatedRows={result.estimated_rows_affected}
          intent={result.intent}
        />
      </div>
    </motion.div>
  );
}
