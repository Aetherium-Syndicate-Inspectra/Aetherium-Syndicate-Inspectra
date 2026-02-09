export default class StructureView {
    constructor(state) {
        this.state = state;
    }

    render() {
        const container = document.createElement('div');
        container.className = 'p-8 max-w-6xl mx-auto space-y-8';

        container.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="size-12 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-500">
                    <span class="material-symbols-outlined text-3xl">account_tree</span>
                </div>
                <div>
                    <h2 class="text-2xl font-bold">Company Structure Explorer</h2>
                    <p class="text-sm text-slate-400">Interactive mapping of the Aetherium Genesis node hierarchy.</p>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                <!-- Org Chart Placeholder -->
                <div class="md:col-span-3 card h-[500px] relative overflow-hidden bg-slate-900 flex items-center justify-center">
                    <div class="absolute inset-0 opacity-10" style="background-image: radial-gradient(circle at 2px 2px, cyan 1px, transparent 0); background-size: 24px 24px;"></div>

                    <div class="relative flex flex-col items-center gap-12">
                        <!-- Level 1 -->
                        <div class="p-4 bg-cyan-500/10 border border-cyan-500 rounded-xl text-center w-48 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                            <div class="text-[10px] text-cyan-500 font-bold uppercase mb-1">Root Executive</div>
                            <div class="font-bold text-white">CEO COUNCIL</div>
                        </div>

                        <!-- Connectors -->
                        <div class="h-12 w-px bg-cyan-500/30"></div>

                        <!-- Level 2 -->
                        <div class="flex gap-8">
                            <div class="p-3 bg-slate-800 border border-slate-700 rounded-lg text-center w-32">
                                <div class="text-[9px] text-slate-500 font-bold uppercase mb-1">Strategy</div>
                                <div class="text-xs font-bold text-white uppercase">Dept_A</div>
                            </div>
                            <div class="p-3 bg-slate-800 border border-slate-700 rounded-lg text-center w-32">
                                <div class="text-[9px] text-slate-500 font-bold uppercase mb-1">Operations</div>
                                <div class="text-xs font-bold text-white uppercase">Dept_B</div>
                            </div>
                            <div class="p-3 bg-slate-800 border border-slate-700 rounded-lg text-center w-32">
                                <div class="text-[9px] text-slate-500 font-bold uppercase mb-1">Finance</div>
                                <div class="text-xs font-bold text-white uppercase">Dept_C</div>
                            </div>
                        </div>
                    </div>

                    <div class="absolute bottom-4 right-4 flex gap-2">
                        <button class="bg-slate-800 p-2 rounded-lg text-white hover:bg-slate-700"><span class="material-symbols-outlined">zoom_in</span></button>
                        <button class="bg-slate-800 p-2 rounded-lg text-white hover:bg-slate-700"><span class="material-symbols-outlined">zoom_out</span></button>
                        <button class="bg-slate-800 p-2 rounded-lg text-white hover:bg-slate-700"><span class="material-symbols-outlined">fit_screen</span></button>
                    </div>
                </div>

                <!-- Node Details -->
                <div class="space-y-6">
                    <div class="card">
                        <h3 class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Cluster Health</h3>
                        <div class="space-y-4">
                            <div>
                                <div class="flex justify-between text-xs mb-1">
                                    <span class="text-slate-400">Total Nodes</span>
                                    <span class="text-white">1,024</span>
                                </div>
                                <div class="h-1 bg-slate-800 rounded-full overflow-hidden">
                                    <div class="h-full bg-cyan-500" style="width: 100%"></div>
                                </div>
                            </div>
                            <div>
                                <div class="flex justify-between text-xs mb-1">
                                    <span class="text-slate-400">Active Links</span>
                                    <span class="text-white">8,442</span>
                                </div>
                                <div class="h-1 bg-slate-800 rounded-full overflow-hidden">
                                    <div class="h-full bg-cyan-500/50" style="width: 82%"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="card bg-cyan-500/5 border-cyan-500/20">
                        <h3 class="text-xs font-bold text-cyan-500 uppercase tracking-widest mb-2">Search Nodes</h3>
                        <input type="text" placeholder="Agent ID or Keyword..." class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none focus:border-cyan-500">
                    </div>

                    <div class="text-center p-4">
                        <button class="text-cyan-500 text-xs font-bold hover:underline">Download Hierarchy PDF</button>
                    </div>
                </div>
            </div>
        `;

        return container;
    }
}
