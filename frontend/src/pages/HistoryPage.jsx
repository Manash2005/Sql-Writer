import { useState } from 'react';
import { History as HistoryIcon, Clock, Play, Trash2, ArrowUpRight } from 'lucide-react';
import { formatTime, shortId } from '../lib/utils';
import Drawer from '../components/common/Drawer';
import SQLViewer from '../components/sql/SQLViewer';

import ConfirmModal from '../components/common/ConfirmModal';

const STATUS_BADGES = {
  awaiting_approval: { label: 'Awaiting Approval', cls: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' },
  awaiting_clarification: { label: 'Needs Clarification', cls: 'bg-orange-500/15 text-orange-300 border-orange-500/30' },
  completed: { label: 'Executed', cls: 'bg-[#76C457]/15 text-[#76C457] border-[#76C457]/30' },
  approved: { label: 'Approved', cls: 'bg-[#76C457]/15 text-[#76C457] border-[#76C457]/30' },
  rejected: { label: 'Cancelled', cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
  blocked: { label: 'Blocked by Safety', cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
  processing: { label: 'Processing', cls: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
};

export default function HistoryPage({ history, onResume, onClear }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [showClearModal, setShowClearModal] = useState(false);

  return (
    <div className="space-y-6">
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <h3 className="font-display font-bold text-2xl text-white tracking-tight flex items-center gap-2.5">
            <HistoryIcon className="text-[#76C457]" size={22} />
            Session History
          </h3>
          <p className="text-sm text-gray-400 mt-1 font-sans">
            Revisit previous queries or resume any pending workflows right where you left off.
          </p>
        </div>

        {history.length > 0 && onClear && (
          <button
            onClick={() => setShowClearModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all self-end sm:self-auto"
          >
            <Trash2 size={13} />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* History List */}
      {history.length === 0 ? (
        <div className="p-12 rounded-2xl border border-white/[0.08] bg-[#0c0d12] text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-[#76C457]/10 flex items-center justify-center mx-auto text-[#76C457]">
            <HistoryIcon size={24} />
          </div>
          <h4 className="font-display font-bold text-base text-white">No query history yet</h4>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Queries you submit in the Workspace will be saved here so you can re-run them or inspect the generated SQL.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => {
            const badge = STATUS_BADGES[item.workflow_status] || {
              label: item.workflow_status || 'Unknown',
              cls: 'bg-white/10 text-gray-300 border-white/10',
            };
            const isAwaiting = item.workflow_status === 'awaiting_approval' || item.workflow_status === 'awaiting_clarification';

            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl border border-white/[0.08] bg-[#0c0d12] hover:border-white/20 hover:bg-[#10121a] transition-all shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                {/* Left Details */}
                <div
                  onClick={() => setSelectedItem(item)}
                  className="space-y-2 flex-1 min-w-0 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs font-mono text-gray-400 flex items-center gap-1">
                      <Clock size={12} />
                      {formatTime(item.timestamp, 'datetime')}
                    </span>
                    <span className="text-gray-600">•</span>
                    <span className="text-xs font-mono text-gray-400">
                      #{shortId(item.id)}
                    </span>
                  </div>

                  <p className="font-medium text-base text-white leading-snug group-hover:text-[#76C457] transition-colors truncate">
                    &ldquo;{item.request}&rdquo;
                  </p>

                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${badge.cls}`}>
                      {badge.label}
                    </span>
                    {item.intent && (
                      <span className="text-[11px] font-mono text-gray-400 px-2 py-0.5 rounded bg-white/[0.04]">
                        {item.intent.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
                  <button
                    onClick={() => onResume(item)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#76C457] text-black hover:bg-[#86d965] shadow-[0_0_14px_rgba(118,196,87,0.3)] transition-all active:scale-95"
                  >
                    <Play size={12} fill="currentColor" />
                    <span>{isAwaiting ? 'Resume Workflow' : 'Load in Workspace'}</span>
                  </button>

                  <button
                    onClick={() => setSelectedItem(item)}
                    className="p-2 rounded-xl bg-white/[0.04] text-gray-400 hover:text-white hover:bg-white/[0.08] transition-colors"
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
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-gray-400">
                User Question
              </span>
              <p className="text-base text-white font-medium p-3.5 rounded-xl bg-black/50 border border-white/[0.08]">
                &ldquo;{selectedItem.request}&rdquo;
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                <span className="text-gray-400 text-[10px] uppercase font-mono">Time</span>
                <p className="text-white font-mono">{formatTime(selectedItem.timestamp, 'datetime')}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                <span className="text-gray-400 text-[10px] uppercase font-mono">Session ID</span>
                <p className="text-white font-mono">{shortId(selectedItem.id)}</p>
              </div>
            </div>

            {selectedItem.data?.generated_sql && (
              <div className="space-y-2">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-gray-400">
                  Compiled SQL
                </span>
                <SQLViewer sql={selectedItem.data.generated_sql} showEditButton={false} />
              </div>
            )}

            <div className="pt-4 border-t border-white/[0.08]">
              <button
                onClick={() => {
                  onResume(selectedItem);
                  setSelectedItem(null);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-[#76C457] text-black hover:bg-[#86d965] shadow-[0_0_16px_rgba(118,196,87,0.35)] transition-all"
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
