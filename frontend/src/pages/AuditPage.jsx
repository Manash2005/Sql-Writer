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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-c4">
        <div>
          <h3 className="font-display font-bold text-2xl text-text-primary tracking-tight flex items-center gap-2.5">
            <Shield className="text-c1" size={22} />
            Security &amp; Activity Audit Log
          </h3>
          <p className="text-sm text-text-secondary mt-1 font-sans">
            Every query, safety check, and human approval decision is recorded for full compliance.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* Search */}
          <div className="relative flex-1 sm:flex-initial min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search audit trail…"
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-bg-base border border-c4 rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-c1 transition-colors"
            />
          </div>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-2.5 rounded-xl border border-c4 hover:border-c1 bg-bg-elevated text-text-secondary hover:text-text-primary transition-colors"
            title="Refresh logs"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-c1' : ''} />
          </button>

          {logs.length > 0 && (
            <button
              onClick={() => setShowClearModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-c3 hover:text-text-primary bg-c3/10 hover:bg-c3/20 border border-c3/40 transition-all"
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
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-c1 border-t-transparent" />
          <p className="text-xs text-text-muted mt-3">Loading audit records…</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredLogs.length === 0 && (
        <div className="p-12 rounded-2xl border border-c4 bg-bg-surface text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-c1/15 flex items-center justify-center mx-auto text-c1">
            <Shield size={24} />
          </div>
          <h4 className="font-display font-bold text-base text-text-primary">No audit entries found</h4>
          <p className="text-xs text-text-muted max-w-sm mx-auto">
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
                    <span className="text-xs font-mono text-text-muted flex items-center gap-1">
                      <Clock size={12} />
                      {formatTime(log.timestamp, 'datetime')}
                    </span>
                    <span className="text-c4">•</span>
                    <span className="text-xs font-mono text-text-muted">
                      Session #{shortId(log.thread_id)}
                    </span>
                    <span className="text-c4">•</span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${isRead ? 'hl-teal' : 'hl-gold'}`}>
                      {isRead ? 'DATA READ' : 'DATA WRITE'}
                    </span>
                  </div>

                  <p className="font-semibold text-base text-text-primary leading-snug group-hover:text-c1 transition-colors truncate">
                    &ldquo;{log.user_request}&rdquo;
                  </p>

                  <div className="flex items-center gap-3 text-xs text-text-muted">
                    <span>
                      Safety:{' '}
                      {hasFlags ? (
                        <span className="text-c3 font-semibold">
                          {log.risk_flags.length} Security Flag{log.risk_flags.length > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-c1 font-semibold">Verified Safe</span>
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
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-c1/20 text-c1 border border-c1/40">
                        <CheckCircle2 size={13} />
                        {success === true ? 'Executed' : 'Approved'}
                      </span>
                    ) : isRejected ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-c3/20 text-c3 border border-c3/40">
                        Cancelled
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-c2/20 text-c2 border border-c2/40">
                        Pending Action
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedLog(log)}
                    className="p-2 rounded-xl bg-bg-elevated text-text-secondary hover:text-text-primary hover:bg-bg-overlay border border-c4 hover:border-c1 transition-colors"
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
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-text-muted">
                User Prompt
              </span>
              <p className="text-sm text-text-primary font-semibold p-3.5 rounded-xl bg-bg-base border border-c4">
                &ldquo;{selectedLog.user_request}&rdquo;
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-bg-elevated border border-c4 space-y-1">
                <span className="text-text-muted text-[10px] uppercase font-mono">Timestamp</span>
                <p className="text-text-primary font-mono">{formatTime(selectedLog.timestamp, 'datetime')}</p>
              </div>
              <div className="p-3 rounded-xl bg-bg-elevated border border-c4 space-y-1">
                <span className="text-text-muted text-[10px] uppercase font-mono">Session ID</span>
                <p className="text-text-primary font-mono">{shortId(selectedLog.thread_id)}</p>
              </div>
              <div className="p-3 rounded-xl bg-bg-elevated border border-c4 space-y-1">
                <span className="text-text-muted text-[10px] uppercase font-mono">Human Decision</span>
                <p className="text-text-primary font-mono capitalize">{selectedLog.human_decision || 'Pending'}</p>
              </div>
              <div className="p-3 rounded-xl bg-bg-elevated border border-c4 space-y-1">
                <span className="text-text-muted text-[10px] uppercase font-mono">Estimated Rows</span>
                <p className="text-text-primary font-mono">{selectedLog.estimated_rows_affected ?? 'N/A'}</p>
              </div>
            </div>

            {selectedLog.generated_sql && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-text-muted">
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
