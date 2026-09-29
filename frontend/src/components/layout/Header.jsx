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
          <div className="h-8 w-8 rounded-lg bg-[#450C3F] border border-[#B9D175]/60 flex items-center justify-center shadow-[0_2px_0_0_#B9D175] group-hover:shadow-[0_3px_0_0_#B9D175] group-hover:-translate-y-0.5 transition-all">
            <Terminal size={16} className="text-[#B9D175] font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-extrabold text-base tracking-tight text-[#FFF1D1]">
                SQL <span className="text-[#B9D175]">Assistant</span>
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
                  ? 'bg-[#B9D175] text-[#0d0611] shadow-[0_2px_0_0_#8fa64a]'
                  : 'text-[#d1c5a9] hover:text-[#FFF1D1] hover:bg-[#271435]'
              }`}
            >
              <Icon size={13} className={isActive ? 'text-[#0d0611]' : 'text-[#8c826c]'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Backend Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#450C3F] glass-panel">
          {apiStatus === 'checking' && (
            <span className="flex items-center gap-1.5 text-xs text-[#FF9100]">
              <span className="h-2 w-2 rounded-full bg-[#FF9100] animate-ping" />
              Connecting
            </span>
          )}
          {apiStatus === 'connected' && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-[#B9D175]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B9D175] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#B9D175]"></span>
              </span>
              Engine Online
            </span>
          )}
          {apiStatus === 'error' && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-[#DF301C]" title="Backend not reachable">
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
            className="p-2 rounded-full border border-[#450C3F] hover:border-[#DF301C] text-[#d1c5a9] hover:text-[#DF301C] hover:bg-[#DF301C]/15 transition-all active:scale-90"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </header>
  );
}
