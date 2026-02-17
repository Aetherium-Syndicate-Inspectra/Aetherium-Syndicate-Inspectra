import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { OverviewPanel } from './components/OverviewPanel';
import { AgentsPanel } from './components/AgentsPanel';
import { TachyonPanel } from './components/TachyonPanel';
import { ResonancePanel } from './components/ResonancePanel';
import { DepartmentsPanel } from './components/DepartmentsPanel';
import { PoliciesPanel } from './components/PoliciesPanel';

export function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderPanel = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewPanel />;
      case 'agents':
        return <AgentsPanel />;
      case 'tachyon':
        return <TachyonPanel />;
      case 'resonance':
        return <ResonancePanel />;
      case 'departments':
        return <DepartmentsPanel />;
      case 'policies':
        return <PoliciesPanel />;
      default:
        return <OverviewPanel />;
    }
  };

  return (
    <div className="min-h-screen bg-aether-900 text-white grid-bg hexagon-pattern">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-glow/[0.02] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-glow/[0.02] rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-pink-glow/[0.01] rounded-full blur-[150px]" />
      </div>

      {/* Main Layout */}
      <div className="relative z-10 flex flex-col h-screen">
        <Header
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setSidebarOpen(false);
          }}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <div className="flex flex-1 overflow-hidden">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          <main className="flex-1 overflow-y-auto">
            <div className="p-4 lg:p-6 max-w-[1600px] mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderPanel()}
                </motion.div>
              </AnimatePresence>

              {/* Footer */}
              <footer className="mt-8 pb-6 text-center">
                <div className="text-[10px] text-white/10 tracking-wider">
                  AETHERIUM SYNDICATE INSPECTRA • SPECTRACALL v4.3.1 • HIGH INTEGRITY EDITION
                </div>
                <div className="text-[9px] text-white/5 mt-1">
                  Autonomous Enterprise OS • Tachyon Core • AetherBus Extreme • Resonance Drift Detection
                </div>
              </footer>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
