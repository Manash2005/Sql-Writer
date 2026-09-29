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
        className={`glass-card-3d rounded-2xl p-5 flex items-center gap-3.5 ${
          isApproved
            ? 'border-[#F4D35E]/60 bg-[#170a0e]'
            : 'border-[#E63946]/60 bg-[#1c080d]'
        }`}
      >
        {isApproved ? (
          <CheckCircle2 size={20} className="text-[#F4D35E] shrink-0" />
        ) : (
          <XCircle size={20} className="text-[#E63946] shrink-0" />
        )}
        <div>
          <h4 className={`text-sm font-semibold ${isApproved ? 'text-[#F4D35E]' : 'text-[#E63946]'}`}>
            {isApproved ? 'Query Approved & Executed' : 'Query Cancelled'}
          </h4>
          <p className="text-xs text-[#e2d4cf] mt-0.5">
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
      className="glass-card-3d rounded-2xl p-5 sm:p-6 space-y-5 font-sans"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#8B1E2D]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-[#F4D35E]" />
            <h4 className="font-display font-bold text-base text-[#FFF8F0]">
              Ready to Execute: Human Approval Required
            </h4>
          </div>
          <p className="text-xs text-[#9c8a8e]">
            For database safety, AI-generated code never runs without explicit operator confirmation.
          </p>
        </div>

        {approvalAllowed ? (
          <span className="hl-gold text-xs shrink-0 self-start sm:self-auto font-mono">
            0 Risk Flags Detected
          </span>
        ) : (
          <span className="hl-coral text-xs shrink-0 self-start sm:self-auto font-mono">
            Safety Review Required
          </span>
        )}
      </div>

      {/* Safety warning if flags exist */}
      {(isBlocked || hasFlags) && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-[#E63946]/40 bg-[#210d14]">
          <AlertTriangle size={18} className="text-[#E63946] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-semibold text-[#E63946]">
              Deterministic Safety Flag Triggered:
            </p>
            <p className="text-xs text-[#e2d4cf]">
              The query lacks a narrow filter condition or modifies table records. Review carefully or edit before approving.
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
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-[#e2d4cf] hover:text-[#FFF8F0] bg-[#210d14] hover:bg-[#2b111a] border border-[#8B1E2D] transition-all"
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
            className="btn-3d-danger flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold"
          >
            <XCircle size={14} className="text-[#FFF8F0]" />
            <span>Reject / Cancel</span>
          </button>

          <button
            type="button"
            onClick={onApprove}
            disabled={!approvalAllowed || loading}
            className="btn-3d-gold flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#0f0608] border-t-transparent" />
                <span>Executing…</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} className="text-[#0f0608]" />
                <span>Approve &amp; Run Query</span>
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
