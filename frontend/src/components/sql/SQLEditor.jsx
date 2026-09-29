import { motion } from 'framer-motion';
import { Edit3, AlertCircle } from 'lucide-react';
import Button from '../common/Button';

/**
 * @param {Object} props
 * @param {string} props.originalSql
 * @param {string} props.editedSql
 * @param {(sql: string) => void} props.onSqlChange
 * @param {() => void} props.onCancel
 * @param {() => void} props.onValidate
 * @param {boolean} props.loading
 * @param {string|null} props.error
 */
export default function SQLEditor({
  originalSql,
  editedSql,
  onSqlChange,
  onCancel,
  onValidate,
  loading,
  error,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-c1/50 bg-bg-surface card-3d overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-c4 bg-bg-elevated">
        <div className="flex items-center gap-2">
          <Edit3 size={13} className="text-c1" />
          <p className="text-[10px] font-mono font-semibold text-c1 uppercase tracking-widest">
            Edit SQL
          </p>
        </div>
        <p className="text-xs text-text-muted">Edited SQL will be re-validated by safety engine</p>
      </div>

      {/* Original reference */}
      <div className="px-4 pt-3">
        <p className="text-[10px] font-mono font-medium text-text-muted uppercase tracking-widest mb-2">
          Original SQL
        </p>
        <pre className="text-xs font-mono text-text-muted bg-bg-base border border-c4 rounded p-3 overflow-x-auto scrollbar-x leading-5">
          {originalSql}
        </pre>
      </div>

      {/* Editor */}
      <div className="px-4 pt-3 pb-4">
        <p className="text-[10px] font-mono font-medium text-text-secondary uppercase tracking-widest mb-2">
          Edited SQL
        </p>
        <textarea
          value={editedSql}
          onChange={(e) => onSqlChange(e.target.value)}
          disabled={loading}
          rows={8}
          spellCheck={false}
          className={[
            'w-full bg-bg-base border rounded-md px-3 py-3',
            'text-sm font-mono text-text-primary placeholder-text-muted',
            'focus:outline-none transition-colors resize-y leading-5',
            'disabled:opacity-60 disabled:cursor-not-allowed',
            error ? 'border-c3' : 'border-c4 focus:border-c1',
          ].join(' ')}
          aria-label="Edited SQL"
        />

        {error && (
          <div className="mt-2 flex items-start gap-2 text-xs text-c3">
            <AlertCircle size={12} className="shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-text-muted">
            Safety engine evaluates query before any DB execution.
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onValidate}
              disabled={loading || !editedSql.trim()}
              loading={loading}
            >
              Validate & Submit
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
