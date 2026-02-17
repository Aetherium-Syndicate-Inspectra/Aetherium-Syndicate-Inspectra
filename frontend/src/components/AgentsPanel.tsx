import type { AIAgent } from '@/data/mockData';

export function AgentsPanel({ agents }: { agents: AIAgent[] }) {
  return <div className="card text-sm">Agents online: {agents.length}</div>;
}
