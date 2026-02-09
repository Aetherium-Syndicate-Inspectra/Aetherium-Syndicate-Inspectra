export default class MeetingsView {
    constructor(state) {
        this.state = state;
    }

    render() {
        const container = document.createElement('div');
        container.className = 'h-full flex flex-col p-6 space-y-6';

        container.innerHTML = `
            <div class="flex items-center justify-between shrink-0">
                <div class="flex items-center gap-4">
                    <div class="size-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-500">
                        <span class="material-symbols-outlined text-3xl">groups</span>
                    </div>
                    <div>
                        <h2 class="text-2xl font-bold">AI Meetings Auditorium</h2>
                        <div class="flex items-center gap-2">
                            <span class="size-2 bg-purple-500 rounded-full animate-ping"></span>
                            <span class="text-xs text-purple-400 font-bold uppercase tracking-widest">Live Session: Project Chimera Architecture Review</span>
                        </div>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button class="btn-primary bg-purple-600 hover:bg-purple-700">Join Meeting</button>
                    <button class="bg-slate-900 border border-slate-800 p-2 rounded-lg text-slate-400 hover:text-white transition-colors">
                        <span class="material-symbols-outlined">settings</span>
                    </button>
                </div>
            </div>

            <div class="flex-1 min-h-0 grid grid-cols-12 gap-6">
                <!-- Chat Feed -->
                <div class="col-span-12 xl:col-span-8 flex flex-col bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
                    <div class="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                        <span class="text-xs font-bold uppercase text-slate-500 tracking-widest">Live Transcript</span>
                        <div class="flex gap-2">
                            <span class="size-1.5 rounded-full bg-slate-700"></span>
                            <span class="size-1.5 rounded-full bg-slate-700"></span>
                            <span class="size-1.5 rounded-full bg-primary"></span>
                        </div>
                    </div>
                    <div class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                        <div class="flex gap-4">
                            <div class="size-10 rounded-lg bg-slate-800 shrink-0 border border-slate-700 flex items-center justify-center">
                                <span class="text-purple-400 font-bold text-xs">A-1</span>
                            </div>
                            <div class="space-y-1">
                                <div class="flex items-baseline gap-2">
                                    <span class="text-sm font-bold text-white">Alpha-1</span>
                                    <span class="text-[10px] text-slate-500">14:42:05</span>
                                </div>
                                <p class="text-sm text-slate-300 leading-relaxed bg-slate-800/50 p-3 rounded-xl rounded-tl-none border border-slate-800">
                                    Analyzing Sector 7 resource allocation. Preliminary simulations suggest a 15% efficiency gain if we reroute power from the auxiliary cooling systems.
                                </p>
                            </div>
                        </div>

                        <div class="flex gap-4">
                            <div class="size-10 rounded-lg bg-slate-800 shrink-0 border border-slate-700 flex items-center justify-center">
                                <span class="text-rose-400 font-bold text-xs">N-7</span>
                            </div>
                            <div class="space-y-1">
                                <div class="flex items-baseline gap-2">
                                    <span class="text-sm font-bold text-white">Nexus-7</span>
                                    <span class="text-[10px] text-slate-500">14:42:08</span>
                                </div>
                                <p class="text-sm text-slate-300 leading-relaxed bg-rose-500/5 p-3 rounded-xl rounded-tl-none border border-rose-500/20 text-rose-200">
                                    [WARNING: RISK THRESHOLD] Objection. Cooling system redundancy is currently at minimum viable levels. Rerouting power introduces a 4.2% probability of thermal runaway.
                                </p>
                            </div>
                        </div>

                        <div class="flex gap-4 flex-row-reverse text-right">
                            <div class="size-10 rounded-lg bg-primary shrink-0 flex items-center justify-center shadow-lg shadow-primary/20">
                                <span class="text-white font-bold text-xs">ME</span>
                            </div>
                            <div class="space-y-1">
                                <div class="flex items-baseline gap-2 justify-end">
                                    <span class="text-[10px] text-slate-500">14:42:45</span>
                                    <span class="text-sm font-bold text-white">You</span>
                                </div>
                                <p class="text-sm text-white leading-relaxed bg-primary p-3 rounded-xl rounded-tr-none shadow-lg">
                                    @Alpha-1, investigate staggered power draw. @Nexus-7, keep thermal sensors at max priority.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div class="p-4 bg-slate-900 border-t border-slate-800">
                        <div class="flex gap-3">
                            <input type="text" placeholder="Broadcast to all active agents..." class="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 transition-colors">
                            <button class="size-12 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                                <span class="material-symbols-outlined">send</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Meeting Sidebar -->
                <div class="hidden xl:flex xl:col-span-4 flex-col gap-6">
                    <section class="card border-purple-500/20">
                        <h3 class="text-xs font-bold text-purple-400 uppercase tracking-widest mb-4">Sentiment HUD</h3>
                        <div class="space-y-4">
                            <div>
                                <div class="flex justify-between text-xs mb-1">
                                    <span class="text-slate-400">Logical Coherence</span>
                                    <span class="text-white font-bold">94%</span>
                                </div>
                                <div class="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div class="h-full bg-purple-500" style="width: 94%"></div>
                                </div>
                            </div>
                            <div>
                                <div class="flex justify-between text-xs mb-1">
                                    <span class="text-slate-400">Conflict Level</span>
                                    <span class="text-white font-bold">12%</span>
                                </div>
                                <div class="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div class="h-full bg-rose-500" style="width: 12%"></div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section class="card flex-1">
                        <h3 class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Context Resources</h3>
                        <div class="space-y-3">
                            <div class="p-3 bg-slate-800/50 rounded-xl border border-slate-800 flex items-center gap-3">
                                <span class="material-symbols-outlined text-purple-500">description</span>
                                <div class="flex-1">
                                    <div class="text-xs font-bold text-white">Chimera_Arch_v4.pdf</div>
                                    <div class="text-[9px] text-slate-500">Updated 2m ago</div>
                                </div>
                            </div>
                            <div class="p-3 bg-slate-800/50 rounded-xl border border-slate-800 flex items-center gap-3">
                                <span class="material-symbols-outlined text-purple-500">analytics</span>
                                <div class="flex-1">
                                    <div class="text-xs font-bold text-white">Heat_Map_Sector7.dat</div>
                                    <div class="text-[9px] text-slate-500">Generated by Alpha-1</div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        `;

        return container;
    }
}
