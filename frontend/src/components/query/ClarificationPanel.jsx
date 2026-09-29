import { useState } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, ChevronRight, FastForward, CheckCircle2, MessageSquare } from 'lucide-react';

/**
 * @param {Object} props
 * @param {string|string[]|null} props.question - Clarifying question(s) from backend
 * @param {string} [props.threadId]
 * @param {(answer: string) => void} props.onSubmit
 * @param {boolean} props.loading
 */
export default function ClarificationPanel({ question, threadId: _threadId, onSubmit, loading }) {
  const [answer, setAnswer] = useState('');

  const questionText = Array.isArray(question)
    ? question.filter((item) => typeof item === 'string' && item.trim()).join('\n')
    : typeof question === 'string'
      ? question
      : '';
  const hasQuestion = questionText.trim().length > 0;

  const handleSubmit = (textToSubmit) => {
    const text = (typeof textToSubmit === 'string' ? textToSubmit : answer).trim();
    if (!text) return;
    onSubmit(text);
    setAnswer('');
  };

  const handleSkip = () => {
    onSubmit('Proceed with standard defaults and generate query');
    setAnswer('');
  };

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (answer.trim()) handleSubmit();
    }
  };

  // Suggest common answers based on question keywords
  const suggestions = [];
  const lowerQ = questionText.toLowerCase();
  if (lowerQ.includes('paid the most') || lowerQ.includes('sum') || lowerQ.includes('total') || lowerQ.includes('individual')) {
    suggestions.push('Highest total amount paid across all orders (SUM)');
    suggestions.push('Single largest individual order amount');
  } else if (lowerQ.includes('date') || lowerQ.includes('old') || lowerQ.includes('time') || lowerQ.includes('cutoff')) {
    suggestions.push('Created before 2023-01-01');
    suggestions.push('Older than 90 days');
  } else if (lowerQ.includes('status') || lowerQ.includes('active') || lowerQ.includes('pending')) {
    suggestions.push('Pending orders only');
    suggestions.push('Active accounts only');
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-3d rounded-2xl border border-[#FF9100]/50 bg-[#160d19] p-5 sm:p-6 space-y-4 font-sans"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 pb-3 border-b border-[#FF9100]/25">
        <div className="h-7 w-7 rounded-lg bg-[#FF9100]/20 flex items-center justify-center text-[#FF9100]">
          <HelpCircle size={16} />
        </div>
        <div>
          <h4 className="font-display font-bold text-sm text-[#FFF1D1] flex items-center gap-2">
            Targeted Clarification
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FF9100]/20 text-[#FF9100] font-semibold uppercase">
              Needs your input
            </span>
          </h4>
          <p className="text-xs text-[#8c826c]">
            The assistant detected ambiguity and needs precise scope before generating SQL.
          </p>
        </div>
      </div>

      {/* Question */}
      <div className="p-4 rounded-xl bg-[#0d0611] border border-[#450C3F] space-y-2">
        <div className="flex items-start gap-2">
          <MessageSquare size={15} className="text-[#00B7CD] shrink-0 mt-0.5" />
          <p className="text-sm sm:text-base text-[#FFF1D1] leading-relaxed font-sans">
            {hasQuestion ? questionText : 'Could you specify the exact scope or details for your request?'}
          </p>
        </div>
      </div>

      {/* Quick Click Suggestion Pills */}
      {suggestions.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[11px] font-mono font-semibold text-[#8c826c] uppercase tracking-wider">
            One-Click Suggestions:
          </span>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => handleSubmit(sug)}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1d0f28] hover:bg-[#271435] border border-[#450C3F] hover:border-[#B9D175] text-xs text-[#d1c5a9] hover:text-[#FFF1D1] transition-all text-left active:scale-95"
              >
                <CheckCircle2 size={12} className="text-[#B9D175]" />
                <span>{sug}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Freeform Input */}
      <div className="space-y-3 pt-2">
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Or type your custom answer here (e.g. 'Use total amount spent across all orders')…"
          disabled={loading}
          rows={2}
          className={[
            'w-full bg-[#0d0611] border border-[#450C3F] rounded-xl px-4 py-2.5',
            'text-sm text-[#FFF1D1] placeholder-[#8c826c] font-sans',
            'focus:outline-none focus:border-[#00B7CD] focus:ring-1 focus:ring-[#00B7CD]/40 transition-all',
            'resize-none disabled:opacity-60',
          ].join(' ')}
          aria-label="Clarification answer"
        />

        <div className="flex items-center justify-between flex-wrap gap-3">
          <button
            type="button"
            onClick={handleSkip}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[#d1c5a9] hover:text-[#FFF1D1] bg-[#1d0f28] hover:bg-[#271435] border border-[#450C3F] transition-colors"
          >
            <FastForward size={13} />
            <span>Skip — use standard defaults</span>
          </button>

          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={loading || !answer.trim()}
            className="btn-3d-lime flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>Continue &amp; Generate SQL</span>
            <ChevronRight size={14} className="text-[#0d0611]" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
