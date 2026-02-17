export type AgentStatus = 'active' | 'idle' | 'processing';

export interface AIAgent {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  performance: number;
}

export const aiAgents: AIAgent[] = [
  { id: 'apex', name: 'APEX-Ω', role: 'CEO', status: 'active', performance: 99.7 },
  { id: 'vault', name: 'VAULT-Σ', role: 'CFO', status: 'active', performance: 98.4 },
  { id: 'forge', name: 'FORGE-Δ', role: 'CTO', status: 'processing', performance: 97.8 },
];
