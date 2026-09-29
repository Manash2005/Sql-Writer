import { Terminal, ShieldCheck, Database } from 'lucide-react';
import { shortId } from '../../lib/utils';

/**
 * @param {Object} props
 * @param {import('../../lib/api').QueryResponse} props.result
 */
export default function QueryDetails({ result }) {
  const isRead = result.intent?.toLowerCase() === 'read';
  const isWrite = result.intent?.toLowerCase() === 'write';

  return (
    <div className="glass-panel rounded-2xl p-5 space-y-4 font-sans shadow-md">
      {/* Top Request Bar */}
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-lg bg-c4/20 border border-c4 flex items-center justify-center shrink-0 mt-0.5 text-c1">
          <Terminal size={15} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-text-muted">
              Submitted Query:
            </span>
            <span className="text-[10px] font-mono text-text-muted">
              Session #{shortId(result.thread_id)}
            </span>
          </div>
          <p className="text-base sm:text-lg text-text-primary font-semibold leading-snug">
            &ldquo;{result.query}&rdquo;
          </p>
        </div>
      </div>

      {/* Badges / Assessment summary */}
      <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-c4 text-xs">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-c4/20 border border-c4">
          <Database size={12} className={isRead ? 'text-c1' : 'text-c3'} />
          <span className="text-text-muted">Intent:</span>
          <span className={`font-semibold ${isRead ? 'text-c1' : isWrite ? 'text-c3' : 'text-c2'}`}>
            {isRead ? 'Read & Retrieve' : isWrite ? 'Write / Modify' : 'Schema'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-c4/20 border border-c4">
          <ShieldCheck size={12} className="text-c2" />
          <span className="text-text-muted">Guardrails:</span>
          <span className="text-c2 font-semibold">AST Verified</span>
        </div>

        {result.estimated_rows_affected !== null && result.estimated_rows_affected !== undefined && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-c4/20 border border-c4">
            <span className="text-text-muted">Estimated Rows:</span>
            <span className="text-text-primary font-semibold">{result.estimated_rows_affected}</span>
          </div>
        )}
      </div>
    </div>
  );
}
