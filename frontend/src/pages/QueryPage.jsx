import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code2, ChevronDown, ChevronUp } from 'lucide-react';

import { needsClarification } from '../lib/utils';

import QueryInput from '../components/query/QueryInput';
import QueryProgress from '../components/query/QueryProgress';
import QueryDetails from '../components/query/QueryDetails';
import ClarificationPanel from '../components/query/ClarificationPanel';
import SQLViewer from '../components/sql/SQLViewer';
import SQLEditor from '../components/sql/SQLEditor';
import SafetyPanel from '../components/safety/SafetyPanel';
import ApprovalPanel from '../components/approval/ApprovalPanel';
import ExecutionResult from '../components/execution/ExecutionResult';
import ErrorState from '../components/common/ErrorState';
import Button from '../components/common/Button';
import SafetyBlockedCard from '../components/safety/SafetyBlockedCard';

export default function QueryPage({ workflow }) {
  const [inputValue, setInputValue] = useState('');
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const {
    status,
    loadingMessage,
    queryResult,
    approvalResult,
    error,
    isEditing,
    editedSql,
    editError,
    submit,
    approve,
    reject,
    submitEdit,
    clarify,
    startEditing,
    cancelEditing,
    setEditedSql,
    reset,
  } = workflow;

  const loading = status === 'loading';

  const handleSubmit = () => {
    if (!inputValue.trim()) return;
    submit(inputValue.trim());
  };

  const handleReset = () => {
    reset();
    setInputValue('');
    setShowTechnicalDetails(false);
  };

  const needsClar = queryResult && needsClarification(queryResult);
  const isBlocked = queryResult?.workflow_status === 'blocked' || (queryResult?.risk_flags?.length > 0 && !queryResult?.generated_sql);
  const hasSQL = queryResult?.generated_sql;
  const isAwaiting = queryResult?.workflow_status === 'awaiting_approval';
  const executionDone = !!approvalResult?.execution_result;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

      {/* Natural Language Query Input */}
      <QueryInput
        value={inputValue}
        onChange={setInputValue}
        onSubmit={handleSubmit}
        loading={loading}
        onReset={queryResult ? handleReset : undefined}
      />

      {/* Interactive Live Rolling Console while loading */}
      <AnimatePresence>
        {loading && (
          <QueryProgress message={loadingMessage} />
        )}
      </AnimatePresence>

      {/* Error State */}
      <AnimatePresence>
        {status === 'error' && error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ErrorState
              title="Execution Problem"
              description={error}
              action={
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  Start over
                </Button>
              }
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Workspace */}
      <AnimatePresence>
        {queryResult && status !== 'loading' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            {/* Query Summary & Metadata */}
            <QueryDetails result={queryResult} />

            {/* 1. If Safety Blocked */}
            {isBlocked && (
              <SafetyBlockedCard
                result={queryResult}
                onRevise={() => {
                  const input = document.getElementById('nl-query-input');
                  if (input) {
                    input.focus();
                    input.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              />
            )}

            {/* 2. If Clarification Needed */}
            {!isBlocked && needsClar && (
              <ClarificationPanel
                question={queryResult.ask_questions}
                threadId={queryResult.thread_id}
                onSubmit={clarify}
                loading={loading}
              />
            )}

            {/* 3. If Awaiting Human Approval */}
            {!isBlocked && !needsClar && isAwaiting && !executionDone && (
              <div className="space-y-4">
                {/* Proposed SQL */}
                {hasSQL && (
                  isEditing ? (
                    <SQLEditor
                      originalSql={queryResult.generated_sql}
                      editedSql={editedSql}
                      onSqlChange={setEditedSql}
                      onCancel={cancelEditing}
                      onValidate={submitEdit}
                      loading={loading}
                      error={editError}
                    />
                  ) : (
                    <SQLViewer
                      sql={queryResult.generated_sql}
                      onEdit={startEditing}
                      showEditButton={true}
                    />
                  )
                )}

                {/* Approval Action Panel */}
                <ApprovalPanel
                  result={queryResult}
                  loading={loading}
                  onApprove={approve}
                  onReject={reject}
                  onEdit={startEditing}
                />
              </div>
            )}

            {/* 4. If Executed: Data Results Table is front and center! */}
            {executionDone && (
              <div className="space-y-4">
                <ExecutionResult
                  executionResult={approvalResult.execution_result}
                  intent={queryResult.intent}
                />

                {/* Collapsible Technical Details (SQL & AST Security Trace) */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                    className="flex items-center gap-2 text-xs font-mono font-medium text-[#d1c5a9] hover:text-[#00B7CD] bg-[#1d0f28] hover:bg-[#271435] border border-[#450C3F] px-4 py-2 rounded-xl transition-all"
                  >
                    <Code2 size={13} className="text-[#00B7CD]" />
                    <span>{showTechnicalDetails ? 'Hide Generated SQL & Security Details' : 'View Generated SQL & Security Details'}</span>
                    {showTechnicalDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>

                  <AnimatePresence>
                    {showTechnicalDetails && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 space-y-4 overflow-hidden"
                      >
                        {hasSQL && <SQLViewer sql={queryResult.generated_sql} showEditButton={false} />}
                        <SafetyPanel result={queryResult} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
