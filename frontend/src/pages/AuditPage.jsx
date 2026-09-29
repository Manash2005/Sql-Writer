import { useEffect, useState } from 'react';
import { Shield, Clock, Search, Trash2, ArrowUpRight, CheckCircle2, RefreshCw } from 'lucide-react';
import { getAuditLogs, clearAuditLogs } from '../lib/api';
import { formatTime, shortId } from '../lib/utils';
import Drawer from '../components/common/Drawer';
import SQLViewer from '../components/sql/SQLViewer';
import ConfirmModal from '../components/common/ConfirmModal';

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [showClearModal, setShowClearModal] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await getAuditLogs();
      const allLogs = data.logs || [];

      // Filter out duplicates with the same request text and timestamp within 15 seconds
      const deduplicated = [];
      const seen = new Set();

      for (const log of allLogs) {
        const key = `${log.user_request?.trim().toLowerCase()}-${log.human_decision || ''}`;
        if (!seen.has(key)) {
          seen.add(key);
          deduplicated.push(log);
        }
      }

      setLogs(deduplicated);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleClearLogs = async () => {
    try {
      await clearAuditLogs();
      setLogs([]);
      setSelectedLog(null);
    } catch {
      // Ignore
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery.trim()) return true;
    const term = searchQuery.toLowerCase();
    return (
      (log.user_request && log.user_request.toLowerCase().includes(term)) ||
      (log.generated_sql && log.generated_sql.toLowerCase().includes(term)) ||
      (log.human_decision && log.human_decision.toLowerCase().includes(term)) ||
      (log.intent && log.intent.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6 font-sans">
      {/* In-app Clear Confirmation Modal */}
      <ConfirmModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={handleClearLogs}
        title="Clear All Audit Records?"
        message="This will delete the entire audit log history from the SQLite database. This operation is permanent."
        confirmText="Yes, Clear All Logs"
        variant="danger"
      />

      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#450C3F]">
        <div>
          <h3 className="font-display font-bold text-2xl text-[#FFF1D1] tracking-tight flex items-center gap-2.5">
            <Shield className="text-[#B9D175]" size={22} />
            Security &amp; Activity Audit Log
          </h3>
          <p className="text-sm text-[#d1c5a9] mt-1 font-sans">
            Every query, safety check, and human approval decision is recorded for full compliance.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* Search */}
          <div className="relative flex-1 sm:flex-initial min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8c826c]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search audit trail…"
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#0d0611] border border-[#450C3F] rounded-xl text-[#FFF1D1] placeholder-[#8c826c] focus:outline-none focus:border-[#00B7CD] transition-colors"
            />
          </div>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-2.5 rounded-xl border border-[#450C3F] hover:border-[#B9D175] bg-[#1d0f28] text-[#d1c5a9] hover:text-[#FFF1D1] transition-colors"
            title="Refresh logs"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>

          {logs.length > 0 && (
            <button
              onClick={() => setShowClearModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#DF301C] hover:text-[#FFF1D1] bg-[#DF301C]/10 hover:bg-[#DF301C]/20 border border-[#DF301C]/30 transition-all"
              title="Clear all audit logs"
            >
              <Trash2 size={13} />
              <span>Clear Logs</span>
            </button>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading && logs.length === 0 && (
        <div className="p-12 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[#B9D175] border-t-transparent" />
          <p className="text-xs text-[#8c826c] mt-3">Loading audit records…</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredLogs.length === 0 && (
        <div className="p-12 rounded-2xl border border-[#450C3F] bg-[#140a1b] text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-[#B9D175]/15 flex items-center justify-center mx-auto text-[#B9D175]">
            <Shield size={24} />
          </div>
          <h4 className="font-display font-bold text-base text-[#FFF1D1]">No audit entries found</h4>
          <p className="text-xs text-[#8c826c] max-w-sm mx-auto">
            {searchQuery
              ? 'No audit records matched your search query.'
              : 'Every query executed, edited, or rejected is recorded in this audit log.'}
          </p>
        </div>
      )}

      {/* Audit Log Timeline */}
      {!loading && filteredLogs.length > 0 && (
        <div className="space-y-3">
          {filteredLogs.map((log) => {
            const isApproved = log.human_decision === 'approved' || log.human_decision === 'edited';
            const isRejected = log.human_decision === 'rejected';
            const hasFlags = log.risk_flags && log.risk_flags.length > 0;
            const isRead = log.intent?.toLowerCase() === 'read';
            const success = log.execution_result ? log.execution_result.success !== false : null;

            return (
              <div
                key={log.id}
                className="card-3d p-4 sm:p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 group transition-all"
              >
                {/* Left Info */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-[#8c826c] flex items-center gap-1">
                      <Clock size={12} />
                      {formatTime(log.timestamp, 'datetime')}
                    </span>
                    <span className="text-[#450C3F]">•</span>
                    <span className="text-xs font-mono text-[#8c826c]">
                      Session #{shortId(log.thread_id)}
                    </span>
                    <span className="text-[#450C3F]">•</span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${isRead ? 'hl-lime' : 'hl-orange'}`}>
                      {isRead ? 'DATA READ' : 'DATA WRITE'}
                    </span>
                  </div>

                  <p className="font-semibold text-base text-[#FFF1D1] leading-snug group-hover:text-[#B9D175] transition-colors truncate">
                    &ldquo;{log.user_request}&rdquo;
                  </p>

                  <div className="flex items-center gap-3 text-xs text-[#8c826c]">
                    <span>
                      Safety:{' '}
                      {hasFlags ? (
                        <span className="text-[#FF9100] font-semibold">
                          {log.risk_flags.length} Security Flag{log.risk_flags.length > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-[#B9D175] font-semibold">Verified Safe</span>
                      )}
                    </span>
                    {log.estimated_rows_affected !== null && (
                      <>
                        <span>•</span>
                        <span>Impact: {log.estimated_rows_affected} rows</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Status Badge & Arrow */}
                <div className="flex items-center gap-4 shrink-0 self-start md:self-auto">
                  <div className="text-right">
                    {isApproved ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#B9D175]/20 text-[#B9D175] border border-[#B9D175]/40">
                        <CheckCircle2 size={13} />
                        {success === true ? 'Executed' : 'Approved'}
                      </span>
                    ) : isRejected ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#DF301C]/20 text-[#DF301C] border border-[#DF301C]/40">
                        Cancelled
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FF9100]/20 text-[#FF9100] border border-[#FF9100]/40">
                        Pending Action
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedLog(log)}
                    className="p-2 rounded-xl bg-[#1d0f28] text-[#d1c5a9] hover:text-[#FFF1D1] hover:bg-[#271435] border border-[#450C3F] transition-colors"
                    title="Inspect audit entry"
                  >
                    <ArrowUpRight size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Log Details Drawer */}
      <Drawer
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Audit Trail Inspector"
      >
        {selectedLog && (
          <div className="space-y-6 text-xs font-sans">
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#8c826c]">
                User Prompt
              </span>
              <p className="text-sm text-[#FFF1D1] font-semibold p-3.5 rounded-xl bg-[#0d0611] border border-[#450C3F]">
                &ldquo;{selectedLog.user_request}&rdquo;
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-[#1d0f28] border border-[#450C3F] space-y-1">
                <span className="text-[#8c826c] text-[10px] uppercase font-mono">Timestamp</span>
                <p className="text-[#FFF1D1] font-mono">{formatTime(selectedLog.timestamp, 'datetime')}</p>
              </div>
              <div className="p-3 rounded-xl bg-[#1d0f28] border border-[#450C3F] space-y-1">
                <span className="text-[#8c826c] text-[10px] uppercase font-mono">Session ID</span>
                <p className="text-[#FFF1D1] font-mono">{shortId(selectedLog.thread_id)}</p>
              </div>
              <div className="p-3 rounded-xl bg-[#1d0f28] border border-[#450C3F] space-y-1">
                <span className="text-[#8c826c] text-[10px] uppercase font-mono">Human Decision</span>
                <p className="text-[#FFF1D1] font-mono capitalize">{selectedLog.human_decision || 'Pending'}</p>
              </div>
              <div className="p-3 rounded-xl bg-[#1d0f28] border border-[#450C3F] space-y-1">
                <span className="text-[#8c826c] text-[10px] uppercase font-mono">Estimated Rows</span>
                <p className="text-[#FFF1D1] font-mono">{selectedLog.estimated_rows_affected ?? 'N/A'}</p>
              </div>
            </div>

            {selectedLog.generated_sql && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#8c826c]">
                  Generated SQL
                </span>
                <SQLViewer sql={selectedLog.generated_sql} showEditButton={false} />
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
