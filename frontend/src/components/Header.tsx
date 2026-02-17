import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, Radio, Bell, Search, Menu, X } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

const tabs = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'agents', label: 'AI Council', icon: '🤖' },
  { id: 'tachyon', label: 'Tachyon Core', icon: '⚡' },
  { id: 'resonance', label: 'Resonance', icon: '🔮' },
  { id: 'departments', label: 'Departments', icon: '🏢' },
  { id: 'policies', label: 'Policies', icon: '📋' },
];

export function Header({ activeTab, onTabChange, sidebarOpen, onToggleSidebar }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="relative z-50">
      {/* Top Bar */}
      <div className="border-b border-cyan-glow/10 bg-aether-900/95 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3 lg:px-6">
          {/* Left: Logo & Brand */}
          <div className="flex items-center gap-3">
            <button onClick={onToggleSidebar} className="lg:hidden text-cyan-glow/70 hover:text-cyan-glow">
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="relative h-9 w-9 flex-shrink-0"
            >
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-cyan-glow via-purple-glow to-pink-glow opacity-80" />
              <div className="absolute inset-[2px] rounded-[6px] bg-aether-900 flex items-center justify-center">
                <Zap size={16} className="text-cyan-glow" />
              </div>
            </motion.div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold tracking-wider text-white">
                SPECTRA<span className="text-cyan-glow">CALL</span>
              </h1>
              <p className="text-[10px] tracking-[0.2em] text-cyan-glow/40 uppercase">
                Aetherium Syndicate • v4.3.1
              </p>
            </div>
          </div>

          {/* Center: Status Indicators */}
          <div className="hidden md:flex items-center gap-4">
            <StatusPill icon={<Shield size={12} />} label="INTEGRITY" value="99.97%" color="text-green-400" />
            <StatusPill icon={<Zap size={12} />} label="TACHYON" value="0.3µs" color="text-cyan-glow" />
            <StatusPill icon={<Radio size={12} />} label="AETHERBUS" value="ACTIVE" color="text-purple-glow" />
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 rounded-lg text-white/50 hover:text-cyan-glow hover:bg-cyan-glow/5 transition-all"
            >
              <Search size={16} />
            </button>
            <div className="relative">
              <button className="p-2 rounded-lg text-white/50 hover:text-cyan-glow hover:bg-cyan-glow/5 transition-all">
                <Bell size={16} />
              </button>
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-glow animate-pulse" />
            </div>
            <div className="hidden sm:block ml-2 text-right">
              <div className="text-xs font-mono text-cyan-glow/80">
                {currentTime.toLocaleTimeString('en-US', { hour12: false })}
              </div>
              <div className="text-[10px] text-white/30 font-mono">
                {currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        {searchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-cyan-glow/5 px-4 py-2 lg:px-6"
          >
            <div className="relative max-w-xl mx-auto">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-glow/40" />
              <input
                type="text"
                placeholder="Search agents, policies, metrics..."
                className="w-full bg-aether-800/50 border border-cyan-glow/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-cyan-glow/30"
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-cyan-glow/5 bg-aether-900/80 backdrop-blur-lg overflow-x-auto">
        <div className="flex items-center px-4 lg:px-6 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex items-center gap-1.5 px-4 py-3 text-xs font-medium tracking-wide transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-cyan-glow'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-glow to-transparent"
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

function StatusPill({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-aether-800/50 border border-cyan-glow/5">
      <span className={color}>{icon}</span>
      <span className="text-[10px] text-white/30 tracking-wider">{label}</span>
      <span className={`text-xs font-mono font-semibold ${color}`}>{value}</span>
    </div>
  );
}
