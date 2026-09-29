import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Terminal, CheckCircle2, Lock, ArrowDown, Shield, Database, Sparkles } from 'lucide-react';
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
    <div className="relative min-h-screen bg-[#0d0611] text-[#FFF1D1] selection:bg-[#B9D175]/30 selection:text-[#FFF1D1] flex flex-col font-sans overflow-x-hidden">
      {/* Background Grid Lines (Engineered mathematical grid, zero gradients) */}
      <div className="fixed inset-0 pointer-events-none bg-grid-lines opacity-60 z-0" />
      <div className="fixed inset-0 pointer-events-none bg-grid-dense opacity-20 z-0" />

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
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-20 right-6 z-50 glass-panel border border-[#B9D175]/80 text-[#B9D175] px-4 py-2.5 rounded-xl text-xs font-semibold shadow-2xl flex items-center gap-2"
        >
          <CheckCircle2 size={16} />
          <span>All history and audit logs cleared!</span>
        </motion.div>
      )}

      {/* Main Single Scroll Container */}
      <main className="relative z-10 flex-1 w-full max-w-5xl mx-auto px-4 sm:px-8 pt-24 pb-28 space-y-24">
        
        {/* STORY / HERO SECTION */}
        <section className="space-y-10 pt-4" id="hero">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="space-y-5 max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel border border-[#450C3F] text-xs font-mono text-[#d1c5a9] animate-float-slow">
              <span className="w-2 h-2 rounded-full bg-[#B9D175] animate-pulse" />
              <span>Safety-First SQL Generation Engine</span>
            </div>

            <h1 className="font-display font-extrabold text-4xl sm:text-6xl text-[#FFF1D1] tracking-tight leading-[1.12]">
              Query your database in <span className="hl-lime">plain English</span>, with zero risk.
            </h1>

            <p className="text-base sm:text-lg text-[#d1c5a9] leading-relaxed font-sans font-normal">
              State machine agent with dual-layer protection: deterministic AST validation intercepts destructive queries, and every state mutation halts for operator confirmation.
            </p>

            <div className="flex items-center gap-4 pt-1">
              <a
                href="#workspace"
                className="btn-3d-lime inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm transition-transform active:scale-95"
              >
                <span>Open Workspace</span>
                <ArrowDown size={14} className="text-[#0d0611]" />
              </a>

              <a
                href="#database"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm glass-panel hover:bg-[#271435] text-[#d1c5a9] hover:text-[#FFF1D1] border border-[#450C3F] transition-all active:scale-95"
              >
                <span>Live Schema &amp; Data</span>
              </a>
            </div>
          </motion.div>
          
          {/* 3 Core Architecture Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="glass-panel p-5 rounded-2xl space-y-2.5 transition-all"
            >
              <div className="h-9 w-9 rounded-lg bg-[#00B7CD]/20 border border-[#00B7CD]/40 flex items-center justify-center text-[#00B7CD]">
                <Terminal size={18} />
              </div>
              <h3 className="font-display font-bold text-base text-[#FFF1D1]">Natural Language Ingestion</h3>
              <p className="text-xs text-[#d1c5a9] leading-relaxed">
                Translates high-level business queries into standard SQL using Groq Qwen with automatic failover to OpenRouter.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="glass-panel p-5 rounded-2xl space-y-2.5 transition-all"
            >
              <div className="h-9 w-9 rounded-lg bg-[#DF301C]/20 border border-[#DF301C]/40 flex items-center justify-center text-[#DF301C]">
                <Lock size={18} />
              </div>
              <h3 className="font-display font-bold text-base text-[#FFF1D1]">Deterministic AST Guard</h3>
              <p className="text-xs text-[#d1c5a9] leading-relaxed">
                Independent AST security parser hard-blocks DROP, ALTER, and unbounded mass UPDATE/DELETE statements.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="glass-panel p-5 rounded-2xl space-y-2.5 transition-all"
            >
              <div className="h-9 w-9 rounded-lg bg-[#B9D175]/20 border border-[#B9D175]/40 flex items-center justify-center text-[#B9D175]">
                <CheckCircle2 size={18} />
              </div>
              <h3 className="font-display font-bold text-base text-[#FFF1D1]">Human in the Loop</h3>
              <p className="text-xs text-[#d1c5a9] leading-relaxed">
                State machine interrupts before database execution, presenting exact statement preview and row impact for your sign-off.
              </p>
            </motion.div>
          </div>
        </section>

        {/* WORKSPACE SECTION (Primary User Focus) */}
        <section className="space-y-4 scroll-mt-24" id="workspace">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#FFF1D1] tracking-tight flex items-center gap-2.5">
                <Terminal className="text-[#00B7CD]" size={24} /> Execution Workspace
              </h2>
              <p className="text-xs sm:text-sm text-[#8c826c] font-sans">
                Submit questions below. Review proposed queries and execute inside the secured sandbox.
              </p>
            </div>
          </div>
          <div className="glass-card-3d rounded-3xl p-6 sm:p-8">
            <QueryPage workflow={workflow} />
          </div>
        </section>

        {/* DATABASE EXPLORER SECTION */}
        <section className="space-y-4 scroll-mt-24" id="database">
          <div className="space-y-1">
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#FFF1D1] tracking-tight flex items-center gap-2.5">
              <Database className="text-[#B9D175]" size={24} /> Sandbox Database &amp; Schema
            </h2>
            <p className="text-xs sm:text-sm text-[#8c826c]">
              Live tables, schema definitions, and records populated in the local SQLite sandbox.
            </p>
          </div>
          <div className="glass-card-3d rounded-3xl p-6 sm:p-8">
            <DatabasePage />
          </div>
        </section>

        {/* SESSION HISTORY SECTION */}
        <section className="space-y-4 scroll-mt-24" id="history">
          <div className="space-y-1">
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#FFF1D1] tracking-tight">
              Session History
            </h2>
            <p className="text-xs sm:text-sm text-[#8c826c]">
              Chronological log of queries and decisions in your active session.
            </p>
          </div>
          <div className="glass-card-3d rounded-3xl p-6 sm:p-8">
            <HistoryPage
              history={history.history}
              onResume={onResumeHistory}
              onClear={history.clearHistory}
            />
          </div>
        </section>

        {/* AUDIT LOGS SECTION */}
        <section className="space-y-4 scroll-mt-24" id="audit">
          <div className="space-y-1">
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#FFF1D1] tracking-tight flex items-center gap-2.5">
              <Shield className="text-[#FF9100]" size={24} /> Security Audit Logs
            </h2>
            <p className="text-xs sm:text-sm text-[#8c826c]">
              Immutable database audit trail recording every request, AST validation score, and human approval.
            </p>
          </div>
          <div className="glass-card-3d rounded-3xl p-6 sm:p-8">
            <AuditPage />
          </div>
        </section>

      </main>

      {/* Minimalist Footer */}
      <footer className="relative z-10 border-t border-[#450C3F] py-10 bg-[#0d0611]/90 backdrop-blur-md text-center text-xs font-sans space-y-2">
        <p className="font-semibold text-[#d1c5a9]">
          Natural Language to SQL Assistant &bull; Safety-First Architecture
        </p>
        <p className="text-[#8c826c]">
          Deterministic Validation &bull; Human-in-the-Loop Approval &bull; SQLite Sandbox
        </p>
      </footer>
    </div>
  );
}
