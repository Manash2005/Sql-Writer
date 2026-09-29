import { useEffect, useState } from 'react';
import { Terminal, CheckCircle2, Sparkles, Lock, ArrowDown } from 'lucide-react';
import Header from './components/layout/Header';
import QueryPage from './pages/QueryPage';
import HistoryPage from './pages/HistoryPage';
import AuditPage from './pages/AuditPage';
import DatabasePage from './pages/DatabasePage';
import { useQueryWorkflow } from './hooks/useQueryWorkflow';
import { useLocalHistory } from './hooks/useLocalHistory';
import { clearAuditLogs } from './lib/api';

import ConfirmModal from './components/common/ConfirmModal';

export default function App() {
  const workflow = useQueryWorkflow();
  const history = useLocalHistory();
  const [clearNotice, setClearNotice] = useState(false);
  const [showGlobalClearModal, setShowGlobalClearModal] = useState(false);

  // Sync history whenever we get a query result
  useEffect(() => {
    if (workflow.queryResult) {
      history.addOrUpdate(workflow.queryResult);
    }
  }, [workflow.queryResult]);

  // Also add to history after approval
  useEffect(() => {
    if (workflow.approvalResult && workflow.queryResult) {
      history.addOrUpdate({ ...workflow.queryResult, ...workflow.approvalResult });
    }
  }, [workflow.approvalResult, workflow.queryResult]);

  const onResumeHistory = (item) => {
    workflow.restoreState(item.data);
    const el = document.getElementById('workspace');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleClearAllData = async () => {
    history.clearHistory();
    workflow.reset();
    try {
      await clearAuditLogs();
    } catch {
      // ignore
    }
    setClearNotice(true);
    setTimeout(() => setClearNotice(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white selection:bg-[#76C457]/30 flex flex-col font-sans">
      {/* In-app Global Clear Confirmation Modal */}
      <ConfirmModal
        isOpen={showGlobalClearModal}
        onClose={() => setShowGlobalClearModal(false)}
        onConfirm={handleClearAllData}
        title="Reset All Sessions & Logs?"
        message="This will wipe all session history, reset the active query workspace, and clear the database audit logs. This cannot be undone."
        confirmText="Yes, Reset Everything"
        variant="danger"
      />

      {/* Header */}
      <Header onClearAll={() => setShowGlobalClearModal(true)} />

      {/* Clear notification banner */}
      {clearNotice && (
        <div className="fixed top-20 right-6 z-50 bg-[#12141a] border border-[#76C457]/40 text-[#76C457] px-4 py-2 rounded-xl text-xs font-semibold shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 size={15} />
          <span>All history and audit logs cleared!</span>
        </div>
      )}

      {/* Main Single Scroll Container */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-8 pt-24 pb-32 space-y-36">
        
        {/* STORY / HERO SECTION */}
        <section className="space-y-12 pt-6" id="hero">
          <div className="space-y-6 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#12141a] border border-white/[0.08] text-xs font-medium text-gray-300">
              <Sparkles size={14} className="text-[#76C457]" />
              <span>Designed for Everyone — Zero SQL Knowledge Needed</span>
            </div>

            <h1 className="font-display font-extrabold text-4xl sm:text-6xl text-white tracking-tight leading-[1.12]">
              Talk to your data in <span className="hl-green">plain English</span>, safely.
            </h1>

            <p className="text-base sm:text-lg text-gray-400 leading-relaxed font-sans font-normal">
              Ask questions naturally. Our AI translates your words into secure SQL queries, double-checks everything against the database rules, and{' '}
              <span className="text-white font-medium">always waits for your confirmation</span> before running.
            </p>

            <div className="flex items-center gap-4 pt-2">
              <a
                href="#workspace"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-[#76C457] text-black hover:bg-[#86d965] shadow-[0_0_20px_rgba(118,196,87,0.4)] transition-all active:scale-95"
              >
                <span>Try It in the Workspace</span>
                <ArrowDown size={15} />
              </a>

              <a
                href="#database"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm bg-white/[0.05] hover:bg-white/[0.1] text-gray-300 hover:text-white border border-white/[0.08] transition-colors"
              >
                <span>Inspect Database</span>
              </a>
            </div>
          </div>
          
          {/* 3 Value Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-white/[0.08]">
            <div className="p-6 rounded-2xl bg-[#0c0d12] border border-white/[0.06] space-y-3">
              <div className="h-10 w-10 rounded-xl bg-[#76C457]/10 flex items-center justify-center text-[#76C457]">
                <Terminal size={20} />
              </div>
              <h3 className="font-display font-bold text-lg text-white">1. Speak Naturally</h3>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                Type questions like &ldquo;Who are our top customers?&rdquo; or &ldquo;Show pending orders&rdquo;. No database syntax required.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0c0d12] border border-white/[0.06] space-y-3">
              <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
                <Lock size={20} />
              </div>
              <h3 className="font-display font-bold text-lg text-white">2. Deterministic Safety</h3>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                Queries are strictly validated against schema guardrails. Dangerous operations or unrestricted deletions are blocked immediately.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0c0d12] border border-white/[0.06] space-y-3">
              <div className="h-10 w-10 rounded-xl bg-white/[0.08] flex items-center justify-center text-white">
                <CheckCircle2 size={20} />
              </div>
              <h3 className="font-display font-bold text-lg text-white">3. Human in the Loop</h3>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                Nothing touches the database until you review the plan and click Approve. You remain in complete control at every step.
              </p>
            </div>
          </div>
        </section>

        {/* DATABASE EXPLORER SECTION */}
        <section className="space-y-6 scroll-mt-24" id="database">
          <div className="bg-[#0c0d12] border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl">
            <DatabasePage />
          </div>
        </section>

        {/* WORKSPACE SECTION */}
        <section className="space-y-6 scroll-mt-24" id="workspace">
          <div className="space-y-2">
            <h2 className="font-display font-bold text-3xl text-white tracking-tight flex items-center gap-3">
              <Terminal className="text-[#76C457]" size={26} /> Query Workspace
            </h2>
            <p className="text-sm text-gray-400 max-w-2xl font-sans">
              Type your question below or click any quick idea. The agent will parse your intent, construct the SQL, and ask for your approval.
            </p>
          </div>
          <div className="bg-[#0c0d12] border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl">
            <QueryPage workflow={workflow} />
          </div>
        </section>

        {/* SESSION HISTORY SECTION */}
        <section className="space-y-6 scroll-mt-24" id="history">
          <div className="bg-[#0c0d12] border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl">
            <HistoryPage
              history={history.history}
              onResume={onResumeHistory}
              onClear={history.clearHistory}
            />
          </div>
        </section>

        {/* AUDIT LOGS SECTION */}
        <section className="space-y-6 scroll-mt-24" id="audit">
          <div className="bg-[#0c0d12] border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl">
            <AuditPage />
          </div>
        </section>

      </main>

      {/* Minimalist Footer */}
      <footer className="border-t border-white/[0.08] py-10 bg-black/60 text-center text-xs text-gray-500 font-sans space-y-2">
        <p className="font-medium text-gray-400">
          Natural Language to SQL Assistant &bull; Safety-First Architecture
        </p>
        <p className="text-gray-600">
          Deterministic Validation &bull; Human-in-the-Loop Approval &bull; SQLite Sandbox
        </p>
      </footer>
    </div>
  );
}
