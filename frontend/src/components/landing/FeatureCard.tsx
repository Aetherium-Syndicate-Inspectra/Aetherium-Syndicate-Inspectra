import { motion } from 'framer-motion';

interface FeatureCardProps {
  title: string;
  description: string;
  badge: string;
}

export function FeatureCard({ title, description, badge }: FeatureCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="card-glass rounded-2xl p-5"
    >
      <div className="text-[10px] tracking-[0.2em] text-cyan-glow/60 uppercase">{badge}</div>
      <h3 className="mt-3 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-white/60 leading-relaxed">{description}</p>
    </motion.article>
  );
}
