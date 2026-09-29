import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Edit3, ShieldCheck, AlertTriangle } from 'lucide-react';
import { canApprove } from '../../lib/utils';

/**
 * @param {Object} props
 * @param {import('../../lib/api').QueryResponse} props.result
 * @param {boolean} props.loading
 * @param {() => void} props.onApprove
 * @param {() => void} props.onReject
 * @param {() => void} props.onEdit
 */
export default function ApprovalPanel({ result, loading, onApprove, onReject, onEdit }) {
  const approvalAllowed = canApprove(result);
  const isRejected = result.human_decision === 'rejected';
  const isApproved = result.human_decision === 'approved';
  const isBlocked = result.workflow_status === 'blocked';
  const hasFlags = result.risk_flags && result.risk_flags.length > 0;
  const alreadyDecided = isApproved || isRejected;

  if (alreadyDecided) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl border p-5 flex items-center gap-3.5 shadow-xl ${
          isApproved
            ? 'border-[#76C457]/30 bg-[#76C457]/10'
            : 'border-red-500/30 bg-red-500/10'
        }`}
      >
        {isApproved ? (
          <CheckCircle2 size={20} className="text-[#76C457] shrink-0" />
        ) : (
          <XCircle size={20} className="text-red-400 shrink-0" />
        )}
        <div>
          <h4 className={`text-sm font-semibold ${isApproved ? 'text-[#76C457]' : 'text-red-400'}`}>
            {isApproved ? 'Query Approved & Executed' : 'Query Cancelled'}
          </h4>
          <p className="text-xs text-gray-400 mt-0.5">
            {isApproved
              ? 'Results have been safely retrieved from the SQLite database.'
              : 'You declined to run this query. No changes were made to the database.'}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/[0.1] bg-[#0c0d12] p-5 sm:p-6 shadow-2xl space-y-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-[#76C457]" />
            <h4 className="font-display font-bold text-base text-white">
              Ready to Execute: Your Approval is Required
            </h4>
          </div>
          <p className="text-xs text-gray-400">
            For maximum security, this system NEVER runs AI code automatically. You are always in control.
          </p>
        </div>

        {approvalAllowed ? (
          <span className="hl-green text-xs shrink-0 self-start sm:self-auto">
            ✓ 0 Risk Flags Detected
          </span>
        ) : (
          <span className="hl-orange text-xs shrink-0 self-start sm:self-auto">
            ⚠️ Safety Review Required
          </span>
        )}
      </div>

      {/* Safety warning if flags exist */}
      {(isBlocked || hasFlags) && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-orange-500/30 bg-orange-500/10">
          <AlertTriangle size={18} className="text-orange-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-semibold text-orange-200">
              Deterministic Safety Flag Triggered:
            </p>
            <p className="text-xs text-orange-300/80">
              The query lacks a narrow row scope or modifies critical database structure. Edit the SQL query manually to resolve or reject it.
            </p>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-2">
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-gray-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] transition-colors"
          >
            <Edit3 size={13} />
            <span>Customize SQL</span>
          </button>
        )}

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onReject}
            disabled={loading}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-gray-300 hover:text-white bg-white/[0.05] hover:bg-red-500/20 hover:border-red-500/40 border border-white/[0.08] transition-all"
          >
            <XCircle size={14} className="text-gray-400" />
            <span>Reject / Cancel</span>
          </button>

          <button
            type="button"
            onClick={onApprove}
            disabled={!approvalAllowed || loading}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#76C457] text-black hover:bg-[#86d965] disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_18px_rgba(118,196,87,0.4)] transition-all active:scale-95"
          >
            {loading ? (
              <>
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                <span>Running Query…</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} className="text-black" />
                <span>Approve &amp; Run Query</span>
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
