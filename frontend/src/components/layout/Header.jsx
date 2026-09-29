import { useEffect, useState } from 'react';
import { AlertCircle, Database, Terminal, Shield, History, Sparkles, Trash2 } from 'lucide-react';
import { checkHealth } from '../../lib/api';

export default function Header({ onClearAll }) {
  const [apiStatus, setApiStatus] = useState('checking'); // 'checking'|'connected'|'error'
  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        await checkHealth();
        if (!cancelled) setApiStatus('connected');
      } catch {
        if (!cancelled) setApiStatus('error');
      }
    };

    check();
    const interval = setInterval(check, 25000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const sections = ['hero', 'database', 'workspace', 'history', 'audit'];
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;
      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const navItems = [
    { id: 'hero', label: 'Overview', icon: Terminal },
    { id: 'workspace', label: 'Workspace', icon: Terminal },
    { id: 'database', label: 'Database & Schema', icon: Database },
    { id: 'history', label: 'History', icon: History },
    { id: 'audit', label: 'Security Audit', icon: Shield },
  ];

  return (
    <header className="fixed top-0 inset-x-0 h-16 flex items-center justify-between px-6 sm:px-10 glass-header z-50 transition-all duration-300">
      {/* Brand */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => scrollTo('hero')}
          className="flex items-center gap-2.5 text-left group transition-transform active:scale-95"
        >
          <div className="h-8 w-8 rounded-lg bg-[#162230] border border-[#457B9D] flex items-center justify-center shadow-[0_2px_0_0_#284b63] group-hover:shadow-[0_3px_0_0_#284b63] group-hover:-translate-y-0.5 transition-all">
            <Terminal size={16} className="text-[#457B9D] font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-extrabold text-base tracking-tight text-[#F8FAFC]">
                SQL <span className="text-[#457B9D]">Assistant</span>
              </span>
            </div>
          </div>
        </button>
      </div>

      {/* Navigation Pills */}
      <nav className="hidden md:flex items-center gap-1 glass-panel px-2 py-1.5 rounded-full shadow-inner">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-[#457B9D] text-white shadow-[0_2px_0_0_#284b63]'
                  : 'text-[#CBD5E1] hover:text-[#F8FAFC] hover:bg-[#162230]'
              }`}
            >
              <Icon size={13} className={isActive ? 'text-white' : 'text-[#849BB0]'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Backend Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#457B9D]/40 glass-panel">
          {apiStatus === 'checking' && (
            <span className="flex items-center gap-1.5 text-xs text-[#F4D35E]">
              <span className="h-2 w-2 rounded-full bg-[#F4D35E] animate-ping" />
              Connecting
            </span>
          )}
          {apiStatus === 'connected' && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-[#457B9D]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#457B9D] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#457B9D]"></span>
              </span>
              Engine Online
            </span>
          )}
          {apiStatus === 'error' && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-[#E63946]" title="Backend not reachable">
              <AlertCircle size={13} />
              Backend Offline
            </span>
          )}
        </div>

        {/* Clear Data Button */}
        {onClearAll && (
          <button
            onClick={onClearAll}
            title="Clear previous history & audit data"
            className="p-2 rounded-full border border-[#457B9D]/40 hover:border-[#E63946] text-[#CBD5E1] hover:text-[#E63946] hover:bg-[#E63946]/15 transition-all active:scale-90"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </header>
  );
}
