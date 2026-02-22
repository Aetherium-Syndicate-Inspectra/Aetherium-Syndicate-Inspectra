import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, HardDrive, Wifi, Activity } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { generateTachyonData } from '../data/mockData';
import { systemApi } from '../services/apiClient';

interface TachyonMetrics {
  latency_us: number;
  throughput_rps: number;
  memory_percent: number;
}

export function TachyonPanel() {
  const [chartData] = useState(generateTachyonData);
  const [metrics, setMetrics] = useState<TachyonMetrics | null>(null);
  const [timeRange, setTimeRange] = useState('24h');

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await systemApi.getTachyonMetrics();
        setMetrics(data);
      } catch (error) {
        console.error("Error fetching Tachyon metrics:", error);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, []);

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
              ⚡ Tachyon <span className="glow-text text-cyan-glow">Core</span> CNS Monitor
            </h2>
            <p className="text-sm text-white/30">
              Rust-powered high-performance core engine • Real-time system metrics
            </p>
          </div>
          <div className="flex items-center gap-2">
            {['1h', '6h', '24h', '7d'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-mono tracking-wider transition-all ${
                  timeRange === range
                    ? 'bg-cyan-glow/20 text-cyan-glow border border-cyan-glow/30'
                    : 'text-white/30 hover:text-white/50 border border-transparent'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Core Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <CoreMetric icon={<Zap />} label="Core Latency" value={metrics ? `${metrics.latency_us}µs` : '...'} subtext="< 1µs target" status="optimal" delay={0} />
        <CoreMetric icon={<Activity />} label="Throughput" value={metrics ? `${metrics.throughput_rps}/s` : '...'} subtext="10K+ baseline" status="optimal" delay={0.05} />
        <CoreMetric icon={<HardDrive />} label="Memory Usage" value={metrics ? `${metrics.memory_percent}%` : '...'} subtext="Zero-copy active" status="normal" delay={0.1} />
        <CoreMetric icon={<Wifi />} label="Network I/O" value="4.8 Gbps" subtext="Full duplex" status="optimal" delay={0.15} />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Latency Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-glass rounded-xl p-5"
        >
          <h3 className="text-sm font-semibold text-white/80 mb-1">Latency Distribution</h3>
          <p className="text-[10px] text-white/30 mb-4">Microsecond-level measurement</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,240,255,0.05)" />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.2)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.2)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(10,14,26,0.95)',
                    border: '1px solid rgba(0,240,255,0.2)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                />
                <Line type="monotone" dataKey="latency" stroke="#00f0ff" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Throughput Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="card-glass rounded-xl p-5"
        >
          <h3 className="text-sm font-semibold text-white/80 mb-1">Request Throughput</h3>
          <p className="text-[10px] text-white/30 mb-4">Requests per second over time</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,240,255,0.05)" />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.2)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.2)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(10,14,26,0.95)',
                    border: '1px solid rgba(168,85,247,0.2)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="throughput" fill="rgba(168,85,247,0.6)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Memory Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-glass rounded-xl p-5"
        >
          <h3 className="text-sm font-semibold text-white/80 mb-1">Memory Allocation</h3>
          <p className="text-[10px] text-white/30 mb-4">Rust zero-copy memory management</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,240,255,0.05)" />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.2)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.2)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(10,14,26,0.95)',
                    border: '1px solid rgba(34,211,238,0.2)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                />
                <Area type="monotone" dataKey="memory" stroke="#22d3ee" strokeWidth={2} fill="url(#memGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Rust Engine Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="card-glass rounded-xl p-5"
        >
          <h3 className="text-sm font-semibold text-white/80 mb-4">Engine Internals</h3>
          <div className="space-y-4">
            <EngineMetric label="Rust Runtime" value="Active" detail="tokio async runtime" color="text-green-400" />
            <EngineMetric label="Thread Pool" value="64 threads" detail="Work-stealing scheduler" color="text-cyan-glow" />
            <EngineMetric label="GC Pauses" value="0ms" detail="No garbage collection (Rust)" color="text-purple-glow" />
            <EngineMetric label="Buffer Pool" value="2.4GB" detail="Pre-allocated ring buffers" color="text-amber-glow" />
            <EngineMetric label="Syscalls/sec" value="1,247" detail="io_uring optimized" color="text-pink-glow" />
            <EngineMetric label="Cache Hit" value="99.2%" detail="L1/L2 cache efficiency" color="text-green-400" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function CoreMetric({ icon, label, value, subtext, status, delay }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
  status: 'optimal' | 'normal' | 'warning';
  delay: number;
}) {
  const statusColors = {
    optimal: 'text-green-400 bg-green-400/10',
    normal: 'text-cyan-glow bg-cyan-glow/10',
    warning: 'text-amber-400 bg-amber-400/10',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="card-glass rounded-xl p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-cyan-glow/40">{icon}</span>
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${statusColors[status]}`}>
          {status.toUpperCase()}
        </span>
      </div>
      <div className="text-xl font-bold font-mono text-white mb-0.5">{value}</div>
      <div className="text-[10px] text-white/30">{label}</div>
      <div className="text-[9px] text-white/15 mt-1">{subtext}</div>
    </motion.div>
  );
}

function EngineMetric({ label, value, detail, color }: {
  label: string;
  value: string;
  detail: string;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/[0.03] last:border-0">
      <div>
        <div className="text-xs text-white/60">{label}</div>
        <div className="text-[10px] text-white/20">{detail}</div>
      </div>
      <div className={`text-sm font-mono font-semibold ${color}`}>{value}</div>
    </div>
  );
}
