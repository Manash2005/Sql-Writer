import { useRef } from 'react';
import { Send, RotateCcw, Sparkles } from 'lucide-react';
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
        <span className="text-xs font-semibold text-gray-400 flex items-center gap-1.5 shrink-0 mr-1">
          <Sparkles size={13} className="text-[#76C457]" />
          Quick Ideas:
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
            className="text-xs px-3 py-1.5 rounded-full bg-[#12141a] hover:bg-[#1c202a] border border-white/[0.08] hover:border-[#76C457]/50 text-gray-300 hover:text-white transition-all shrink-0 active:scale-95"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Main Input Box */}
      <div className="rounded-2xl border border-white/[0.1] bg-[#0c0d12] overflow-hidden focus-within:border-[#76C457]/60 focus-within:ring-2 focus-within:ring-[#76C457]/20 transition-all shadow-xl">
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
            'w-full bg-transparent px-5 pt-4 pb-2 text-sm sm:text-base text-white placeholder-gray-500',
            'resize-none focus:outline-none leading-relaxed font-sans',
            'disabled:opacity-60 disabled:cursor-not-allowed',
          ].join(' ')}
          aria-label="Natural language database request"
          aria-describedby="query-hint"
        />

        <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06] bg-[#12141a]/50">
          <p id="query-hint" className="text-xs text-gray-400 font-sans">
            Press <kbd className="px-1.5 py-0.5 bg-white/[0.08] rounded text-[11px] font-mono text-gray-300 border border-white/[0.1]">⌘/Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-white/[0.08] rounded text-[11px] font-mono text-gray-300 border border-white/[0.1]">Enter</kbd> to ask
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
                className="text-gray-400 hover:text-white"
              >
                Reset
              </Button>
            )}

            <button
              onClick={onSubmit}
              disabled={loading || !value.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#76C457] text-black hover:bg-[#86d965] disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_16px_rgba(118,196,87,0.35)] transition-all active:scale-95"
            >
              {loading ? (
                <>
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                  <span>Thinking…</span>
                </>
              ) : (
                <>
                  <Send size={14} className="text-black" />
                  <span>Ask AI Assistant</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
