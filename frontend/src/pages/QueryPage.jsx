import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
  };

  const needsClar = queryResult && needsClarification(queryResult);
  const isBlocked = queryResult?.workflow_status === 'blocked' || (queryResult?.risk_flags?.length > 0 && !queryResult?.generated_sql);
  const hasSQL = queryResult?.generated_sql;
  const isAwaiting = queryResult?.workflow_status === 'awaiting_approval';
  const executionDone = !!approvalResult?.execution_result;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

      {/* Input */}
      <QueryInput
        value={inputValue}
        onChange={setInputValue}
        onSubmit={handleSubmit}
        loading={loading}
        onReset={queryResult ? handleReset : undefined}
      />

      {/* Loading */}
      <AnimatePresence>
        {loading && (
          <QueryProgress message={loadingMessage} />
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {status === 'error' && error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ErrorState
              title="Something went wrong"
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

      {/* Results */}
      <AnimatePresence>
        {queryResult && status !== 'loading' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Query details */}
            <QueryDetails result={queryResult} />

            {/* Safety Rejection Card (stays persistently in the workspace) */}
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

            {/* Clarification */}
            {!isBlocked && needsClar && (
              <ClarificationPanel
                question={queryResult.ask_questions}
                threadId={queryResult.thread_id}
                onSubmit={clarify}
                loading={loading}
              />
            )}

            {/* SQL + Safety + Approval (when NOT blocked and NOT awaiting clarification) */}
            {!isBlocked && !needsClar && (
              <>
                {/* SQL Editor / Viewer */}
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
                      onEdit={isAwaiting ? startEditing : undefined}
                      showEditButton={isAwaiting && !executionDone}
                    />
                  )
                )}

                {/* Safety panel */}
                {hasSQL && !isEditing && (
                  <SafetyPanel result={queryResult} />
                )}

                {/* Approval panel */}
                {isAwaiting && !isEditing && !executionDone && (
                  <ApprovalPanel
                    result={queryResult}
                    loading={loading}
                    onApprove={approve}
                    onReject={reject}
                    onEdit={startEditing}
                  />
                )}
              </>
            )}

            {/* Execution result */}
            {executionDone && (
              <ExecutionResult
                executionResult={approvalResult.execution_result}
                intent={queryResult.intent}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
