import { useState } from 'react';
import { Copy, Check, Edit3 } from 'lucide-react';
import Button from '../common/Button';
import { copyToClipboard } from '../../lib/utils';

/**
 * @param {Object} props
 * @param {string} props.sql
 * @param {() => void} [props.onEdit]
 * @param {boolean} [props.showEditButton]
 */
export default function SQLViewer({ sql, onEdit, showEditButton = true }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyToClipboard(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-[#252a38] bg-[#0d0f15] overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1a1f2e] bg-[#111318]">
        <p className="text-[10px] font-mono font-semibold text-[#565c75] uppercase tracking-widest">
          Generated SQL
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="xs"
            onClick={handleCopy}
            leftIcon={copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            aria-label="Copy SQL to clipboard"
            className={copied ? 'text-emerald-400' : ''}
          >
            {copied ? 'Copied' : 'Copy'}
          </Button>
          {showEditButton && onEdit && (
            <Button
              variant="ghost"
              size="xs"
              onClick={onEdit}
              leftIcon={<Edit3 size={12} />}
              aria-label="Edit SQL"
            >
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* SQL Code */}
      <div className="overflow-x-auto scrollbar-x">
        <pre className="px-4 py-4 text-sm font-mono text-[#e8eaf0] leading-6 min-w-max whitespace-pre">
          <SQLHighlighter sql={sql} />
        </pre>
      </div>
    </div>
  );
}

/**
 * Minimal SQL syntax highlighter using regex.
 * Highlights keywords, strings, numbers, and comments.
 */
function SQLHighlighter({ sql }) {
  if (!sql) return null;

  const KEYWORDS = /\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|ON|AS|AND|OR|NOT|IN|LIKE|BETWEEN|IS|NULL|ORDER|BY|GROUP|HAVING|LIMIT|OFFSET|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|DROP|ALTER|TABLE|INDEX|DISTINCT|COUNT|SUM|AVG|MIN|MAX|CASE|WHEN|THEN|ELSE|END|WITH|UNION|ALL|EXISTS)\b/gi;
  const STRINGS = /('[^']*'|"[^"]*")/g;
  const NUMBERS = /\b(\d+(\.\d+)?)\b/g;
  const COMMENTS = /(--.*$|\/\*[\s\S]*?\*\/)/gm;
  const OPERATORS = /([=<>!]+|,)/g;

  const patterns = [
    { regex: COMMENTS, color: '#565c75', italic: true },
    { regex: STRINGS, color: '#34d399' },
    { regex: KEYWORDS, color: '#818cf8', bold: true },
    { regex: NUMBERS, color: '#fbbf24' },
    { regex: OPERATORS, color: '#8b91a8' },
  ];

  // Combined approach: split and colorize
  const tokens = tokenize(sql, patterns);

  return tokens.map((token, i) => {
    if (token.style) {
      return (
        <span
          key={i}
          style={{
            color: token.style.color,
            fontStyle: token.style.italic ? 'italic' : undefined,
            fontWeight: token.style.bold ? '600' : undefined,
          }}
        >
          {token.text}
        </span>
      );
    }
    return <span key={i}>{token.text}</span>;
  });
}

function tokenize(sql, patterns) {
  // Build a unified regex
  const combined = patterns.map((p) => `(${p.regex.source})`).join('|');
  const re = new RegExp(combined, 'gim');
  const tokens = [];
  let last = 0;
  let match;

  while ((match = re.exec(sql)) !== null) {
    if (match.index > last) {
      tokens.push({ text: sql.slice(last, match.index) });
    }

    // Find which pattern matched
    let groupStart = 1;
    for (let i = 0; i < patterns.length; i++) {
      const groupCount = patterns[i].regex.source.split('(').length; // rough group count
      if (match[groupStart] !== undefined) {
        tokens.push({ text: match[0], style: patterns[i] });
        break;
      }
      groupStart += groupCount;
    }

    last = match.index + match[0].length;
  }

  if (last < sql.length) {
    tokens.push({ text: sql.slice(last) });
  }

  return tokens;
}
