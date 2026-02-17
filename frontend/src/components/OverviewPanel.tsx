import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Minus, Activity, TrendingUp, Users, Zap, ShieldCheck, Brain } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { executiveMetrics, eventLogs, generateTachyonData, type EventLog } from '../data/mockData';

const metricIcons = [ShieldCheck, Users, Activity, Zap, ShieldCheck, Brain];

const miniChartData = Array.from({ length: 20 }, (_, i) => ({
  t: i,
  v: Math.random() * 40 + 60,
}));

export function OverviewPanel() {
  const [tachyonData] = useState(generateTachyonData);

  return (
    <div className="space-y-6">
      {/* Hero Status Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl card-glass p-6"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-cyan-glow/5 via-purple-glow/5 to-transparent rounded-full blur-3xl" />
        <div className="relative">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[10px] tracking-[0.3em] text-green-400/80 uppercase font-semibold">All Systems Operational</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">
                Executive <span className="glow-text text-cyan-glow">War Room</span>
              </h2>
              <p className="text-sm text-white/30">
                Aetherium Syndicate • High Integrity Edition • Functional Prototype 90%
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center px-4 py-2 rounded-lg bg-aether-800/50">
                <div className="text-2xl font-bold font-mono text-cyan-glow">47</div>
                <div className="text-[9px] text-white/30 tracking-wider">AGENTS</div>
              </div>
              <div className="text-center px-4 py-2 rounded-lg bg-aether-800/50">
                <div className="text-2xl font-bold font-mono text-purple-glow">6</div>
                <div className="text-[9px] text-white/30 tracking-wider">DIVISIONS</div>
              </div>
              <div className="text-center px-4 py-2 rounded-lg bg-aether-800/50">
                <div className="text-2xl font-bold font-mono text-green-400">99.97<span className="text-xs">%</span></div>
                <div className="text-[9px] text-white/30 tracking-wider">UPTIME</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {executiveMetrics.map((metric, index) => {
          const Icon = metricIcons[index];
          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card-glass rounded-xl p-4 hover:border-cyan-glow/20 transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <Icon size={14} className="text-cyan-glow/40 group-hover:text-cyan-glow/70 transition-colors" />
                <ChangeIndicator value={metric.change} />
              </div>
              <div className="text-xl font-bold font-mono text-white mb-0.5">{metric.value}</div>
              <div className="text-[10px] text-white/30 tracking-wide">{metric.label}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Throughput Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 card-glass rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white/80">AetherBus Throughput</h3>
              <p className="text-[10px] text-white/30">24-hour processing volume</p>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-green-400/10 text-green-400 text-[10px] font-mono">
              <TrendingUp size={10} />
              +12.4%
            </div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tachyonData}>
                <defs>
                  <linearGradient id="throughputGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00f0ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.2)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(10,14,26,0.95)',
                    border: '1px solid rgba(0,240,255,0.2)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                />
                <Area type="monotone" dataKey="throughput" stroke="#00f0ff" strokeWidth={2} fill="url(#throughputGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Mini Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <div className="card-glass-purple rounded-xl p-5">
            <div className="text-[10px] text-purple-glow/50 tracking-wider mb-2">RESONANCE ALIGNMENT</div>
            <div className="text-3xl font-bold font-mono text-purple-glow mb-2">97.8<span className="text-sm">%</span></div>
            <div className="h-20">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={miniChartData}>
                  <defs>
                    <linearGradient id="resGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="v" stroke="#a855f7" strokeWidth={1.5} fill="url(#resGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card-glass rounded-xl p-5">
            <div className="text-[10px] text-cyan-glow/50 tracking-wider mb-2">ZERO-COPY TRANSFERS</div>
            <div className="text-3xl font-bold font-mono text-cyan-glow mb-1">2.4<span className="text-sm">TB</span></div>
            <div className="text-[10px] text-white/30">Last hour • No data loss</div>
          </div>

          <div className="card-glass rounded-xl p-5">
            <div className="text-[10px] text-green-glow/50 tracking-wider mb-2">POLICY COMPLIANCE</div>
            <div className="text-3xl font-bold font-mono text-green-400 mb-1">100<span className="text-sm">%</span></div>
            <div className="text-[10px] text-white/30">6/6 policies enforced</div>
          </div>
        </motion.div>
      </div>

      {/* Event Log */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card-glass rounded-xl p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white/80">Live Event Stream</h3>
            <p className="text-[10px] text-white/30">AetherBus real-time monitoring</p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] text-green-400/60 font-mono">LIVE</span>
          </div>
        </div>
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {eventLogs.map((log, index) => (
            <EventLogRow key={log.id} log={log} index={index} />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function ChangeIndicator({ value }: { value: number }) {
  if (value > 0) {
    return (
      <div className="flex items-center gap-0.5 text-green-400 text-[10px] font-mono">
        <ArrowUpRight size={10} />
        +{value}
      </div>
    );
  }
  if (value < 0) {
    return (
      <div className="flex items-center gap-0.5 text-red-400 text-[10px] font-mono">
        <ArrowDownRight size={10} />
        {value}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-0.5 text-white/20 text-[10px] font-mono">
      <Minus size={10} />
      0
    </div>
  );
}

function EventLogRow({ log, index }: { log: EventLog; index: number }) {
  const typeColors = {
    info: 'text-blue-400 bg-blue-400/10',
    success: 'text-green-400 bg-green-400/10',
    warning: 'text-amber-400 bg-amber-400/10',
    critical: 'text-red-400 bg-red-400/10',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-white/[0.02] transition-colors"
    >
      <span className="text-[10px] font-mono text-white/20 mt-0.5 flex-shrink-0 w-20">{log.timestamp}</span>
      <span className={`text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded ${typeColors[log.type]} flex-shrink-0 mt-0.5`}>
        {log.type.toUpperCase()}
      </span>
      <span className="text-[10px] font-mono text-cyan-glow/60 flex-shrink-0 w-24 mt-0.5">{log.source}</span>
      <span className="text-xs text-white/50 leading-relaxed">{log.message}</span>
    </motion.div>
  );
}
