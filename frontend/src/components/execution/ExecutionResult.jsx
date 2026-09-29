import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Table2 } from 'lucide-react';
import ResultTable from './ResultTable';
import { safeJsonParse } from '../../lib/utils';

/**
 * @param {Object} props
 * @param {Object|null} props.executionResult  - raw execution_result from backend
 * @param {string} props.intent
 */
export default function ExecutionResult({ executionResult, intent }) {
  if (!executionResult) return null;

  const result = typeof executionResult === 'string'
    ? safeJsonParse(executionResult, executionResult)
    : executionResult;

  const isSuccess = result?.success !== false;

  // Backend returns result.type = 'read' | 'write'
  // Fall back to intent prop if type is not present
  const resultType = result?.type || (intent?.toLowerCase() === 'read' ? 'read' : 'write');
  const isRead = resultType === 'read';

  // Backend returns rows as array of dicts — derive columns from first row's keys
  const rawRows = result?.rows || [];
  const columns = rawRows.length > 0 ? Object.keys(rawRows[0]) : (result?.columns || []);

  const rowsAffected = result?.rows_affected ?? result?.row_count;
  const errorMsg = result?.error;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-3d rounded-xl border border-[#450C3F] bg-[#140a1b] overflow-hidden font-sans"
    >
      {/* Status header */}
      <div
        className={[
          'flex items-center gap-2 px-4 py-3 border-b',
          isSuccess
            ? 'border-[#B9D175]/30 bg-[#1d0f28]'
            : 'border-[#DF301C]/40 bg-[#16080a]',
        ].join(' ')}
      >
        {isSuccess ? (
          <CheckCircle size={14} className="text-[#B9D175] shrink-0" />
        ) : (
          <XCircle size={14} className="text-[#DF301C] shrink-0" />
        )}
        <p
          className={`text-[10px] font-mono font-bold uppercase tracking-widest ${
            isSuccess ? 'text-[#B9D175]' : 'text-[#DF301C]'
          }`}
        >
          {isSuccess ? 'Query Executed in Sandbox' : 'Execution Failed'}
        </p>

        {isSuccess && isRead && (
          <span className="ml-auto flex items-center gap-1.5 text-xs text-[#d1c5a9] font-mono">
            <Table2 size={12} className="text-[#00B7CD]" />
            <strong className="text-[#FFF1D1]">{rawRows.length}</strong> {rawRows.length === 1 ? 'row' : 'rows'} returned
          </span>
        )}

        {isSuccess && !isRead && rowsAffected !== undefined && rowsAffected !== null && (
          <span className="ml-auto text-xs text-[#d1c5a9] font-mono">
            <strong className="text-[#FFF1D1]">{rowsAffected}</strong> {rowsAffected === 1 ? 'row' : 'rows'} modified
          </span>
        )}
      </div>

      <div className="p-4">
        {/* Failure reason */}
        {!isSuccess && (
          <div className="text-sm text-red-400 font-mono bg-red-500/5 border border-red-500/20 rounded p-3">
            {errorMsg || 'An unexpected error occurred during execution.'}
          </div>
        )}

        {/* SELECT result table */}
        {isSuccess && isRead && (
          <ResultTable columns={columns} rows={rawRows} />
        )}

        {/* Write result */}
        {isSuccess && !isRead && (
          <div className="flex items-center gap-3">
            <p className="text-sm text-[#8b91a8]">
              {rowsAffected !== undefined && rowsAffected !== null
                ? `${rowsAffected} ${rowsAffected === 1 ? 'row' : 'rows'} were modified in the database.`
                : 'Operation completed successfully.'}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
