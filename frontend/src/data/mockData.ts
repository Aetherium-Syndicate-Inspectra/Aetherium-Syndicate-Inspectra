export interface AIAgent {
  id: string;
  name: string;
  role: string;
  department: string;
  status: 'active' | 'idle' | 'processing' | 'alert';
  performance: number;
  uptime: number;
  tasksCompleted: number;
  icon: string;
}

export interface MetricData {
  label: string;
  value: string | number;
  change: number;
  unit?: string;
  color: string;
}

export interface DepartmentData {
  name: string;
  icon: string;
  agents: number;
  efficiency: number;
  tasks: number;
  status: 'optimal' | 'warning' | 'critical';
  color: string;
}

export interface TachyonMetric {
  time: string;
  latency: number;
  throughput: number;
  memory: number;
}

export interface ResonanceDrift {
  time: string;
  alignment: number;
  drift: number;
  confidence: number;
}

export const aiAgents: AIAgent[] = [
  { id: 'ceo-01', name: 'APEX-Ω', role: 'Chief Executive Officer', department: 'Executive Board', status: 'active', performance: 99.7, uptime: 99.99, tasksCompleted: 15420, icon: '👑' },
  { id: 'cfo-01', name: 'VAULT-Σ', role: 'Chief Financial Officer', department: 'Finance & Investment', status: 'active', performance: 98.4, uptime: 99.95, tasksCompleted: 12380, icon: '💰' },
  { id: 'cto-01', name: 'FORGE-Δ', role: 'Chief Technology Officer', department: 'R&D', status: 'processing', performance: 97.8, uptime: 99.97, tasksCompleted: 18950, icon: '⚡' },
  { id: 'cmo-01', name: 'PULSE-Φ', role: 'Chief Marketing Officer', department: 'Marketing & Sales', status: 'active', performance: 96.5, uptime: 99.92, tasksCompleted: 9870, icon: '📡' },
  { id: 'coo-01', name: 'NEXUS-Ψ', role: 'Chief Operating Officer', department: 'Operations & Logistics', status: 'active', performance: 98.1, uptime: 99.96, tasksCompleted: 22140, icon: '🔧' },
  { id: 'clo-01', name: 'AEGIS-Θ', role: 'Chief Legal Officer', department: 'Legal & Compliance', status: 'idle', performance: 95.2, uptime: 99.88, tasksCompleted: 7650, icon: '⚖️' },
  { id: 'chro-01', name: 'SYNTH-Λ', role: 'Chief HR Officer', department: 'HR & Recruitment', status: 'active', performance: 94.8, uptime: 99.91, tasksCompleted: 8920, icon: '🧬' },
  { id: 'cso-01', name: 'PRISM-Ξ', role: 'Chief Strategy Officer', department: 'Executive Board', status: 'processing', performance: 97.3, uptime: 99.94, tasksCompleted: 11200, icon: '🎯' },
];

export const executiveMetrics: MetricData[] = [
  { label: 'System Integrity', value: '99.97%', change: 0.02, color: 'cyan' },
  { label: 'AI Agents Online', value: '47/48', change: -1, color: 'green' },
  { label: 'Throughput', value: '12,847', change: 342, unit: 'req/s', color: 'purple' },
  { label: 'Tachyon Latency', value: '0.3µs', change: -0.1, color: 'amber' },
  { label: 'Policy Compliance', value: '100%', change: 0, color: 'green' },
  { label: 'Resonance Score', value: '97.8', change: 1.2, color: 'pink' },
];

export const departments: DepartmentData[] = [
  { name: 'Marketing & Sales', icon: '📊', agents: 8, efficiency: 96.5, tasks: 1240, status: 'optimal', color: '#00f0ff' },
  { name: 'R&D', icon: '🔬', agents: 12, efficiency: 97.8, tasks: 2150, status: 'optimal', color: '#a855f7' },
  { name: 'Legal & Compliance', icon: '⚖️', agents: 5, efficiency: 95.2, tasks: 680, status: 'warning', color: '#f59e0b' },
  { name: 'HR & Recruitment', icon: '🧬', agents: 6, efficiency: 94.8, tasks: 890, status: 'optimal', color: '#22d3ee' },
  { name: 'Finance & Investment', icon: '💎', agents: 9, efficiency: 98.4, tasks: 1580, status: 'optimal', color: '#ec4899' },
  { name: 'Operations & Logistics', icon: '⚙️', agents: 8, efficiency: 98.1, tasks: 3200, status: 'optimal', color: '#22c55e' },
];

export function generateTachyonData(): TachyonMetric[] {
  const data: TachyonMetric[] = [];
  for (let i = 0; i < 24; i++) {
    data.push({
      time: `${String(i).padStart(2, '0')}:00`,
      latency: Math.random() * 0.5 + 0.1,
      throughput: Math.floor(Math.random() * 5000 + 8000),
      memory: Math.random() * 20 + 60,
    });
  }
  return data;
}

export function generateResonanceData(): ResonanceDrift[] {
  const data: ResonanceDrift[] = [];
  for (let i = 0; i < 30; i++) {
    data.push({
      time: `Day ${i + 1}`,
      alignment: Math.random() * 3 + 96,
      drift: Math.random() * 2,
      confidence: Math.random() * 5 + 94,
    });
  }
  return data;
}

export interface EventLog {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'critical';
  source: string;
  message: string;
}

export const eventLogs: EventLog[] = [
  { id: 'e1', timestamp: '14:32:07.423', type: 'success', source: 'APEX-Ω', message: 'Strategic quarterly review completed. Revenue projections updated.' },
  { id: 'e2', timestamp: '14:31:55.891', type: 'info', source: 'Tachyon-Core', message: 'Throughput optimization cycle complete. Latency reduced by 0.02µs.' },
  { id: 'e3', timestamp: '14:31:42.156', type: 'warning', source: 'AEGIS-Θ', message: 'Regulatory compliance update detected. Initiating policy review.' },
  { id: 'e4', timestamp: '14:31:28.774', type: 'success', source: 'FORGE-Δ', message: 'New ML model deployed to production. A/B testing initiated.' },
  { id: 'e5', timestamp: '14:31:15.332', type: 'info', source: 'AetherBus', message: 'Zero-copy data transfer completed. 2.4TB processed.' },
  { id: 'e6', timestamp: '14:30:58.118', type: 'success', source: 'NEXUS-Ψ', message: 'Supply chain optimization completed. 12% efficiency improvement.' },
  { id: 'e7', timestamp: '14:30:44.667', type: 'critical', source: 'Resonance-DDT', message: 'Minor drift detected in SYNTH-Λ alignment vector. Auto-correcting.' },
  { id: 'e8', timestamp: '14:30:31.445', type: 'info', source: 'VAULT-Σ', message: 'Portfolio rebalancing complete. Risk assessment updated.' },
  { id: 'e9', timestamp: '14:30:18.223', type: 'success', source: 'PULSE-Φ', message: 'Campaign performance analysis complete. ROI: +340%.' },
  { id: 'e10', timestamp: '14:30:05.001', type: 'info', source: 'PRISM-Ξ', message: 'Market intelligence scan complete. 47 opportunities identified.' },
];

export interface PolicyItem {
  id: string;
  name: string;
  status: 'enforced' | 'testing' | 'draft';
  coverage: number;
  lastUpdated: string;
}

export interface CouncilDecision {
  owner: string;
  decision: string;
  impact: 'high' | 'medium';
  confidence: number;
}

export interface StrategyPlan {
  objective: string;
  autonomyLevel: number;
  horizon: string;
  projectedKpis: {
    efficiencyGain: string;
    riskReduction: string;
    growthPotential: string;
  };
  decisions: CouncilDecision[];
  nextActions: string[];
}

export const policies: PolicyItem[] = [
  { id: 'p1', name: 'Data Sovereignty Protocol', status: 'enforced', coverage: 100, lastUpdated: '2 hours ago' },
  { id: 'p2', name: 'AI Alignment Verification', status: 'enforced', coverage: 99.8, lastUpdated: '15 min ago' },
  { id: 'p3', name: 'Zero-Trust Communication', status: 'enforced', coverage: 100, lastUpdated: '1 hour ago' },
  { id: 'p4', name: 'Autonomous Decision Bounds', status: 'testing', coverage: 94.5, lastUpdated: '30 min ago' },
  { id: 'p5', name: 'Resource Allocation Limits', status: 'enforced', coverage: 98.2, lastUpdated: '45 min ago' },
  { id: 'p6', name: 'Cross-Agent Collaboration', status: 'draft', coverage: 78.0, lastUpdated: '3 hours ago' },
];

export function generateAutonomousStrategyPlan(rawObjective: string): StrategyPlan {
  const objective = rawObjective.trim() || 'Scale enterprise operations while preserving governance quality';
  const normalized = objective.toLowerCase();

  const focus: Array<{ keyword: string; signal: string; owner: string }> = [
    { keyword: 'growth', signal: 'market expansion', owner: 'PULSE-Φ' },
    { keyword: 'cost', signal: 'unit economics discipline', owner: 'VAULT-Σ' },
    { keyword: 'risk', signal: 'regulatory shielding', owner: 'AEGIS-Θ' },
    { keyword: 'talent', signal: 'workforce adaptability', owner: 'SYNTH-Λ' },
  ];

  const matched = focus.find((item) => normalized.includes(item.keyword));
  const primarySignal = matched?.signal ?? 'cross-functional orchestration';

  return {
    objective,
    autonomyLevel: 93,
    horizon: '12 weeks',
    projectedKpis: {
      efficiencyGain: '+14%',
      riskReduction: '-21%',
      growthPotential: '+11%',
    },
    decisions: [
      {
        owner: 'APEX-Ω',
        decision: `Authorize autonomous council execution around ${primarySignal} with governance guardrails.`,
        impact: 'high',
        confidence: 0.97,
      },
      {
        owner: matched?.owner ?? 'PRISM-Ξ',
        decision: `Deploy scenario simulation pods to optimize objective: "${objective}" before broad rollout.`,
        impact: 'high',
        confidence: 0.94,
      },
      {
        owner: 'NEXUS-Ψ',
        decision: 'Auto-reallocate shared resources every 6 hours based on live KPI drift.',
        impact: 'medium',
        confidence: 0.91,
      },
    ],
    nextActions: [
      'Spin up autonomous planning cycle and baseline governance metrics.',
      'Run policy-safe experiment in one pilot business unit for 7 days.',
      'Promote successful strategy to enterprise-wide execution with audit replay.',
    ],
  };
}
