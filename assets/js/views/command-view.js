export default class CommandView {
    constructor(state) {
        this.state = state;
    }

    render() {
        const container = document.createElement('div');
        container.className = 'h-full flex flex-col bg-black font-mono text-sm overflow-hidden';

        container.innerHTML = `
            <!-- Terminal Header -->
            <div class="h-10 bg-amber-500 text-black flex items-center px-4 justify-between shrink-0 font-bold">
                <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-base">terminal</span>
                    <span>AETHERIUM_GENESIS_ROOT_SHELL</span>
                </div>
                <div class="flex gap-4 text-xs">
                    <span>STABILITY: OPTIMAL</span>
                    <span>CLEARANCE: LEVEL_1</span>
                </div>
            </div>

            <!-- Main Feed -->
            <div class="flex-1 overflow-y-auto p-4 space-y-2 text-amber-500/80 custom-scrollbar" id="command-feed">
                <div>[14:02:01] <span class="text-amber-500">&lt;SYS&gt;</span> Initializing quantum bridge...</div>
                <div>[14:02:05] <span class="text-amber-500">&lt;SYS&gt;</span> Connection established with Alpha-1.</div>
                <div>[14:02:12] <span class="text-emerald-500">&lt;OK&gt;</span> Neural synchronization at 98.4%.</div>
                <div class="bg-amber-500/10 -mx-4 px-4 py-1">[14:03:44] <span class="text-amber-500 font-bold">&lt;ACT&gt;</span> Processing Directive DIR-012: Market Pulse Q4...</div>
                <div>[14:03:50] <span class="text-amber-500">&lt;SYS&gt;</span> Fetching global sentiment data...</div>
                <div>[14:04:12] <span class="text-rose-500">&lt;WRN&gt;</span> Minor latency spike detected in Singapore Node.</div>
                <div>[14:04:15] <span class="text-amber-500">&lt;SYS&gt;</span> Rerouting via Tokyo Cluster...</div>
                <div>[14:05:00] <span class="text-emerald-500">&lt;OK&gt;</span> Path stabilized. 12ms latency achieved.</div>
                <div class="animate-pulse">[14:06:22] <span class="text-white">&lt;IDLE&gt;</span> Waiting for executive command... _</div>
            </div>

            <!-- Metrics Bar -->
            <div class="grid grid-cols-4 gap-4 p-4 border-t border-amber-500/20 bg-amber-500/5">
                <div class="space-y-1">
                    <div class="text-[10px] uppercase text-amber-500/50">CPU_LOAD</div>
                    <div class="text-lg text-amber-500 font-bold">42.8%</div>
                </div>
                <div class="space-y-1">
                    <div class="text-[10px] uppercase text-amber-500/50">MEM_ALLOC</div>
                    <div class="text-lg text-amber-500 font-bold">14.2TB</div>
                </div>
                <div class="space-y-1">
                    <div class="text-[10px] uppercase text-amber-500/50">NET_TRF</div>
                    <div class="text-lg text-amber-500 font-bold">845GB/s</div>
                </div>
                <div class="space-y-1">
                    <div class="text-[10px] uppercase text-amber-500/50">THREADS</div>
                    <div class="text-lg text-amber-500 font-bold">14.8M</div>
                </div>
            </div>

            <!-- Input Bar -->
            <div class="h-12 border-t border-amber-500/20 bg-black flex items-center px-4 shrink-0">
                <span class="text-amber-500 mr-2">➜</span>
                <input type="text" placeholder="Enter system command..." class="bg-transparent border-none outline-none text-amber-500 w-full placeholder:text-amber-500/20 focus:ring-0">
            </div>
        `;

        return container;
    }
}
