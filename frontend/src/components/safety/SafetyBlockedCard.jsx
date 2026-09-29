import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, CheckCircle2, Lightbulb, Lock, ArrowRight } from 'lucide-react';

const RISK_EXPLANATIONS = {
  schema_change_not_allowed: {
    title: 'Database Schema Modifications are Prohibited',
    description: 'Commands that modify table structures (such as DROP TABLE, ALTER TABLE, or CREATE TABLE) are disabled to protect data integrity and avoid permanent schema corruption.',
    guidance: 'The assistant is designed for querying and analyzing existing records. Try querying data from the table instead (e.g., "Show me all records from this table").',
  },
  missing_where_clause: {
    title: 'Unrestricted Bulk Modification Detected',
    description: 'The query attempted to update or delete rows without a WHERE condition. Executing this would wipe out or modify every single record in the table.',
    guidance: 'Specify exact filters or conditions (e.g., "Delete orders older than 2023-01-01" or "Update status for customer ID #2").',
  },
  system_table_access: {
    title: 'Access to SQLite Internal System Tables is Forbidden',
    description: 'Attempts to inspect or alter internal sqlite_* metadata tables are blocked for security.',
    guidance: 'Query your business tables (customers, orders, products) instead.',
  },
  dangerous_function: {
    title: 'Disallowed System Function Detected',
    description: 'Potentially dangerous system functions (e.g. readfile, writefile, load_extension) are prohibited in sandbox mode.',
    guidance: 'Use standard SQL aggregation functions like SUM, AVG, COUNT, MIN, and MAX.',
  },
  unsupported_statement_type: {
    title: 'Unsupported Database Statement',
    description: 'The engine only permits safe, standard SELECT queries and scoped transactions.',
    guidance: 'Rephrase your question in natural language asking to view or analyze data.',
  },
  empty_sql: {
    title: 'No Executable Query Generated',
    description: 'The request could not be safely translated into valid database instructions.',
    guidance: 'Try asking a more descriptive question like "Show me the top 5 customers by spending".',
  },
};

/**
 * Prominent workspace card displayed whenever a query is blocked/rejected by safety checks.
 * Stays persistently in the workspace so the user acknowledges why it was blocked.
 */
export default function SafetyBlockedCard({ result, onAcknowledge, onRevise }) {
  const [acknowledged, setAcknowledged] = useState(false);
  const flags = result.risk_flags || [];

  const handleAckClick = () => {
    setAcknowledged(true);
    if (onAcknowledge) onAcknowledge();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-red-500/40 bg-gradient-to-b from-red-500/[0.08] to-transparent p-6 sm:p-8 shadow-2xl space-y-6"
    >
      {/* Top Banner */}
      <div className="flex items-start gap-4 pb-5 border-b border-red-500/20">
        <div className="h-12 w-12 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 shadow-[0_0_20px_rgba(239,68,68,0.25)]">
          <ShieldAlert size={26} />
        </div>
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="font-display font-extrabold text-xl sm:text-2xl text-white tracking-tight">
              Query Rejected by Safety Guard
            </h3>
            <span className="hl-red text-xs uppercase font-bold tracking-wider">
              Execution Blocked
            </span>
          </div>
          <p className="text-sm text-gray-300 font-sans leading-relaxed">
            The safety engine intercepted this request before touching the database. No records were modified or deleted.
          </p>
        </div>
      </div>

      {/* Explanations for each flagged risk */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">
          Why this query was blocked:
        </h4>

        {flags.length === 0 ? (
          <div className="p-4 rounded-2xl bg-black/50 border border-red-500/20 space-y-1">
            <p className="text-sm font-semibold text-red-300">
              Deterministic Safety Rule Violated
            </p>
            <p className="text-xs text-gray-400">
              The operation was determined to be unsafe under standard database security policies.
            </p>
          </div>
        ) : (
          flags.map((flag) => {
            const exp = RISK_EXPLANATIONS[flag] || {
              title: `Security Policy Violation: ${flag}`,
              description: 'This query triggered a safety rule and cannot be executed.',
              guidance: 'Please refine your prompt to ask for specific records or safe aggregations.',
            };

            return (
              <div
                key={flag}
                className="p-5 rounded-2xl bg-[#0c0d14] border border-red-500/25 space-y-3 shadow-inner"
              >
                <div className="flex items-center gap-2 text-red-400">
                  <Lock size={15} />
                  <span className="font-display font-bold text-sm text-white">
                    {exp.title}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-300 ml-auto">
                    {flag}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-sans">
                  {exp.description}
                </p>

                <div className="flex items-start gap-2 pt-2 border-t border-white/[0.06] text-xs text-gray-400">
                  <Lightbulb size={14} className="text-[#76C457] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">How to fix:</strong> {exp.guidance}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Blocked SQL preview if available */}
      {result.generated_sql && (
        <div className="space-y-2">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-gray-400">
            Blocked SQL Statement (Not Executed)
          </span>
          <pre className="p-4 rounded-xl bg-black/60 border border-red-500/30 text-xs font-mono text-red-300/90 overflow-x-auto scrollbar-x leading-relaxed line-through decoration-red-500/60">
            {result.generated_sql}
          </pre>
        </div>
      )}

      {/* User Acknowledgment & Recovery Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-white/[0.08]">
        <div className="flex items-center gap-2">
          {acknowledged ? (
            <span className="flex items-center gap-1.5 text-xs text-[#76C457] font-semibold">
              <CheckCircle2 size={15} />
              You acknowledged this safety block. It will stay in workspace until you ask a new question.
            </span>
          ) : (
            <span className="text-xs text-gray-400">
              Please acknowledge this safety notice to proceed.
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {onRevise && (
            <button
              type="button"
              onClick={onRevise}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] transition-all"
            >
              <span>Revise Question</span>
              <ArrowRight size={13} />
            </button>
          )}

          {!acknowledged && (
            <button
              type="button"
              onClick={handleAckClick}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#76C457] text-black hover:bg-[#86d965] shadow-[0_0_16px_rgba(118,196,87,0.35)] transition-all active:scale-95"
            >
              <CheckCircle2 size={15} className="text-black" />
              <span>I Acknowledge</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
