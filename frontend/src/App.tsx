import { useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { OverviewPanel } from '@/components/OverviewPanel';
import { AgentsPanel } from '@/components/AgentsPanel';
import { TachyonPanel } from '@/components/TachyonPanel';
import { ResonancePanel } from '@/components/ResonancePanel';
import { DepartmentsPanel } from '@/components/DepartmentsPanel';
import { PoliciesPanel } from '@/components/PoliciesPanel';
import { aiAgents } from '@/data/mockData';
import { systemApi } from '@/services/apiClient';

export function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState<any>(null);
  const [resonance, setResonance] = useState<any>(null);
  const [googleConfigured, setGoogleConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    systemApi.getTachyonMetrics().then((r) => setMetrics(r.data));
    systemApi.getResonanceStatus().then((r) => setResonance(r.data));
    systemApi.getGoogleConfig().then((r) => setGoogleConfigured(r.data.configured));
  }, []);

  const panel = useMemo(() => {
    switch (activeTab) {
      case 'agents':
        return <AgentsPanel agents={aiAgents} />;
      case 'tachyon':
        return <TachyonPanel metrics={metrics} />;
      case 'resonance':
        return <ResonancePanel data={resonance} />;
      case 'departments':
        return <DepartmentsPanel />;
      case 'policies':
        return <PoliciesPanel />;
      default:
        return <OverviewPanel />;
    }
  }, [activeTab, metrics, resonance]);

  return (
    <div className="min-h-screen">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex">
        <Sidebar agents={aiAgents} />
        <main className="flex-1 p-4">
          <div className="mb-4 rounded border border-cyan-400/20 bg-slate-900/60 p-2 text-xs text-slate-300">
            Google Auth configured: {googleConfigured === null ? 'loading...' : googleConfigured ? 'yes' : 'no'}
          </div>
          {panel}
        </main>
      </div>
    </div>
  );
}
