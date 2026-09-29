import Badge from '../common/Badge';
import { formatTime, safeJsonParse, shortId } from '../../lib/utils';

/**
 * @param {Object} props
 * @param {import('../../lib/api').AuditLog} props.log
 */
export default function AuditDetails({ log }) {
  if (!log) return null;

  const flags = safeJsonParse(log.risk_flags, []);
  const execResult = safeJsonParse(log.execution_result, null);
  const isRead = log.intent?.toLowerCase() === 'read';

  return (
    <div className="space-y-5">
      {/* Request */}
      <Section label="User Request">
        <p className="text-sm text-[#e8eaf0] leading-relaxed">{log.user_request}</p>
      </Section>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-3">
        <MetaPair label="Thread ID" mono title={log.thread_id}>{shortId(log.thread_id)}</MetaPair>
        <MetaPair label="Timestamp">{formatTime(log.created_at, 'datetime')}</MetaPair>
        <MetaPair label="Intent">
          <Badge variant={isRead ? 'blue' : 'amber'}>
            {log.intent?.toUpperCase() || '—'}
          </Badge>
        </MetaPair>
        <MetaPair label="Decision">
          {log.human_decision ? (
            <Badge
              variant={
                log.human_decision === 'approved'
                  ? 'emerald'
                  : log.human_decision === 'rejected'
                  ? 'red'
                  : 'gray'
              }
            >
              {log.human_decision}
            </Badge>
          ) : <span className="text-xs text-[#565c75]">—</span>}
        </MetaPair>
        <MetaPair label="Est. Rows">
          <span className="text-sm font-mono text-[#e8eaf0]">
            {log.estimated_rows_affected ?? '—'}
          </span>
        </MetaPair>
        <MetaPair label="Execution">
          {execResult?.success === true ? (
            <Badge variant="emerald">SUCCESS</Badge>
          ) : execResult?.success === false ? (
            <Badge variant="red">FAILED</Badge>
          ) : (
            <span className="text-xs text-[#565c75]">—</span>
          )}
        </MetaPair>
      </div>

      {/* Generated SQL */}
      {log.generated_sql && (
        <Section label="Generated SQL">
          <pre className="text-xs font-mono text-[#e8eaf0] bg-[#0a0b0f] border border-[#252a38] rounded p-3 overflow-x-auto scrollbar-x leading-5 whitespace-pre">
            {log.generated_sql}
          </pre>
        </Section>
      )}

      {/* Risk flags */}
      <Section label={`Risk Flags (${flags.length})`}>
        {flags.length === 0 ? (
          <p className="text-xs text-emerald-400">No risk flags — deterministic validation passed.</p>
        ) : (
          <ul className="space-y-1">
            {flags.map((f, i) => (
              <li key={i} className="text-xs text-amber-400 flex items-start gap-2">
                <span className="text-[#565c75] shrink-0">•</span> {f}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Execution result */}
      {execResult && (
        <Section label="Execution Result">
          {execResult.success === false ? (
            <p className="text-xs font-mono text-red-400 bg-red-500/5 border border-red-500/20 rounded p-2">
              {execResult.error || 'Execution failed.'}
            </p>
          ) : (
            <p className="text-xs text-emerald-400">Execution completed successfully.</p>
          )}
        </Section>
      )}
    </div>
  );
}

function Section({ label, children }) {
  return (
    <div>
      <p className="text-[10px] font-mono font-semibold text-[#565c75] uppercase tracking-widest mb-2">
        {label}
      </p>
      {children}
    </div>
  );
}

function MetaPair({ label, children, mono = false, title }) {
  return (
    <div className="bg-[#0d0f15] border border-[#1a1f2e] rounded p-3">
      <p className="text-[10px] font-mono font-medium text-[#565c75] uppercase tracking-widest mb-1">
        {label}
      </p>
      <div className={`text-xs ${mono ? 'font-mono text-[#8b91a8]' : ''}`} title={title}>
        {children}
      </div>
    </div>
  );
}
