import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Clock, CheckCircle2, Cpu, ArrowUpRight } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { aiAgents, generateAutonomousStrategyPlan } from '../data/mockData';

export function AgentsPanel() {
  const [objective, setObjective] = useState('Increase enterprise growth while reducing governance risk');
  const strategyPlan = useMemo(() => generateAutonomousStrategyPlan(objective), [objective]);

  return (
    <div className="space-y-6">
      {/* Council Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-glass rounded-2xl p-6"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              🤖 AI Executive <span className="glow-text text-cyan-glow">Council</span>
            </h2>
            <p className="text-sm text-white/30">
              Autonomous leadership hierarchy • Real-time performance tracking
            </p>
          </div>
          <div className="flex items-center gap-4">
            <StatusBadge label="Active" count={5} color="bg-green-400" />
            <StatusBadge label="Processing" count={2} color="bg-cyan-glow" />
            <StatusBadge label="Standby" count={1} color="bg-amber-400" />
          </div>
        </div>
      </motion.div>

      {/* CEO Spotlight */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-aether-800 via-aether-900 to-aether-800 border border-cyan-glow/20 p-6"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-cyan-glow/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-radial from-purple-glow/5 to-transparent rounded-full blur-3xl" />
        <div className="relative flex flex-col lg:flex-row items-start gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-cyan-glow/20 via-purple-glow/20 to-pink-glow/20 flex items-center justify-center text-4xl">
                👑
              </div>
              <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-400 ring-3 ring-aether-900 animate-pulse" />
            </div>
            <div>
              <div className="text-[10px] tracking-[0.3em] text-cyan-glow/50 uppercase mb-0.5">Supreme Intelligence</div>
              <h3 className="text-2xl font-bold text-white">APEX-Ω</h3>
              <p className="text-sm text-white/40">Chief Executive Officer</p>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
            <CEOStat label="Performance" value="99.7%" icon={<Activity size={14} />} color="text-cyan-glow" />
            <CEOStat label="Uptime" value="99.99%" icon={<Clock size={14} />} color="text-green-400" />
            <CEOStat label="Tasks Done" value="15,420" icon={<CheckCircle2 size={14} />} color="text-purple-glow" />
            <CEOStat label="Decisions" value="3,847" icon={<Cpu size={14} />} color="text-pink-glow" />
          </div>
        </div>
      </motion.div>

      {/* Agent Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {aiAgents.filter(a => a.id !== 'ceo-01').map((agent, index) => (
          <AgentCard key={agent.id} agent={agent} index={index} />
        ))}
      </div>

      {/* Capabilities Radar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card-glass rounded-2xl p-6"
      >
        <h3 className="text-sm font-semibold text-white/80 mb-4">Council Capability Matrix</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={[
              { ability: 'Strategy', score: 98 },
              { ability: 'Analytics', score: 95 },
              { ability: 'Innovation', score: 92 },
              { ability: 'Compliance', score: 97 },
              { ability: 'Communication', score: 89 },
              { ability: 'Adaptation', score: 94 },
              { ability: 'Security', score: 99 },
              { ability: 'Efficiency', score: 96 },
            ]}>
              <PolarGrid stroke="rgba(0,240,255,0.1)" />
              <PolarAngleAxis dataKey="ability" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} />
              <Radar name="Council" dataKey="score" stroke="#00f0ff" fill="#00f0ff" fillOpacity={0.15} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card-glass rounded-2xl p-6 border border-cyan-glow/10"
      >
        <div className="flex flex-col lg:flex-row lg:items-end gap-4 mb-5">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white/90 mb-2">Autonomous Strategy Council</h3>
            <p className="text-xs text-white/40 mb-3">Council can independently decide and plan enterprise strategy from one objective.</p>
            <input
              value={objective}
              onChange={(event) => setObjective(event.target.value)}
              className="w-full bg-aether-900/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-glow/40"
              placeholder="Set organization objective..."
            />
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <KpiBox label="Efficiency" value={strategyPlan.projectedKpis.efficiencyGain} />
            <KpiBox label="Risk" value={strategyPlan.projectedKpis.riskReduction} />
            <KpiBox label="Growth" value={strategyPlan.projectedKpis.growthPotential} />
          </div>
        </div>

        <div className="mb-4 text-xs text-white/50 flex flex-wrap gap-3">
          <span>Objective: <span className="text-white/75">{strategyPlan.objective}</span></span>
          <span>Autonomy: <span className="text-cyan-glow">{strategyPlan.autonomyLevel}%</span></span>
          <span>Horizon: <span className="text-white/75">{strategyPlan.horizon}</span></span>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            {strategyPlan.decisions.map((decision) => (
              <div key={`${decision.owner}-${decision.decision}`} className="rounded-xl border border-white/10 bg-aether-800/40 p-3">
                <div className="text-[10px] text-cyan-glow/90 mb-1">{decision.owner} • {decision.impact.toUpperCase()} IMPACT</div>
                <div className="text-xs text-white/80">{decision.decision}</div>
                <div className="text-[10px] text-white/40 mt-1">Confidence {(decision.confidence * 100).toFixed(0)}%</div>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-white/10 bg-aether-800/40 p-4">
            <div className="text-xs font-semibold text-white/80 mb-2">Execution Plan</div>
            <ol className="space-y-2 text-xs text-white/70 list-decimal list-inside">
              {strategyPlan.nextActions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ol>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function KpiBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-aether-800/60 border border-white/10 px-3 py-2 min-w-[74px]">
      <div className="text-[9px] text-white/30">{label}</div>
      <div className="text-sm font-mono text-white">{value}</div>
    </div>
  );
}

function StatusBadge({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`h-2 w-2 rounded-full ${color}`} />
      <span className="text-xs text-white/50">{label}</span>
      <span className="text-xs font-mono font-bold text-white/70">{count}</span>
    </div>
  );
}

function CEOStat({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-aether-800/50 rounded-xl p-3">
      <div className={`${color} mb-1`}>{icon}</div>
      <div className="text-lg font-bold font-mono text-white">{value}</div>
      <div className="text-[10px] text-white/30">{label}</div>
    </div>
  );
}

function AgentCard({ agent, index }: { agent: typeof aiAgents[0]; index: number }) {
  const statusColors = {
    active: 'text-green-400 bg-green-400/10 border-green-400/20',
    idle: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    processing: 'text-cyan-glow bg-cyan-glow/10 border-cyan-glow/20',
    alert: 'text-red-400 bg-red-400/10 border-red-400/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.05 }}
      className="card-glass rounded-xl p-5 hover:border-cyan-glow/20 transition-all group cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{agent.icon}</span>
          <div>
            <h4 className="text-sm font-bold text-white group-hover:text-cyan-glow transition-colors">{agent.name}</h4>
            <p className="text-[10px] text-white/30">{agent.role}</p>
          </div>
        </div>
        <span className={`text-[9px] px-2 py-0.5 rounded-full border ${statusColors[agent.status]}`}>
          {agent.status.toUpperCase()}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-white/30">Performance</span>
            <span className="text-[10px] font-mono text-cyan-glow">{agent.performance}%</span>
          </div>
          <div className="h-1 rounded-full bg-aether-700 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${agent.performance}%` }}
              transition={{ duration: 1, delay: 0.2 + index * 0.05 }}
              className="h-full rounded-full bg-gradient-to-r from-cyan-glow to-blue-500"
            />
          </div>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-white/20">Uptime: <span className="text-white/50 font-mono">{agent.uptime}%</span></span>
          <span className="text-white/20">Tasks: <span className="text-white/50 font-mono">{agent.tasksCompleted.toLocaleString()}</span></span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
        <span className="text-[10px] text-white/20">{agent.department}</span>
        <ArrowUpRight size={12} className="text-white/10 group-hover:text-cyan-glow transition-colors" />
      </div>
    </motion.div>
  );
}
