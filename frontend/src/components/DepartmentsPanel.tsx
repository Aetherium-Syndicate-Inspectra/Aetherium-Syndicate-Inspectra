import { motion } from 'framer-motion';
import { ArrowUpRight, Users, CheckCircle2, TrendingUp } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { departments } from '../data/mockData';

export function DepartmentsPanel() {
  const chartData = departments.map(d => ({
    name: d.name.split(' ')[0],
    efficiency: d.efficiency,
    tasks: d.tasks,
    color: d.color,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-glass rounded-2xl p-6"
      >
        <h2 className="text-2xl font-bold text-white mb-1">
          🏢 Autonomous <span className="glow-text text-cyan-glow">Departments</span>
        </h2>
        <p className="text-sm text-white/30">
          6 independent AI-driven business divisions • Self-governing operations
        </p>
      </motion.div>

      {/* Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {departments.map((dept, index) => (
          <motion.div
            key={dept.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="card-glass rounded-xl p-5 hover:border-cyan-glow/20 transition-all group cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{dept.icon}</div>
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-cyan-glow transition-colors">{dept.name}</h3>
                  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                    dept.status === 'optimal' ? 'bg-green-400/10 text-green-400' :
                    dept.status === 'warning' ? 'bg-amber-400/10 text-amber-400' :
                    'bg-red-400/10 text-red-400'
                  }`}>
                    {dept.status.toUpperCase()}
                  </span>
                </div>
              </div>
              <ArrowUpRight size={14} className="text-white/10 group-hover:text-cyan-glow/50 transition-colors" />
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center">
                <Users size={12} className="mx-auto text-white/20 mb-1" />
                <div className="text-sm font-bold font-mono text-white">{dept.agents}</div>
                <div className="text-[9px] text-white/20">Agents</div>
              </div>
              <div className="text-center">
                <CheckCircle2 size={12} className="mx-auto text-white/20 mb-1" />
                <div className="text-sm font-bold font-mono text-white">{dept.tasks.toLocaleString()}</div>
                <div className="text-[9px] text-white/20">Tasks</div>
              </div>
              <div className="text-center">
                <TrendingUp size={12} className="mx-auto text-white/20 mb-1" />
                <div className="text-sm font-bold font-mono" style={{ color: dept.color }}>{dept.efficiency}%</div>
                <div className="text-[9px] text-white/20">Efficiency</div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-white/30">Efficiency</span>
                <span className="text-[10px] font-mono" style={{ color: dept.color }}>{dept.efficiency}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-aether-700 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${dept.efficiency}%` }}
                  transition={{ duration: 1, delay: 0.2 + index * 0.05 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: dept.color }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Efficiency Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-glass rounded-xl p-5"
        >
          <h3 className="text-sm font-semibold text-white/80 mb-1">Efficiency Comparison</h3>
          <p className="text-[10px] text-white/30 mb-4">Department performance ranking</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <XAxis type="number" domain={[90, 100]} tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.2)' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} width={80} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(10,14,26,0.95)',
                    border: '1px solid rgba(0,240,255,0.2)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="efficiency" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} fillOpacity={0.7} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="card-glass rounded-xl p-5"
        >
          <h3 className="text-sm font-semibold text-white/80 mb-1">Task Volume</h3>
          <p className="text-[10px] text-white/30 mb-4">Active tasks per department</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
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
                <Bar dataKey="tasks" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} fillOpacity={0.6} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
