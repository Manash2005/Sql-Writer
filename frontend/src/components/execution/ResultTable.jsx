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
    <div className="overflow-x-auto scrollbar-x rounded-lg border border-[#252a38]">
      <table className="min-w-full text-sm font-mono" role="grid" aria-label="Query results">
        <thead>
          <tr className="bg-[#111318] border-b border-[#252a38]">
            {columns.map((col) => (
              <th
                key={col}
                scope="col"
                className="px-4 py-2.5 text-left text-[10px] font-semibold text-[#565c75] uppercase tracking-widest whitespace-nowrap"
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
              className={`border-b border-[#1a1f2e] ${
                rowIdx % 2 === 0 ? 'bg-[#0a0b0f]' : 'bg-[#0d0f15]'
              } hover:bg-[#1a1f2e] transition-colors`}
            >
              {columns.map((col) => {
                const value = row[col];
                const cellKey = `${rowIdx}-${col}`;
                return (
                  <td
                    key={col}
                    className="px-4 py-2 text-xs text-[#e8eaf0] whitespace-nowrap max-w-xs truncate group relative"
                    title={String(value ?? '')}
                  >
                    <span className="truncate block">{formatCellValue(value)}</span>
                    <button
                      onClick={() => handleCopyCell(value, cellKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-[#565c75] hover:text-[#e8eaf0] transition-opacity p-0.5 rounded"
                      aria-label={`Copy ${col} value`}
                    >
                      {copiedCell === cellKey
                        ? <Check size={10} className="text-emerald-400" />
                        : <Copy size={10} />
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
