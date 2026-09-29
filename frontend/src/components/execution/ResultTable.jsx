import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { copyToClipboard } from '../../lib/utils';
import EmptyState from '../common/EmptyState';

/**
 * @param {Object} props
 * @param {string[]} props.columns
 * @param {Array<Record<string, unknown>>} props.rows
 */
export default function ResultTable({ columns, rows }) {
  const [copiedCell, setCopiedCell] = useState(null);

  if (!columns || columns.length === 0) {
    return <EmptyState title="No columns returned" />;
  }
  if (!rows || rows.length === 0) {
    return <EmptyState title="Query returned 0 rows" description="The query executed successfully but matched no records." />;
  }

  const handleCopyCell = async (value, key) => {
    await copyToClipboard(String(value ?? ''));
    setCopiedCell(key);
    setTimeout(() => setCopiedCell(null), 1500);
  };

  return (
    <div className="overflow-x-auto scrollbar-x rounded-xl border border-c4 glass-panel shadow-md">
      <table className="min-w-full text-sm font-mono" role="grid" aria-label="Query results">
        <thead>
          <tr className="bg-bg-elevated/95 backdrop-blur-md border-b border-c4">
            {columns.map((col) => (
              <th
                key={col}
                scope="col"
                className="px-4 py-2.5 text-left text-[10px] font-bold text-c2 uppercase tracking-wider whitespace-nowrap"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className={`border-b border-c4/40 ${
                rowIdx % 2 === 0 ? 'bg-bg-base' : 'bg-bg-surface'
              } hover:bg-c4/20 transition-colors`}
            >
              {columns.map((col) => {
                const value = row[col];
                const cellKey = `${rowIdx}-${col}`;
                return (
                  <td
                    key={col}
                    className="px-4 py-2 text-xs text-text-primary whitespace-nowrap max-w-xs truncate group relative"
                    title={String(value ?? '')}
                  >
                    <span className="truncate block">{formatCellValue(value)}</span>
                    <button
                      onClick={() => handleCopyCell(value, cellKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-text-muted hover:text-c1 transition-opacity p-0.5 rounded"
                      aria-label={`Copy ${col} value`}
                    >
                      {copiedCell === cellKey
                        ? <Check size={11} className="text-c1" />
                        : <Copy size={11} />
                      }
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatCellValue(value) {
  if (value === null || value === undefined) return <span className="text-text-muted italic">NULL</span>;
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}
