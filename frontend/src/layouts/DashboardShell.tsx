import { AnimatePresence, motion } from 'framer-motion';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { dashboardTabs } from '../constants/navigation';
import { OverviewPanel } from '../components/OverviewPanel';
import { AgentsPanel } from '../components/AgentsPanel';
import { TachyonPanel } from '../components/TachyonPanel';
import { ResonancePanel } from '../components/ResonancePanel';
import { DepartmentsPanel } from '../components/DepartmentsPanel';
import { PoliciesPanel } from '../components/PoliciesPanel';
import { ChatPanel } from '../components/ChatPanel';

interface DashboardShellProps {
  activeTab: string;
  sidebarOpen: boolean;
  onTabChange: (tab: string) => void;
  onToggleSidebar: () => void;
  onCloseSidebar: () => void;
  onExitDashboard: () => void;
}

const panelMap: Record<string, React.ReactNode> = {
  overview: <OverviewPanel />,
  agents: <AgentsPanel />,
  tachyon: <TachyonPanel />,
  resonance: <ResonancePanel />,
  departments: <DepartmentsPanel />,
  policies: <PoliciesPanel />,
  chat: <ChatPanel />,
};

export function DashboardShell({
  activeTab,
  sidebarOpen,
  onTabChange,
  onToggleSidebar,
  onCloseSidebar,
  onExitDashboard,
}: DashboardShellProps) {
  const currentTab = dashboardTabs.find((tab) => tab.id === activeTab) ?? dashboardTabs[0];

  return (
    <div className="relative z-10 flex h-screen flex-col">
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => {
          onTabChange(tab);
          onCloseSidebar();
        }}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={onToggleSidebar}
        onExitDashboard={onExitDashboard}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={onCloseSidebar} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1600px] p-4 lg:p-6">
            <div className="mb-6 rounded-2xl border border-cyan-glow/15 bg-aether-800/45 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.23em] text-cyan-glow/60">Current Workspace</p>
              <h2 className="mt-1 text-lg font-semibold text-white">{currentTab.icon} {currentTab.label}</h2>
              <p className="text-sm text-white/55">{currentTab.description}</p>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {panelMap[activeTab] ?? panelMap.overview}
              </motion.div>
            </AnimatePresence>

            <footer className="mt-8 pb-6 text-center">
              <div className="text-[10px] text-white/10 tracking-wider">
                AETHERIUM SYNDICATE INSPECTRA • SPECTRACALL v4.4.0 • PRE-LOGIN SURFACE READY
              </div>
              <div className="text-[9px] text-white/5 mt-1">
                Unified Experience Layer • Tachyon Core • AetherBus Extreme • Resonance Drift Detection
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
