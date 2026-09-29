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
    <div className="glass-panel rounded-2xl p-5 space-y-4 font-sans shadow-[0_4px_0_0_#8B1E2D]">
      {/* Top Request Bar */}
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-lg bg-[#210d14] border border-[#8B1E2D] flex items-center justify-center shrink-0 mt-0.5 text-[#457B9D]">
          <Terminal size={15} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#9c8a8e]">
              Submitted Query:
            </span>
            <span className="text-[10px] font-mono text-[#9c8a8e]">
              Session #{shortId(result.thread_id)}
            </span>
          </div>
          <p className="text-base sm:text-lg text-[#FFF8F0] font-semibold leading-snug">
            &ldquo;{result.query}&rdquo;
          </p>
        </div>
      </div>

      {/* Badges / Assessment summary */}
      <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-[#8B1E2D] text-xs">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#210d14] border border-[#8B1E2D]">
          <Database size={12} className={isRead ? 'text-[#F4D35E]' : 'text-[#E63946]'} />
          <span className="text-[#9c8a8e]">Intent:</span>
          <span className={`font-semibold ${isRead ? 'text-[#F4D35E]' : isWrite ? 'text-[#E63946]' : 'text-[#457B9D]'}`}>
            {isRead ? 'Read & Retrieve' : isWrite ? 'Write / Modify' : 'Schema'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#210d14] border border-[#8B1E2D]">
          <ShieldCheck size={12} className="text-[#F4D35E]" />
          <span className="text-[#9c8a8e]">Guardrails:</span>
          <span className="text-[#F4D35E] font-semibold">AST Verified</span>
        </div>

        {result.estimated_rows_affected !== null && result.estimated_rows_affected !== undefined && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#210d14] border border-[#8B1E2D]">
            <span className="text-[#9c8a8e]">Estimated Rows:</span>
            <span className="text-[#FFF8F0] font-semibold">{result.estimated_rows_affected}</span>
          </div>
        )}
      </div>
    </div>
  );
}
