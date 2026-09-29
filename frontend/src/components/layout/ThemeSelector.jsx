import { useState, useRef, useEffect } from 'react';
import { Palette, Check, Sparkles } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function ThemeSelector() {
  const { currentThemeId, currentTheme, setThemeId, themes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-c4 glass-panel hover:border-c1 text-xs text-text-secondary hover:text-text-primary transition-all active:scale-95"
        title="Switch Color Theme"
        aria-label="Appearance Options"
      >
        <Palette size={14} className="text-c1 shrink-0" />
        <span className="hidden sm:inline font-medium text-[11px] font-sans">
          {currentTheme.name}
        </span>
        {/* 4 Mini Color Dots of active theme */}
        <div className="flex items-center gap-1 shrink-0">
          <span
            className="w-2 h-2 rounded-full border border-black/30"
            style={{ backgroundColor: currentTheme.colors.c1 }}
          />
          <span
            className="w-2 h-2 rounded-full border border-black/30"
            style={{ backgroundColor: currentTheme.colors.c2 }}
          />
          <span
            className="w-2 h-2 rounded-full border border-black/30"
            style={{ backgroundColor: currentTheme.colors.c3 }}
          />
          <span
            className="w-2 h-2 rounded-full border border-black/30"
            style={{ backgroundColor: currentTheme.colors.c4 }}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 mt-2 w-72 p-2 rounded-2xl glass-card-3d z-50 shadow-2xl font-sans"
          >
            <div className="px-3 py-2 border-b border-c4/40 flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-c1 flex items-center gap-1.5">
                <Sparkles size={12} />
                Appearance Palette
              </span>
              <span className="text-[10px] text-text-muted font-mono">4-Shade Core</span>
            </div>

            <div className="py-1.5 space-y-1">
              {themes.map((t) => {
                const isSelected = t.id === currentThemeId;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setThemeId(t.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left ${
                      isSelected
                        ? 'bg-c4/30 border border-c1/60 shadow-sm'
                        : 'hover:bg-c4/20 border border-transparent'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-text-primary">
                          {t.name}
                        </span>
                        {isSelected && <Check size={12} className="text-c1 shrink-0" />}
                      </div>
                      <p className="text-[10px] text-text-muted font-sans line-clamp-1">
                        {t.subtitle}
                      </p>
                    </div>

                    {/* 4 Swatches */}
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full shadow-sm border border-white/20"
                        style={{ backgroundColor: t.colors.c1 }}
                        title={`c1: ${t.colors.c1}`}
                      />
                      <span
                        className="w-3.5 h-3.5 rounded-full shadow-sm border border-white/20"
                        style={{ backgroundColor: t.colors.c2 }}
                        title={`c2: ${t.colors.c2}`}
                      />
                      <span
                        className="w-3.5 h-3.5 rounded-full shadow-sm border border-white/20"
                        style={{ backgroundColor: t.colors.c3 }}
                        title={`c3: ${t.colors.c3}`}
                      />
                      <span
                        className="w-3.5 h-3.5 rounded-full shadow-sm border border-white/20"
                        style={{ backgroundColor: t.colors.c4 }}
                        title={`c4: ${t.colors.c4}`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="px-3 py-1.5 border-t border-c4/30 text-[10px] text-text-muted font-mono text-center">
              All styles driven by 4 core color tokens
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
