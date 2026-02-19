import { useState } from 'react';
import { DashboardShell } from './layouts/DashboardShell';
import { LandingPage } from './pages/LandingPage';

type AppView = 'landing' | 'dashboard';

export function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [view, setView] = useState<AppView>('landing');

  return (
    <div className="min-h-screen bg-aether-900 text-white grid-bg hexagon-pattern">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-glow/[0.02] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-glow/[0.02] rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-pink-glow/[0.01] rounded-full blur-[150px]" />
      </div>

      {view === 'landing' ? (
        <LandingPage onEnterDashboard={() => setView('dashboard')} />
      ) : (
        <DashboardShell
          activeTab={activeTab}
          sidebarOpen={sidebarOpen}
          onTabChange={setActiveTab}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          onCloseSidebar={() => setSidebarOpen(false)}
          onExitDashboard={() => {
            setView('landing');
            setSidebarOpen(false);
          }}
        />
      )}
    </div>
  );
}
