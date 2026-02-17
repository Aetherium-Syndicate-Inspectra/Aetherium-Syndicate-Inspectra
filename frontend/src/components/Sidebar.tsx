import { motion, AnimatePresence } from 'framer-motion';
import { aiAgents } from '../data/mockData';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const statusColors = {
  active: 'bg-green-400',
  idle: 'bg-amber-400',
  processing: 'bg-cyan-glow',
  alert: 'bg-red-400',
};

const statusLabels = {
  active: 'Online',
  idle: 'Standby',
  processing: 'Working',
  alert: 'Alert',
};

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-aether-900/95 backdrop-blur-xl border-r border-cyan-glow/10 z-50 transform transition-transform duration-300 lg:sticky lg:top-0 lg:z-30 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto pt-4 pb-6">
          {/* Section: AI Executive Council */}
          <div className="px-4 mb-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-1 w-1 rounded-full bg-cyan-glow animate-pulse" />
              <h3 className="text-[10px] font-bold tracking-[0.25em] text-cyan-glow/60 uppercase">
                Executive Council
              </h3>
            </div>
          </div>

          <div className="space-y-1 px-2">
            {aiAgents.map((agent, index) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-cyan-glow/5 cursor-pointer transition-all"
              >
                <div className="relative">
                  <span className="text-lg">{agent.icon}</span>
                  <span className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ${statusColors[agent.status]} ring-2 ring-aether-900`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-white/80 group-hover:text-cyan-glow transition-colors truncate">
                    {agent.name}
                  </div>
                  <div className="text-[10px] text-white/30 truncate">{agent.role}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-[10px] font-mono text-cyan-glow/60">{agent.performance}%</div>
                  <div className={`text-[9px] ${
                    agent.status === 'active' ? 'text-green-400' :
                    agent.status === 'processing' ? 'text-cyan-glow' :
                    agent.status === 'idle' ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {statusLabels[agent.status]}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* System Health */}
          <div className="mt-6 px-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-1 w-1 rounded-full bg-purple-glow animate-pulse" />
              <h3 className="text-[10px] font-bold tracking-[0.25em] text-purple-glow/60 uppercase">
                System Health
              </h3>
            </div>
            <div className="space-y-3">
              <HealthBar label="CPU Cores" value={67} color="from-cyan-glow to-blue-500" />
              <HealthBar label="Memory" value={72} color="from-purple-glow to-pink-500" />
              <HealthBar label="Network I/O" value={45} color="from-green-400 to-cyan-glow" />
              <HealthBar label="Storage" value={38} color="from-amber-400 to-orange-500" />
            </div>
          </div>

          {/* Tachyon Stats */}
          <div className="mt-6 mx-4 p-3 rounded-lg card-glass">
            <div className="text-[10px] text-cyan-glow/50 tracking-wider mb-2">TACHYON CORE STATUS</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-lg font-bold font-mono text-cyan-glow">0.3<span className="text-xs">µs</span></div>
                <div className="text-[9px] text-white/30">Latency</div>
              </div>
              <div>
                <div className="text-lg font-bold font-mono text-purple-glow">12.8<span className="text-xs">K</span></div>
                <div className="text-[9px] text-white/30">Req/sec</div>
              </div>
            </div>
          </div>

          {/* Version */}
          <div className="mt-auto pt-4 px-4">
            <div className="p-3 rounded-lg bg-aether-800/30 border border-cyan-glow/5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/20">Platform</span>
                <span className="text-[10px] font-mono text-cyan-glow/40">v4.3.1</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-white/20">Readiness</span>
                <span className="text-[10px] font-mono text-green-400/60">90%</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-white/20">Mode</span>
                <span className="text-[10px] font-mono text-purple-glow/60">High Integrity</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function HealthBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-white/40">{label}</span>
        <span className="text-[10px] font-mono text-white/60">{value}%</span>
      </div>
      <div className="h-1 rounded-full bg-aether-700 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`h-full rounded-full bg-gradient-to-r ${color}`}
        />
      </div>
    </div>
  );
}
