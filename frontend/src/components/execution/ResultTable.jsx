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
    <div className="overflow-x-auto scrollbar-x rounded-xl border border-[#450C3F] glass-panel shadow-[0_4px_0_0_#450C3F]">
      <table className="min-w-full text-sm font-mono" role="grid" aria-label="Query results">
        <thead>
          <tr className="bg-[#1d0f28]/90 backdrop-blur-md border-b border-[#450C3F]">
            {columns.map((col) => (
              <th
                key={col}
                scope="col"
                className="px-4 py-2.5 text-left text-[10px] font-bold text-[#FFF1D1] uppercase tracking-wider whitespace-nowrap"
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
              className={`border-b border-[#450C3F]/40 ${
                rowIdx % 2 === 0 ? 'bg-[#0d0611]' : 'bg-[#140a1b]'
              } hover:bg-[#271435] transition-colors`}
            >
              {columns.map((col) => {
                const value = row[col];
                const cellKey = `${rowIdx}-${col}`;
                return (
                  <td
                    key={col}
                    className="px-4 py-2 text-xs text-[#FFF1D1] whitespace-nowrap max-w-xs truncate group relative"
                    title={String(value ?? '')}
                  >
                    <span className="truncate block">{formatCellValue(value)}</span>
                    <button
                      onClick={() => handleCopyCell(value, cellKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-[#8c826c] hover:text-[#B9D175] transition-opacity p-0.5 rounded"
                      aria-label={`Copy ${col} value`}
                    >
                      {copiedCell === cellKey
                        ? <Check size={11} className="text-[#B9D175]" />
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
  if (value === null || value === undefined) return <span className="text-[#565c75]">NULL</span>;
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}
