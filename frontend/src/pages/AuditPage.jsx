import { useState, useEffect, useCallback } from 'react';
import { Shield, Search, RefreshCw, Trash2, CheckCircle2, Clock, Eye } from 'lucide-react';
import { getAllAuditLogs, clearAuditLogs } from '../lib/api';
import { safeJsonParse, formatTime, shortId } from '../lib/utils';
import Drawer from '../components/common/Drawer';
import AuditDetails from '../components/audit/AuditDetails';

import ConfirmModal from '../components/common/ConfirmModal';

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showClearModal, setShowClearModal] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAllAuditLogs();
      const raw = res.logs || [];
      
      // Deduplicate by thread_id, keeping the newest / most advanced record
      const threadMap = new Map();
      for (const item of raw) {
        if (!threadMap.has(item.thread_id)) {
          threadMap.set(item.thread_id, item);
        } else {
          // If existing doesn't have decision but this one does, update
          const cur = threadMap.get(item.thread_id);
          if (!cur.human_decision && item.human_decision) {
            threadMap.set(item.thread_id, item);
          }
        }
      }

      const deduplicated = Array.from(threadMap.values()).map((log) => ({
        ...log,
        risk_flags: safeJsonParse(log.risk_flags, []),
        execution_result: safeJsonParse(log.execution_result, null),
      }));

      // Sort newest first
      deduplicated.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setLogs(deduplicated);
    } catch (err) {
      setError(err.message || 'Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleClearLogs = async () => {
    try {
      await clearAuditLogs();
      setLogs([]);
    } catch (err) {
      setError('Failed to clear logs: ' + err.message);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.user_request?.toLowerCase().includes(q) ||
      log.intent?.toLowerCase().includes(q) ||
      log.human_decision?.toLowerCase().includes(q) ||
      log.thread_id?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <h3 className="font-display font-bold text-2xl text-white tracking-tight flex items-center gap-2.5">
            <Shield className="text-[#76C457]" size={22} />
            Security &amp; Activity Audit Log
          </h3>
          <p className="text-sm text-gray-400 mt-1 font-sans">
            Every query, safety check, and human approval decision is recorded for full compliance.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* Search */}
          <div className="relative flex-1 sm:flex-initial min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search audit trail…"
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#12141a] border border-white/[0.1] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#76C457] transition-colors"
            />
          </div>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-2.5 rounded-xl border border-white/[0.08] hover:border-white/20 bg-[#12141a] text-gray-300 hover:text-white transition-colors"
            title="Refresh logs"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>

          {logs.length > 0 && (
            <button
              onClick={() => setShowClearModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all"
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
        <div className="p-12 text-center space-y-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[#76C457] border-t-transparent" />
          <p className="text-sm text-gray-400 font-medium">Loading audit records…</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/10 text-center space-y-2">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={fetchLogs}
            className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && logs.length === 0 && (
        <div className="p-12 rounded-2xl border border-white/[0.08] bg-[#0c0d12] text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-[#76C457]/10 flex items-center justify-center mx-auto text-[#76C457]">
            <Shield size={24} />
          </div>
          <h4 className="font-display font-bold text-base text-white">No audit records yet</h4>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Once you ask a question in the Workspace and execute or cancel it, the immutable audit trail will be logged here.
          </p>
        </div>
      )}

      {/* Audit Story Cards */}
      <div className="space-y-3">
        {filteredLogs.map((log) => {
          const isApproved = log.human_decision === 'approved';
          const isRejected = log.human_decision === 'rejected';
          const hasFlags = log.risk_flags && log.risk_flags.length > 0;
          const success = log.execution_result?.success;
          const isRead = log.intent?.toLowerCase() === 'read';

          return (
            <div
              key={log.id}
              onClick={() => setSelectedLog(log)}
              className="p-5 rounded-2xl border border-white/[0.08] bg-[#0c0d12] hover:border-white/20 hover:bg-[#10121a] cursor-pointer transition-all shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 group"
            >
              {/* Left Details */}
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-xs font-mono text-gray-400 flex items-center gap-1">
                    <Clock size={12} />
                    {formatTime(log.created_at, 'datetime')}
                  </span>
                  <span className="text-gray-600">•</span>
                  <span className="text-xs font-mono text-gray-400">
                    ID: {shortId(log.thread_id)}
                  </span>
                  <span className="text-gray-600">•</span>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${isRead ? 'hl-green' : 'hl-orange'}`}>
                    {isRead ? 'DATA READ' : 'DATA WRITE'}
                  </span>
                </div>

                <p className="font-medium text-base text-white leading-snug group-hover:text-[#76C457] transition-colors truncate">
                  &ldquo;{log.user_request}&rdquo;
                </p>

                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>
                    Safety:{' '}
                    {hasFlags ? (
                      <span className="text-orange-400 font-semibold">
                        ⚠️ {log.risk_flags.length} Flag{log.risk_flags.length > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-[#76C457] font-semibold">✓ Verified Safe</span>
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
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#76C457]/15 text-[#76C457] border border-[#76C457]/30">
                      <CheckCircle2 size={13} />
                      {success === true ? 'Executed' : 'Approved'}
                    </span>
                  ) : isRejected ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                      Cancelled
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      Pending Action
                    </span>
                  )}
                </div>

                <div className="p-2 rounded-xl bg-white/[0.04] text-gray-400 group-hover:text-white group-hover:bg-white/[0.08] transition-colors">
                  <Eye size={15} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Details Drawer */}
      <Drawer
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Audit Record Details"
      >
        {selectedLog && <AuditDetails log={selectedLog} />}
      </Drawer>
    </div>
  );
}
