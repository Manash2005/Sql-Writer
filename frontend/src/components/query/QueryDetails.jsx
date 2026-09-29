import { User, Sparkles, ShieldCheck } from 'lucide-react';
import { shortId } from '../../lib/utils';

/**
 * @param {Object} props
 * @param {import('../../lib/api').QueryResponse} props.result
 */
export default function QueryDetails({ result }) {
  const isRead = result.intent?.toLowerCase() === 'read';
  const isWrite = result.intent?.toLowerCase() === 'write';

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0c0d12] p-5 shadow-xl space-y-4">
      {/* Top Request Bar */}
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0 mt-0.5 text-gray-300">
          <User size={15} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Your Question:
            </span>
            <span className="text-[10px] font-mono text-gray-500">
              Session #{shortId(result.thread_id)}
            </span>
          </div>
          <p className="text-base sm:text-lg text-white font-medium leading-snug">
            &ldquo;{result.query}&rdquo;
          </p>
        </div>
      </div>

      {/* Badges / Assessment summary */}
      <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-white/[0.06] text-xs">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#14161f] border border-white/[0.08]">
          <Sparkles size={13} className="text-[#76C457]" />
          <span className="text-gray-400">Intent:</span>
          <span className={`font-semibold ${isRead ? 'text-[#76C457]' : isWrite ? 'text-orange-400' : 'text-blue-400'}`}>
            {isRead ? 'Read & Analyze Data' : isWrite ? 'Modify Database' : 'Schema Inquiry'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#14161f] border border-white/[0.08]">
          <ShieldCheck size={13} className="text-[#76C457]" />
          <span className="text-gray-400">Safety Guard:</span>
          <span className="text-[#76C457] font-semibold">Deterministic Filter Active</span>
        </div>

        {result.estimated_rows_affected !== null && result.estimated_rows_affected !== undefined && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#14161f] border border-white/[0.08]">
            <span className="text-gray-400">Estimated Impact:</span>
            <span className="text-white font-semibold">{result.estimated_rows_affected} rows</span>
          </div>
        )}
      </div>
    </div>
  );
}
