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
      className="card-3d rounded-xl border border-c4 bg-bg-surface overflow-hidden font-sans"
    >
      {/* Header */}
      <div
        className={[
          'flex items-center gap-2 px-4 py-2.5 border-b',
          isBlocked
            ? 'border-c3/40 bg-bg-surface'
            : hasFlags
            ? 'border-c2/40 bg-bg-elevated'
            : 'border-c1/30 bg-bg-elevated',
        ].join(' ')}
      >
        {isBlocked ? (
          <XCircle size={14} className="text-c3 shrink-0" />
        ) : hasFlags ? (
          <AlertTriangle size={14} className="text-c2 shrink-0" />
        ) : (
          <Shield size={14} className="text-c1 shrink-0" />
        )}
        <p
          className={[
            'text-[10px] font-mono font-bold uppercase tracking-widest',
            isBlocked ? 'text-c3' : hasFlags ? 'text-c2' : 'text-c1',
          ].join(' ')}
        >
          {isBlocked ? 'Execution Blocked' : hasFlags ? 'Review Required' : 'Safety Verification Passed'}
        </p>
      </div>

      <div className="p-4 space-y-3">
        {/* Blocked state */}
        {isBlocked && (
          <div className="rounded-xl border border-c3/40 bg-bg-surface p-3.5">
            <p className="text-xs font-semibold text-c3 mb-1">Execution Blocked</p>
            <p className="text-xs text-text-secondary">
              This SQL statement was intercepted by deterministic AST rules. It cannot be executed on the database.
            </p>
          </div>
        )}

        {/* Safe checklist */}
        {!isBlocked && !hasFlags && result.generated_sql && (
          <ul className="space-y-1.5">
            {[
              'SQL syntax verified',
              'Tables verified against live database schema',
              'Columns confirmed present and valid',
              'Zero prohibited schema mutations (DROP/ALTER) detected',
            ].map((check) => (
              <li key={check} className="flex items-center gap-2 text-xs text-text-secondary">
                <CheckCircle size={13} className="text-c1 shrink-0" />
                <span>{check}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Risk flags */}
        {hasFlags && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-c2 mb-2">Security Flags Detected:</p>
            {result.risk_flags.map((flag, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-text-primary">
                <AlertTriangle size={12} className="text-c3 shrink-0 mt-0.5" />
                <span>{flag}</span>
              </div>
            ))}
          </div>
        )}

        {/* Validation authority note */}
        <div className="pt-2 border-t border-c4">
          <p className="text-[11px] text-text-muted leading-relaxed">
            {!isBlocked && !hasFlags && result.generated_sql
              ? 'Deterministic AST validation passed. Database safety is verified independently of LLM reasoning.'
              : isBlocked
              ? 'Destructive operations or unrestricted data mutations are prohibited.'
              : 'Deterministic validation flagged potential risks. Operator review required.'}
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
