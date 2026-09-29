import { useEffect, useState } from 'react';
import { AlertCircle, Database, Terminal, Shield, History, Trash2 } from 'lucide-react';
import { checkHealth } from '../../lib/api';
import ThemeSelector from './ThemeSelector';

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
    <header className="fixed top-0 inset-x-0 h-16 flex items-center justify-between px-4 sm:px-8 glass-header z-50 transition-all duration-300">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => scrollTo('hero')}
          className="flex items-center gap-2.5 text-left group transition-transform active:scale-95"
        >
          <div className="h-8 w-8 rounded-lg bg-c4/30 border border-c1 flex items-center justify-center shadow-md group-hover:-translate-y-0.5 transition-all">
            <Terminal size={16} className="text-c1 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-extrabold text-base tracking-tight text-text-primary">
                SQL <span className="text-c1">Assistant</span>
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
                  ? 'btn-3d-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-c4/20'
              }`}
            >
              <Icon size={13} className={isActive ? 'text-[#061515]' : 'text-text-muted'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Appearance Palette Selector */}
        <ThemeSelector />

        {/* Backend Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-c4 glass-panel">
          {apiStatus === 'checking' && (
            <span className="flex items-center gap-1.5 text-xs text-c2">
              <span className="h-2 w-2 rounded-full bg-c2 animate-ping" />
              Connecting
            </span>
          )}
          {apiStatus === 'connected' && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-c1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-c1 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-c1"></span>
              </span>
              Engine Online
            </span>
          )}
          {apiStatus === 'error' && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-c3" title="Backend not reachable">
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
            className="p-2 rounded-full border border-c4 hover:border-c3 text-text-secondary hover:text-c3 hover:bg-c3/15 transition-all active:scale-90"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </header>
  );
}
