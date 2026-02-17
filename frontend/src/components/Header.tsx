interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = ['overview', 'agents', 'tachyon', 'resonance', 'departments', 'policies'] as const;

export function Header({ activeTab, onTabChange }: Props) {
  return (
    <header className="sticky top-0 z-20 border-b border-cyan-400/20 bg-slate-950/90 px-4 py-3 backdrop-blur">
      <div className="mb-3 text-sm font-semibold text-cyan-300">SpectraCall / Hybrid Bridge</div>
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => onTabChange(t)}
            className={`rounded px-3 py-1 text-xs uppercase ${activeTab === t ? 'bg-cyan-500/20 text-cyan-200' : 'bg-slate-800 text-slate-300'}`}
          >
            {t}
          </button>
        ))}
      </div>
    </header>
  );
}
