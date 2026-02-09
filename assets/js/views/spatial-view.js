export default class SpatialView {
    constructor(state) {
        this.state = state;
    }

    render() {
        const container = document.createElement('div');
        container.className = 'h-full w-full relative overflow-hidden bg-slate-950';

        // Add spatial grid background
        container.style.backgroundImage = 'radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.05), transparent 80%), linear-gradient(rgba(16, 185, 129, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.02) 1px, transparent 1px)';
        container.style.backgroundSize = '100% 100%, 40px 40px, 40px 40px';

        container.innerHTML = `
            <div class="absolute inset-0 flex items-center justify-center">
                <!-- Center Core -->
                <div class="relative size-48 rounded-full border border-emerald-500/30 flex items-center justify-center bg-emerald-500/5 shadow-[0_0_50px_rgba(16,185,129,0.1)] z-10 pulse">
                    <div class="text-center">
                        <div class="text-xs text-emerald-500 font-bold tracking-[0.3em] uppercase mb-1">Nexus</div>
                        <div class="text-3xl font-black text-white">CORE</div>
                    </div>
                    <!-- Orbiting Orbs -->
                    <div class="absolute inset-[-40px] rounded-full border border-dashed border-emerald-500/20 animate-[spin_20s_linear_infinite]"></div>
                </div>

                <!-- Agent Nodes -->
                <div class="absolute top-1/4 left-1/4 z-20">
                    <div class="glass-panel p-4 rounded-xl border-l-4 border-l-emerald-500 w-48 shadow-lg transform -rotate-3 hover:rotate-0 transition-transform cursor-pointer">
                        <div class="text-[10px] text-emerald-500 font-bold uppercase mb-1">Strategy</div>
                        <h4 class="font-bold text-white text-sm">Alpha-1 Node</h4>
                        <div class="flex items-center gap-2 mt-2">
                            <div class="size-2 bg-emerald-500 rounded-full"></div>
                            <span class="text-[10px] text-slate-400">Processing Intent Waves</span>
                        </div>
                    </div>
                </div>

                <div class="absolute bottom-1/3 right-1/4 z-20">
                    <div class="glass-panel p-4 rounded-xl border-l-4 border-l-emerald-500 w-52 shadow-lg transform rotate-2 hover:rotate-0 transition-transform cursor-pointer">
                        <div class="text-[10px] text-emerald-500 font-bold uppercase mb-1">Finance</div>
                        <h4 class="font-bold text-white text-sm">Beta-X Node</h4>
                        <div class="w-full bg-slate-800 h-1 rounded-full mt-3 overflow-hidden">
                            <div class="h-full bg-emerald-500" style="width: 92%"></div>
                        </div>
                    </div>
                </div>

                <div class="absolute top-1/3 right-1/3 z-20">
                    <div class="glass-panel p-4 rounded-xl border-l-4 border-l-emerald-500 w-44 shadow-lg transform -rotate-2 hover:rotate-0 transition-transform cursor-pointer">
                        <div class="text-[10px] text-emerald-500 font-bold uppercase mb-1">Ops</div>
                        <h4 class="font-bold text-white text-sm">Gamma-7 Node</h4>
                        <div class="text-[10px] text-slate-500 mt-2 font-mono">ID: 0x77AF2</div>
                    </div>
                </div>
            </div>

            <!-- UI Overlay -->
            <div class="absolute bottom-10 left-10 space-y-4">
                <div class="glass-panel p-4 rounded-xl">
                    <h3 class="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-2">Spatial Intelligence</h3>
                    <div class="text-2xl font-bold text-white">4,203 <span class="text-xs text-slate-500 font-normal tracking-normal">Nodes Active</span></div>
                </div>
            </div>

            <div class="absolute top-10 right-10">
                <div class="flex gap-2">
                    <button class="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-500 hover:text-white transition-all">Re-Center</button>
                    <button class="bg-slate-900 text-white border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-bold">Filters</button>
                </div>
            </div>
        `;

        return container;
    }
}
