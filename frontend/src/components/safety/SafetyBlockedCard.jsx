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
      className="card-3d rounded-3xl border border-[#DF301C]/60 bg-[#16080a] p-6 sm:p-8 space-y-6 font-sans"
    >
      {/* Top Banner */}
      <div className="flex items-start gap-4 pb-5 border-b border-[#DF301C]/30">
        <div className="h-12 w-12 rounded-2xl bg-[#2a0c0e] border border-[#DF301C]/40 flex items-center justify-center text-[#DF301C] shrink-0 shadow-[0_2px_0_0_#9f1a0b]">
          <ShieldAlert size={26} />
        </div>
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="font-display font-extrabold text-xl sm:text-2xl text-[#FFF1D1] tracking-tight">
              Query Rejected by Safety Guard
            </h3>
            <span className="hl-red text-xs uppercase font-bold tracking-wider">
              Execution Blocked
            </span>
          </div>
          <p className="text-sm text-[#d1c5a9] font-sans leading-relaxed">
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
                className="p-5 rounded-2xl bg-[#1d0f28] border border-[#DF301C]/40 space-y-3"
              >
                <div className="flex items-center gap-2 text-[#DF301C]">
                  <Lock size={15} />
                  <span className="font-display font-bold text-sm text-[#FFF1D1]">
                    {exp.title}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#DF301C]/20 text-[#DF301C] ml-auto">
                    {flag}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-[#d1c5a9] leading-relaxed font-sans">
                  {exp.description}
                </p>

                <div className="flex items-start gap-2 pt-2 border-t border-[#450C3F] text-xs text-[#d1c5a9]">
                  <Lightbulb size={14} className="text-[#B9D175] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-[#FFF1D1]">How to fix:</strong> {exp.guidance}
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
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#8c826c]">
            Blocked SQL Statement (Not Executed)
          </span>
          <pre className="p-4 rounded-xl bg-[#0d0611] border border-[#DF301C]/40 text-xs font-mono text-[#DF301C]/90 overflow-x-auto scrollbar-x leading-relaxed line-through decoration-[#DF301C]/60">
            {result.generated_sql}
          </pre>
        </div>
      )}

      {/* User Acknowledgment & Recovery Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#450C3F]">
        <div className="flex items-center gap-2">
          {acknowledged ? (
            <span className="flex items-center gap-1.5 text-xs text-[#B9D175] font-semibold">
              <CheckCircle2 size={15} />
              You acknowledged this safety block. It will stay in workspace until you ask a new question.
            </span>
          ) : (
            <span className="text-xs text-[#8c826c]">
              Please acknowledge this safety notice to proceed.
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {onRevise && (
            <button
              type="button"
              onClick={onRevise}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-[#d1c5a9] hover:text-[#FFF1D1] bg-[#1d0f28] hover:bg-[#271435] border border-[#450C3F] transition-all"
            >
              <span>Revise Question</span>
              <ArrowRight size={13} />
            </button>
          )}

          {!acknowledged && (
            <button
              type="button"
              onClick={handleAckClick}
              className="btn-3d-lime flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold"
            >
              <CheckCircle2 size={15} className="text-[#0d0611]" />
              <span>I Acknowledge</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
