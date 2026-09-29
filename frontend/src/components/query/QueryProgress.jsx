import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Shield, Check, Cpu } from 'lucide-react';

const CONSOLE_STEPS = [
  {
    tag: '01/INTENT',
    title: 'Parsing query intent',
    detail: 'Classifying read/write taxonomy and extracting entity targets',
  },
  {
    tag: '02/AMBIGUITY',
    title: 'Checking schema ambiguity',
    detail: 'Verifying tables against live database catalog and filter sufficiency',
  },
  {
    tag: '03/SAFETY',
    title: 'AST security guardrails',
    detail: 'Scanning abstract syntax tree for destructive commands & unbounded writes',
  },
  {
    tag: '04/ENGINE',
    title: 'Generating verifiable SQL',
    detail: 'Groq active with OpenRouter automatic failover standby',
  },
];

const ROLLING_TOKENS = [
  'SELECT -> FROM customers -> JOIN orders',
  'SCANNING AST: blocked_tables=[none], write_ops=[safe]',
  'EVALUATING: WHERE clause scope & schema integrity',
  'COMPILING: checkpoint state saved to SQLite checkpointer',
  'DISPATCH: LLM token streaming with failover guarantee',
];

export default function QueryProgress({ message }) {
  const [activeStep, setActiveStep] = useState(0);
  const [tokenIndex, setTokenIndex] = useState(0);

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setActiveStep((prev) => (prev < CONSOLE_STEPS.length - 1 ? prev + 1 : prev));
    }, 1200);

    const tokenTimer = setInterval(() => {
      setTokenIndex((prev) => (prev + 1) % ROLLING_TOKENS.length);
    }, 900);

    return () => {
      clearInterval(stepTimer);
      clearInterval(tokenTimer);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.99 }}
      transition={{ duration: 0.3 }}
      className="glass-card-3d rounded-2xl overflow-hidden font-sans"
    >
      {/* Console Header Bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#450C3F] bg-[#1d0f28]/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#DF301C]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF9100]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#B9D175]" />
          </div>
          <Terminal size={14} className="text-[#00B7CD]" />
          <span className="text-xs font-mono font-bold tracking-wider uppercase text-[#00B7CD]">
            Agent Execution Console
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[#d1c5a9]">
          <span className="inline-block w-2 h-2 rounded-full bg-[#B9D175] animate-pulse" />
          <span>Processing Request</span>
        </div>
      </div>

      {/* Main Console Body */}
      <div className="p-5 sm:p-6 space-y-5">
        {/* Step Ticker */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {CONSOLE_STEPS.map((step, idx) => {
            const isCompleted = idx < activeStep;
            const isCurrent = idx === activeStep;
            return (
              <motion.div
                key={step.tag}
                animate={isCurrent ? { scale: [1, 1.02, 1] } : {}}
                transition={{ duration: 1.5, repeat: isCurrent ? Infinity : 0 }}
                className={[
                  'p-3.5 rounded-xl border transition-all',
                  isCurrent
                    ? 'border-[#00B7CD] bg-[#1d0f28] shadow-[0_2px_0_0_#00B7CD]'
                    : isCompleted
                    ? 'border-[#B9D175]/50 glass-panel'
                    : 'border-[#450C3F]/40 bg-[#140a1b]/40 opacity-40',
                ].join(' ')}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={[
                      'text-[10px] font-mono font-bold px-2 py-0.5 rounded',
                      isCurrent
                        ? 'bg-[#00B7CD]/25 text-[#00B7CD]'
                        : isCompleted
                        ? 'bg-[#B9D175]/25 text-[#B9D175]'
                        : 'bg-[#450C3F]/30 text-[#8c826c]',
                    ].join(' ')}
                  >
                    {step.tag}
                  </span>
                  {isCompleted && <Check size={13} className="text-[#B9D175]" />}
                  {isCurrent && (
                    <span className="w-2 h-2 rounded-full bg-[#00B7CD] animate-ping" />
                  )}
                </div>
                <p className="text-xs font-semibold text-[#FFF1D1] truncate">{step.title}</p>
                <p className="text-[11px] text-[#8c826c] mt-0.5 line-clamp-1">{step.detail}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Rolling Token Console Stream */}
        <div className="p-3.5 rounded-xl bg-[#0d0611]/90 backdrop-blur-md border border-[#450C3F] font-mono text-xs flex items-center justify-between gap-4 shadow-inner">
          <div className="flex items-center gap-2 min-w-0">
            <Cpu size={14} className="text-[#00B7CD] shrink-0" />
            <span className="text-[11px] text-[#8c826c] shrink-0 uppercase tracking-wider">
              Token Stream:
            </span>
            <motion.span
              key={tokenIndex}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="text-[#00B7CD] truncate font-medium"
            >
              {ROLLING_TOKENS[tokenIndex]}
            </motion.span>
            <span className="inline-block w-2 h-3 bg-[#00B7CD] animate-pulse shrink-0" />
          </div>

          <div className="hidden sm:flex items-center gap-2 shrink-0 text-[11px] text-[#8c826c]">
            <Shield size={12} className="text-[#B9D175]" />
            <span>AST Guard Active</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
