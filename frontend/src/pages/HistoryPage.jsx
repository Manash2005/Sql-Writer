import { useState } from 'react';
import { History as HistoryIcon, Clock, Play, Trash2, ArrowUpRight } from 'lucide-react';
import { formatTime, shortId } from '../lib/utils';
import Drawer from '../components/common/Drawer';
import SQLViewer from '../components/sql/SQLViewer';
import ConfirmModal from '../components/common/ConfirmModal';

const STATUS_BADGES = {
  awaiting_approval: { label: 'Awaiting Approval', cls: 'bg-c2/20 text-c2 border-c2/40' },
  awaiting_clarification: { label: 'Needs Clarification', cls: 'bg-c1/20 text-c1 border-c1/40' },
  completed: { label: 'Executed', cls: 'bg-c1/20 text-c1 border-c1/40' },
  approved: { label: 'Approved', cls: 'bg-c1/20 text-c1 border-c1/40' },
  rejected: { label: 'Cancelled', cls: 'bg-c3/20 text-c3 border-c3/40' },
  blocked: { label: 'Blocked by Safety', cls: 'bg-c3/20 text-c3 border-c3/40' },
  processing: { label: 'Processing', cls: 'bg-c1/20 text-c1 border-c1/40' },
};

export default function HistoryPage({ history, onResume, onClear }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [showClearModal, setShowClearModal] = useState(false);

  return (
    <div className="space-y-6 font-sans">
      {/* In-app Clear Confirmation Modal */}
      <ConfirmModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={onClear}
        title="Clear Session History?"
        message="This will remove all saved queries from your local session. This action cannot be reversed."
        confirmText="Yes, Clear History"
        variant="danger"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-c4">
        <div>
          <h3 className="font-display font-bold text-2xl text-text-primary tracking-tight flex items-center gap-2.5">
            <HistoryIcon className="text-c1" size={22} />
            Session History
          </h3>
          <p className="text-sm text-text-secondary mt-1 font-sans">
            Revisit previous queries or resume any pending workflows right where you left off.
          </p>
        </div>

        {history.length > 0 && onClear && (
          <button
            onClick={() => setShowClearModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-c3 hover:text-text-primary bg-c3/10 hover:bg-c3/20 border border-c3/40 transition-all self-end sm:self-auto"
          >
            <Trash2 size={13} />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* History List */}
      {history.length === 0 ? (
        <div className="p-12 rounded-2xl border border-c4 bg-bg-surface text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-c1/15 flex items-center justify-center mx-auto text-c1">
            <HistoryIcon size={24} />
          </div>
          <h4 className="font-display font-bold text-base text-text-primary">No query history yet</h4>
          <p className="text-xs text-text-muted max-w-sm mx-auto">
            Queries you submit in the Workspace will be saved here so you can re-run them or inspect the generated SQL.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => {
            const badge = STATUS_BADGES[item.workflow_status] || {
              label: item.workflow_status || 'Unknown',
              cls: 'bg-bg-surface text-text-secondary border-c4',
            };
            const isAwaiting = item.workflow_status === 'awaiting_approval' || item.workflow_status === 'awaiting_clarification';

            return (
              <div
                key={item.id}
                className="card-3d p-4 sm:p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 group transition-all"
              >
                {/* Left Info */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-text-muted flex items-center gap-1">
                      <Clock size={12} />
                      {formatTime(item.timestamp, 'datetime')}
                    </span>
                    <span className="text-c4">•</span>
                    <span className="text-xs font-mono text-text-muted">
                      #{shortId(item.id)}
                    </span>
                  </div>

                  <p className="font-semibold text-base text-text-primary leading-snug group-hover:text-c1 transition-colors truncate">
                    &ldquo;{item.request}&rdquo;
                  </p>

                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${badge.cls}`}>
                      {badge.label}
                    </span>
                    {item.intent && (
                      <span className="text-[11px] font-mono text-text-muted px-2 py-0.5 rounded bg-bg-elevated border border-c4">
                        {item.intent.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
                  <button
                    onClick={() => onResume(item)}
                    className="btn-3d-teal flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
                  >
                    <Play size={12} fill="currentColor" />
                    <span>{isAwaiting ? 'Resume Workflow' : 'Load in Workspace'}</span>
                  </button>

                  <button
                    onClick={() => setSelectedItem(item)}
                    className="p-2 rounded-xl bg-bg-elevated text-text-secondary hover:text-text-primary hover:bg-bg-overlay border border-c4 hover:border-c1 transition-colors"
                    title="View details"
                  >
                    <ArrowUpRight size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Drawer */}
      <Drawer
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title="Query Details"
      >
        {selectedItem && (
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-text-muted">
                User Question
              </span>
              <p className="text-base text-text-primary font-semibold p-3.5 rounded-xl bg-bg-base border border-c4">
                &ldquo;{selectedItem.request}&rdquo;
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-bg-elevated border border-c4 space-y-1">
                <span className="text-text-muted text-[10px] uppercase font-mono">Time</span>
                <p className="text-text-primary font-mono">{formatTime(selectedItem.timestamp, 'datetime')}</p>
              </div>
              <div className="p-3 rounded-xl bg-bg-elevated border border-c4 space-y-1">
                <span className="text-text-muted text-[10px] uppercase font-mono">Session ID</span>
                <p className="text-text-primary font-mono">{shortId(selectedItem.id)}</p>
              </div>
            </div>

            {selectedItem.data?.generated_sql && (
              <div className="space-y-2">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-text-muted">
                  Compiled SQL
                </span>
                <SQLViewer sql={selectedItem.data.generated_sql} showEditButton={false} />
              </div>
            )}

            <div className="pt-4 border-t border-c4">
              <button
                onClick={() => {
                  onResume(selectedItem);
                  setSelectedItem(null);
                }}
                className="btn-3d-teal w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold"
              >
                <Play size={14} fill="currentColor" />
                <span>Open in Workspace</span>
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
