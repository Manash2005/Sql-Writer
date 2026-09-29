import { useState } from 'react';
import { History as HistoryIcon, Clock, Play, Trash2, ArrowUpRight } from 'lucide-react';
import { formatTime, shortId } from '../lib/utils';
import Drawer from '../components/common/Drawer';
import SQLViewer from '../components/sql/SQLViewer';
import ConfirmModal from '../components/common/ConfirmModal';

const STATUS_BADGES = {
  awaiting_approval: { label: 'Awaiting Approval', cls: 'bg-[#FF9100]/20 text-[#FF9100] border-[#FF9100]/40' },
  awaiting_clarification: { label: 'Needs Clarification', cls: 'bg-[#00B7CD]/20 text-[#00B7CD] border-[#00B7CD]/40' },
  completed: { label: 'Executed', cls: 'bg-[#B9D175]/20 text-[#B9D175] border-[#B9D175]/40' },
  approved: { label: 'Approved', cls: 'bg-[#B9D175]/20 text-[#B9D175] border-[#B9D175]/40' },
  rejected: { label: 'Cancelled', cls: 'bg-[#DF301C]/20 text-[#DF301C] border-[#DF301C]/40' },
  blocked: { label: 'Blocked by Safety', cls: 'bg-[#DF301C]/20 text-[#DF301C] border-[#DF301C]/40' },
  processing: { label: 'Processing', cls: 'bg-[#00B7CD]/20 text-[#00B7CD] border-[#00B7CD]/40' },
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#450C3F]">
        <div>
          <h3 className="font-display font-bold text-2xl text-[#FFF1D1] tracking-tight flex items-center gap-2.5">
            <HistoryIcon className="text-[#B9D175]" size={22} />
            Session History
          </h3>
          <p className="text-sm text-[#d1c5a9] mt-1 font-sans">
            Revisit previous queries or resume any pending workflows right where you left off.
          </p>
        </div>

        {history.length > 0 && onClear && (
          <button
            onClick={() => setShowClearModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#DF301C] hover:text-[#FFF1D1] bg-[#DF301C]/10 hover:bg-[#DF301C]/20 border border-[#DF301C]/30 transition-all self-end sm:self-auto"
          >
            <Trash2 size={13} />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* History List */}
      {history.length === 0 ? (
        <div className="p-12 rounded-2xl border border-[#450C3F] bg-[#140a1b] text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-[#B9D175]/15 flex items-center justify-center mx-auto text-[#B9D175]">
            <HistoryIcon size={24} />
          </div>
          <h4 className="font-display font-bold text-base text-[#FFF1D1]">No query history yet</h4>
          <p className="text-xs text-[#8c826c] max-w-sm mx-auto">
            Queries you submit in the Workspace will be saved here so you can re-run them or inspect the generated SQL.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => {
            const badge = STATUS_BADGES[item.workflow_status] || {
              label: item.workflow_status || 'Unknown',
              cls: 'bg-[#140a1b] text-[#d1c5a9] border-[#450C3F]',
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
                    <span className="text-xs font-mono text-[#8c826c] flex items-center gap-1">
                      <Clock size={12} />
                      {formatTime(item.timestamp, 'datetime')}
                    </span>
                    <span className="text-[#450C3F]">•</span>
                    <span className="text-xs font-mono text-[#8c826c]">
                      #{shortId(item.id)}
                    </span>
                  </div>

                  <p className="font-semibold text-base text-[#FFF1D1] leading-snug group-hover:text-[#B9D175] transition-colors truncate">
                    &ldquo;{item.request}&rdquo;
                  </p>

                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${badge.cls}`}>
                      {badge.label}
                    </span>
                    {item.intent && (
                      <span className="text-[11px] font-mono text-[#8c826c] px-2 py-0.5 rounded bg-[#1d0f28] border border-[#450C3F]">
                        {item.intent.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
                  <button
                    onClick={() => onResume(item)}
                    className="btn-3d-lime flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
                  >
                    <Play size={12} fill="currentColor" />
                    <span>{isAwaiting ? 'Resume Workflow' : 'Load in Workspace'}</span>
                  </button>

                  <button
                    onClick={() => setSelectedItem(item)}
                    className="p-2 rounded-xl bg-[#1d0f28] text-[#d1c5a9] hover:text-[#FFF1D1] hover:bg-[#271435] border border-[#450C3F] transition-colors"
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
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#8c826c]">
                User Question
              </span>
              <p className="text-base text-[#FFF1D1] font-semibold p-3.5 rounded-xl bg-[#0d0611] border border-[#450C3F]">
                &ldquo;{selectedItem.request}&rdquo;
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#1d0f28] border border-[#450C3F] space-y-1">
                <span className="text-[#8c826c] text-[10px] uppercase font-mono">Time</span>
                <p className="text-[#FFF1D1] font-mono">{formatTime(selectedItem.timestamp, 'datetime')}</p>
              </div>
              <div className="p-3 rounded-xl bg-[#1d0f28] border border-[#450C3F] space-y-1">
                <span className="text-[#8c826c] text-[10px] uppercase font-mono">Session ID</span>
                <p className="text-[#FFF1D1] font-mono">{shortId(selectedItem.id)}</p>
              </div>
            </div>

            {selectedItem.data?.generated_sql && (
              <div className="space-y-2">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#8c826c]">
                  Compiled SQL
                </span>
                <SQLViewer sql={selectedItem.data.generated_sql} showEditButton={false} />
              </div>
            )}

            <div className="pt-4 border-t border-[#450C3F]">
              <button
                onClick={() => {
                  onResume(selectedItem);
                  setSelectedItem(null);
                }}
                className="btn-3d-lime w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold"
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
