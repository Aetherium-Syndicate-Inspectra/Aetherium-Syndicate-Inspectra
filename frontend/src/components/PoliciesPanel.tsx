import { motion } from 'framer-motion';
import { ShieldCheck, AlertTriangle, FileText, Clock, CheckCircle2, Edit3 } from 'lucide-react';
import { policies } from '../data/mockData';

export function PoliciesPanel() {
  const enforced = policies.filter(p => p.status === 'enforced').length;
  const testing = policies.filter(p => p.status === 'testing').length;
  const draft = policies.filter(p => p.status === 'draft').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-glass rounded-2xl p-6"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              📋 Causal <span className="glow-text text-cyan-glow">Policy</span> Lab
            </h2>
            <p className="text-sm text-white/30">
              Policy simulation, enforcement & compliance management
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-400/10 border border-green-400/20">
              <CheckCircle2 size={12} className="text-green-400" />
              <span className="text-xs font-mono text-green-400">{enforced} Enforced</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400/10 border border-amber-400/20">
              <AlertTriangle size={12} className="text-amber-400" />
              <span className="text-xs font-mono text-amber-400">{testing} Testing</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <Edit3 size={12} className="text-white/40" />
              <span className="text-xs font-mono text-white/40">{draft} Draft</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Policy Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {policies.map((policy, index) => (
          <motion.div
            key={policy.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`rounded-xl p-5 transition-all cursor-pointer ${
              policy.status === 'enforced'
                ? 'card-glass hover:border-green-400/20'
                : policy.status === 'testing'
                ? 'card-glass hover:border-amber-400/20'
                : 'card-glass hover:border-white/10'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  policy.status === 'enforced' ? 'bg-green-400/10' :
                  policy.status === 'testing' ? 'bg-amber-400/10' : 'bg-white/5'
                }`}>
                  {policy.status === 'enforced' ? <ShieldCheck size={18} className="text-green-400" /> :
                   policy.status === 'testing' ? <AlertTriangle size={18} className="text-amber-400" /> :
                   <FileText size={18} className="text-white/30" />}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white/80">{policy.name}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Clock size={10} className="text-white/20" />
                    <span className="text-[10px] text-white/20">Updated {policy.lastUpdated}</span>
                  </div>
                </div>
              </div>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                policy.status === 'enforced' ? 'bg-green-400/10 text-green-400 border border-green-400/20' :
                policy.status === 'testing' ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20' :
                'bg-white/5 text-white/30 border border-white/10'
              }`}>
                {policy.status.toUpperCase()}
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-white/30">Coverage</span>
                <span className={`text-xs font-mono font-semibold ${
                  policy.coverage >= 98 ? 'text-green-400' :
                  policy.coverage >= 90 ? 'text-amber-400' : 'text-white/50'
                }`}>{policy.coverage}%</span>
              </div>
              <div className="h-2 rounded-full bg-aether-700 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${policy.coverage}%` }}
                  transition={{ duration: 1, delay: 0.2 + index * 0.05 }}
                  className={`h-full rounded-full ${
                    policy.status === 'enforced' ? 'bg-gradient-to-r from-green-400 to-cyan-glow' :
                    policy.status === 'testing' ? 'bg-gradient-to-r from-amber-400 to-orange-500' :
                    'bg-gradient-to-r from-white/20 to-white/10'
                  }`}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Compliance Matrix */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card-glass rounded-xl p-5"
      >
        <h3 className="text-sm font-semibold text-white/80 mb-4">Enterprise Compliance Matrix</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ComplianceBlock
            title="Data Governance"
            items={['Data Sovereignty', 'GDPR Compliance', 'Data Retention', 'Access Control']}
            score={98}
            color="cyan"
          />
          <ComplianceBlock
            title="AI Safety"
            items={['Alignment Verification', 'Decision Bounds', 'Drift Detection', 'Kill Switch']}
            score={97}
            color="purple"
          />
          <ComplianceBlock
            title="Operations"
            items={['Zero-Trust Comms', 'Resource Limits', 'Audit Trail', 'Incident Response']}
            score={99}
            color="green"
          />
        </div>
      </motion.div>

      {/* Audit Trail */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="card-glass rounded-xl p-5"
      >
        <h3 className="text-sm font-semibold text-white/80 mb-4">Recent Policy Audit Trail</h3>
        <div className="space-y-2">
          {[
            { time: '14:30', action: 'AI Alignment Verification scan completed', result: 'PASS', agent: 'Resonance-DDT' },
            { time: '14:15', action: 'Zero-Trust Communication handshake verified', result: 'PASS', agent: 'AetherBus' },
            { time: '14:00', action: 'Autonomous Decision Bounds test cycle #847', result: 'PARTIAL', agent: 'APEX-Ω' },
            { time: '13:45', action: 'Resource Allocation audit completed', result: 'PASS', agent: 'NEXUS-Ψ' },
            { time: '13:30', action: 'Data Sovereignty Protocol integrity check', result: 'PASS', agent: 'AEGIS-Θ' },
          ].map((entry, i) => (
            <div key={i} className="flex items-center gap-4 py-2 px-3 rounded-lg hover:bg-white/[0.02] transition-colors">
              <span className="text-[10px] font-mono text-white/20 w-12">{entry.time}</span>
              <span className="text-xs text-white/50 flex-1">{entry.action}</span>
              <span className="text-[10px] font-mono text-cyan-glow/50 w-24">{entry.agent}</span>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                entry.result === 'PASS' ? 'bg-green-400/10 text-green-400' : 'bg-amber-400/10 text-amber-400'
              }`}>
                {entry.result}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function ComplianceBlock({ title, items, score, color }: {
  title: string;
  items: string[];
  score: number;
  color: 'cyan' | 'purple' | 'green';
}) {
  const colors = {
    cyan: { text: 'text-cyan-glow', bg: 'bg-cyan-glow', border: 'border-cyan-glow/20' },
    purple: { text: 'text-purple-glow', bg: 'bg-purple-glow', border: 'border-purple-glow/20' },
    green: { text: 'text-green-400', bg: 'bg-green-400', border: 'border-green-400/20' },
  };

  return (
    <div className={`p-4 rounded-xl bg-aether-800/30 border ${colors[color].border}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className={`text-xs font-semibold ${colors[color].text}`}>{title}</h4>
        <span className={`text-lg font-bold font-mono ${colors[color].text}`}>{score}%</span>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item} className="flex items-center gap-2">
            <CheckCircle2 size={10} className="text-green-400" />
            <span className="text-[10px] text-white/40">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
