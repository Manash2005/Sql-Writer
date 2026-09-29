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
    { id: 'hero', label: 'Overview', icon: Sparkles },
    { id: 'database', label: 'Database & Schema', icon: Database },
    { id: 'workspace', label: 'Ask AI', icon: Terminal },
    { id: 'history', label: 'History', icon: History },
    { id: 'audit', label: 'Security Audit', icon: Shield },
  ];

  return (
    <header className="fixed top-0 inset-x-0 h-16 flex items-center justify-between px-6 sm:px-10 border-b border-white/[0.08] bg-black/80 backdrop-blur-xl z-50 transition-all duration-300">
      {/* Brand */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => scrollTo('hero')}
          className="flex items-center gap-2.5 text-left group transition-transform active:scale-95"
        >
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#76C457] to-[#4f823a] flex items-center justify-center shadow-[0_0_16px_rgba(118,196,87,0.35)] group-hover:shadow-[0_0_22px_rgba(118,196,87,0.5)] transition-shadow">
            <Terminal size={17} className="text-black font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-extrabold text-base tracking-tight text-white group-hover:text-gray-100 transition-colors">
                SQL{" "}<span className="text-[#76C457]">Agent</span>
              </span>
            </div>
          </div>
        </button>
      </div>

      {/* Navigation Pills */}
      <nav className="hidden md:flex items-center gap-1 bg-[#0c0d12]/90 border border-white/[0.07] px-2 py-1.5 rounded-full shadow-inner">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-[#76C457] text-black font-semibold shadow-[0_0_12px_rgba(118,196,87,0.4)]'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <Icon size={13} className={isActive ? 'text-black' : 'text-gray-400'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Backend Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.08] bg-[#0c0d12]">
          {apiStatus === 'checking' && (
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
              Connecting
            </span>
          )}
          {apiStatus === 'connected' && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-[#76C457]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#76C457] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#76C457]"></span>
              </span>
              Engine Online
            </span>
          )}
          {apiStatus === 'error' && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-orange-400" title="Backend not reachable">
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
            className="p-2 rounded-full border border-white/[0.08] hover:border-red-500/40 text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </header>
  );
}
