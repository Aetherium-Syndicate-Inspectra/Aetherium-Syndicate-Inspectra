import { motion } from 'framer-motion';
import { Sparkles, ShieldCheck, Cpu, ArrowRight } from 'lucide-react';
import { FeatureCard } from '../components/landing/FeatureCard';

interface LandingPageProps {
  onEnterDashboard: () => void;
}

const coreFeatures = [
  {
    badge: 'Integrity by Design',
    title: 'ควบคุมการทำงานได้อย่างมั่นใจทุกชั้น',
    description: 'ตั้งแต่ policy ไปจนถึง workload observability ทุกข้อมูลจะถูกรวมไว้ในมุมมองเดียวเพื่อให้ตัดสินใจเร็วขึ้น',
  },
  {
    badge: 'Executive AI Council',
    title: 'ทำงานร่วมกับเอเจนต์เฉพาะทางแบบ orchestration',
    description: 'จัดสรรงานข้ามทีม, วิเคราะห์ความเสี่ยง, และพยากรณ์แนวโน้มเชิงธุรกิจแบบ near real-time',
  },
  {
    badge: 'Tachyon Pipeline',
    title: 'ประมวลผลเร็วระดับไมโครวินาที',
    description: 'ลดคอขวดของข้อมูลด้วยโครงสร้างระบบที่รองรับการสเกล และรักษา latency คงที่',
  },
];

export function LandingPage({ onEnterDashboard }: LandingPageProps) {
  return (
    <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 lg:px-10">
      <header className="flex items-center justify-between border-b border-cyan-glow/10 pb-6">
        <div>
          <p className="text-xs tracking-[0.3em] text-cyan-glow/60 uppercase">Aetherium Syndicate</p>
          <h1 className="text-2xl font-semibold text-white">Inspectra Command Surface</h1>
        </div>
        <button
          onClick={onEnterDashboard}
          className="inline-flex items-center gap-2 rounded-xl border border-cyan-glow/30 bg-cyan-glow/10 px-4 py-2 text-sm font-medium text-cyan-glow hover:bg-cyan-glow/15"
        >
          Access Console <ArrowRight size={16} />
        </button>
      </header>

      <main className="flex-1 py-10">
        <section className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 rounded-full border border-purple-glow/30 bg-purple-glow/10 px-4 py-1 text-xs text-purple-glow"
            >
              <Sparkles size={14} /> Pre-Login Experience v2
            </motion.div>
            <h2 className="mt-5 text-4xl font-semibold leading-tight text-white lg:text-5xl">
              หน้าแรกใหม่ที่ชัดเจนขึ้น
              <span className="text-cyan-glow"> พร้อมเข้าถึง Dashboard ในคลิกเดียว</span>
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/65">
              โครงสร้างหน้าเว็บถูกจัดใหม่ให้ผู้ใช้เห็นภาพรวมของแพลตฟอร์มก่อน login ลดความสับสนในการเริ่มต้นใช้งาน และสร้าง narrative เดียวกันกับหน้า dashboard ภายในระบบ.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <InfoPill icon={<ShieldCheck size={16} />} label="Zero-Trust Entry" value="Enabled" />
              <InfoPill icon={<Cpu size={16} />} label="Tachyon Warmup" value="0.3µs Baseline" />
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="card-glass-purple rounded-3xl p-6"
          >
            <p className="text-xs uppercase tracking-[0.25em] text-purple-glow/60">Entry Roadmap</p>
            <ol className="mt-4 space-y-4 text-sm">
              <li className="rounded-xl border border-white/10 bg-white/5 p-4 text-white/70">1) Discover platform capabilities from this landing page</li>
              <li className="rounded-xl border border-white/10 bg-white/5 p-4 text-white/70">2) Access dashboard and inspect operations by domain tab</li>
              <li className="rounded-xl border border-white/10 bg-white/5 p-4 text-white/70">3) Continue with policy review and automation rollout</li>
            </ol>
          </motion.div>
        </section>

        <section className="mt-12 grid gap-4 md:grid-cols-3">
          {coreFeatures.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </section>
      </main>
    </div>
  );
}

function InfoPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-cyan-glow/20 bg-aether-800/60 px-4 py-3">
      <span className="text-cyan-glow">{icon}</span>
      <div>
        <p className="text-[10px] uppercase tracking-[0.22em] text-white/40">{label}</p>
        <p className="text-sm font-medium text-white">{value}</p>
      </div>
    </div>
  );
}
