import { useEffect, useState } from 'react';
import { systemApi, wsUrls } from '@/services/apiClient';

export function OverviewPanel() {
  const [metrics, setMetrics] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    systemApi.getTachyonMetrics().then((res) => setMetrics(res.data));
    const ws = new WebSocket(wsUrls.aetherbus);
    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      setEvents((prev) => [payload, ...prev].slice(0, 20));
    };
    return () => ws.close();
  }, []);

  return (
    <div className="space-y-4">
      <div className="card">
        <h3 className="mb-2 text-sm text-cyan-300">Realtime Metrics</h3>
        <pre className="text-xs text-slate-300">{JSON.stringify(metrics, null, 2)}</pre>
      </div>
      <div className="card">
        <h3 className="mb-2 text-sm text-cyan-300">AetherBus Stream</h3>
        <pre className="max-h-80 overflow-auto text-xs text-slate-300">{JSON.stringify(events, null, 2)}</pre>
      </div>
    </div>
  );
}
