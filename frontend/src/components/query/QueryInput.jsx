import { useRef } from 'react';
import { Send, RotateCcw } from 'lucide-react';
import Button from '../common/Button';

const QUICK_PROMPTS = [
  { label: 'Top Paying Customers', query: 'Show me the top 3 customers who paid the most' },
  { label: 'Pending Orders', query: 'Show me all pending orders' },
  { label: 'Frequent Buyers', query: 'Show me customers who ordered more than 2 times' },
  { label: 'Affordable Products', query: 'List products with price under 50 dollars' },
];

/**
 * @param {Object} props
 * @param {string} props.value
 * @param {(v: string) => void} props.onChange
 * @param {() => void} props.onSubmit
 * @param {boolean} props.loading
 * @param {() => void} [props.onReset]
 */
export default function QueryInput({ value, onChange, onSubmit, loading, onReset }) {
  const textareaRef = useRef(null);

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!loading && value.trim()) onSubmit();
    }
  };

  return (
    <div className="space-y-3">
      {/* Quick Prompts Bar */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-x pb-1">
        <span className="text-xs font-semibold text-c2 flex items-center gap-1.5 shrink-0 mr-1">
          Quick Queries:
        </span>
        {QUICK_PROMPTS.map((qp) => (
          <button
            key={qp.label}
            type="button"
            onClick={() => {
              onChange(qp.query);
              if (textareaRef.current) textareaRef.current.focus();
            }}
            disabled={loading}
            className="text-xs px-3.5 py-1.5 rounded-full glass-panel hover:bg-c4/20 border border-c4 hover:border-c1 text-text-secondary hover:text-text-primary transition-all shrink-0 active:scale-95 hover:-translate-y-0.5"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Main Input Box */}
      <div className="glass-panel rounded-2xl overflow-hidden focus-within:border-c1 focus-within:ring-2 focus-within:ring-c1/30 transition-all shadow-md">
        <textarea
          ref={textareaRef}
          id="nl-query-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about your data in plain English (e.g. 'Show me the top 3 customers who spent the most money')…"
          disabled={loading}
          rows={3}
          className={[
            'w-full glass-input px-5 pt-4 pb-2 text-sm sm:text-base text-text-primary placeholder-text-muted',
            'resize-none focus:outline-none leading-relaxed font-sans',
            'disabled:opacity-60 disabled:cursor-not-allowed',
          ].join(' ')}
          aria-label="Natural language database request"
          aria-describedby="query-hint"
        />

        <div className="flex items-center justify-between px-5 py-3 border-t border-c4/50 bg-bg-elevated/90">
          <p id="query-hint" className="text-xs text-text-muted font-sans">
            Press <kbd className="px-1.5 py-0.5 bg-bg-surface rounded text-[11px] font-mono text-text-primary border border-c4/60">⌘/Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-bg-surface rounded text-[11px] font-mono text-text-primary border border-c4/60">Enter</kbd> to ask
          </p>

          <div className="flex items-center gap-2.5">
            {onReset && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                disabled={loading}
                leftIcon={<RotateCcw size={13} />}
                aria-label="Reset query"
                className="text-text-secondary hover:text-text-primary"
              >
                Reset
              </Button>
            )}

            <button
              onClick={onSubmit}
              disabled={loading || !value.trim()}
              className="btn-3d-teal flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#061515] border-t-transparent" />
                  <span>Thinking…</span>
                </>
              ) : (
                <>
                  <Send size={14} className="text-[#061515]" />
                  <span>Ask Assistant</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
