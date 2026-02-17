import type { AIAgent } from '@/data/mockData';

export function Sidebar({ agents }: { agents: AIAgent[] }) {
  return (
    <aside className="hidden w-72 border-r border-cyan-400/10 p-4 lg:block">
      <h2 className="mb-3 text-xs uppercase text-cyan-300">AI Council</h2>
      <ul className="space-y-2 text-sm">
        {agents.map((agent) => (
          <li key={agent.id} className="card">
            <div className="font-medium">{agent.name}</div>
            <div className="text-xs text-slate-400">{agent.role}</div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
