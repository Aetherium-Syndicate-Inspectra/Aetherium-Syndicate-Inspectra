import { useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { generateResonanceData } from '../data/mockData';

export function ResonancePanel() {
  const [data] = useState(generateResonanceData);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-glass-purple rounded-2xl p-6"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              🔮 Resonance <span className="text-purple-glow">Drift</span> Detector
            </h2>
            <p className="text-sm text-white/30">
              AI alignment monitoring • Drift detection & auto-correction
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-400/10 border border-green-400/20">
            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-semibold text-green-400">ALIGNMENT STABLE</span>
          </div>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-glass-purple rounded-xl p-5 text-center"
        >
          <div className="text-[10px] text-purple-glow/50 tracking-wider mb-2">ALIGNMENT SCORE</div>
          <div className="text-4xl font-bold font-mono text-purple-glow mb-1">97.8<span className="text-lg">%</span></div>
          <div className="text-[10px] text-white/30">30-day rolling average</div>
          <div className="mt-3 h-1 rounded-full bg-aether-700 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '97.8%' }}
              transition={{ duration: 1.5 }}
              className="h-full rounded-full bg-gradient-to-r from-purple-glow to-pink-glow"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card-glass rounded-xl p-5 text-center"
        >
          <div className="text-[10px] text-cyan-glow/50 tracking-wider mb-2">DRIFT MAGNITUDE</div>
          <div className="text-4xl font-bold font-mono text-cyan-glow mb-1">0.42<span className="text-lg">°</span></div>
          <div className="text-[10px] text-white/30">Within acceptable bounds</div>
          <div className="mt-3 h-1 rounded-full bg-aether-700 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '4.2%' }}
              transition={{ duration: 1.5 }}
              className="h-full rounded-full bg-gradient-to-r from-cyan-glow to-blue-500"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-glass rounded-xl p-5 text-center"
        >
          <div className="text-[10px] text-green-glow/50 tracking-wider mb-2">CONFIDENCE INDEX</div>
          <div className="text-4xl font-bold font-mono text-green-400 mb-1">96.4<span className="text-lg">%</span></div>
          <div className="text-[10px] text-white/30">Bayesian confidence level</div>
          <div className="mt-3 h-1 rounded-full bg-aether-700 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '96.4%' }}
              transition={{ duration: 1.5 }}
              className="h-full rounded-full bg-gradient-to-r from-green-400 to-cyan-glow"
            />
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="card-glass-purple rounded-xl p-5"
        >
          <h3 className="text-sm font-semibold text-white/80 mb-1">Alignment Trajectory</h3>
          <p className="text-[10px] text-white/30 mb-4">30-day alignment score tracking</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="alignGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(168,85,247,0.05)" />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.2)' }} axisLine={false} tickLine={false} />
                <YAxis domain={[90, 100]} tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.2)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(10,14,26,0.95)',
                    border: '1px solid rgba(168,85,247,0.2)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                />
                <Area type="monotone" dataKey="alignment" stroke="#a855f7" strokeWidth={2} fill="url(#alignGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-glass rounded-xl p-5"
        >
          <h3 className="text-sm font-semibold text-white/80 mb-1">Drift Detection</h3>
          <p className="text-[10px] text-white/30 mb-4">Anomaly detection over time</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,240,255,0.05)" />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.2)' }} axisLine={false} tickLine={false} />
                <YAxis
                  yAxisId="left"
                  domain={[0, 2.5]}
                  tick={{ fontSize: 9, fill: 'rgba(239, 68, 68, 0.5)' }}
                  axisLine={false}
                  tickLine={false}
                  stroke="#ef4444"
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[90, 100]}
                  tick={{ fontSize: 9, fill: 'rgba(34, 211, 238, 0.5)' }}
                  axisLine={false}
                  tickLine={false}
                  stroke="#22d3ee"
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(10,14,26,0.95)',
                    border: '1px solid rgba(0,240,255,0.2)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                />
                <Line yAxisId="left" type="monotone" dataKey="drift" stroke="#ef4444" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="confidence" stroke="#22d3ee" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Agent Alignment Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="card-glass-purple rounded-xl p-5"
      >
        <h3 className="text-sm font-semibold text-white/80 mb-4">Per-Agent Alignment Status</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-purple-glow/10">
                <th className="text-left text-[10px] text-white/30 pb-3 tracking-wider">AGENT</th>
                <th className="text-left text-[10px] text-white/30 pb-3 tracking-wider">ALIGNMENT</th>
                <th className="text-left text-[10px] text-white/30 pb-3 tracking-wider">DRIFT</th>
                <th className="text-left text-[10px] text-white/30 pb-3 tracking-wider">LAST CHECK</th>
                <th className="text-left text-[10px] text-white/30 pb-3 tracking-wider">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {[
                { name: 'APEX-Ω', align: 99.7, drift: 0.08, check: '2s ago', status: 'stable' },
                { name: 'VAULT-Σ', align: 98.4, drift: 0.21, check: '5s ago', status: 'stable' },
                { name: 'FORGE-Δ', align: 97.8, drift: 0.34, check: '1s ago', status: 'stable' },
                { name: 'PULSE-Φ', align: 96.5, drift: 0.52, check: '3s ago', status: 'stable' },
                { name: 'NEXUS-Ψ', align: 98.1, drift: 0.18, check: '4s ago', status: 'stable' },
                { name: 'AEGIS-Θ', align: 95.2, drift: 0.67, check: '8s ago', status: 'monitoring' },
                { name: 'SYNTH-Λ', align: 94.8, drift: 1.42, check: '1s ago', status: 'correcting' },
                { name: 'PRISM-Ξ', align: 97.3, drift: 0.29, check: '6s ago', status: 'stable' },
              ].map((agent) => (
                <tr key={agent.name} className="hover:bg-white/[0.02]">
                  <td className="py-3 text-xs font-mono text-white/70">{agent.name}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1 rounded-full bg-aether-700 overflow-hidden">
                        <div className="h-full rounded-full bg-purple-glow" style={{ width: `${agent.align}%` }} />
                      </div>
                      <span className="text-xs font-mono text-purple-glow">{agent.align}%</span>
                    </div>
                  </td>
                  <td className="py-3 text-xs font-mono text-white/40">{agent.drift}°</td>
                  <td className="py-3 text-xs text-white/30">{agent.check}</td>
                  <td className="py-3">
                    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                      agent.status === 'stable' ? 'bg-green-400/10 text-green-400' :
                      agent.status === 'monitoring' ? 'bg-amber-400/10 text-amber-400' :
                      'bg-red-400/10 text-red-400'
                    }`}>
                      {agent.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
