import { FreezeLightClient } from '../utils/freeze-light-client.js';

export default class CommandView {
    constructor(state, deps = {}) {
        this.state = state;
        this.apiClient = deps.apiClient;
        this.freezeClient = this.apiClient ? new FreezeLightClient(this.apiClient) : null;
        this.editMode = 'draw';
        this.frozenStructures = [];
    }

    render() {
        const container = document.createElement('div');
        container.className = 'h-full flex flex-col bg-black font-mono text-sm overflow-hidden';

        container.innerHTML = `
            <div class="h-10 bg-amber-500 text-black flex items-center px-4 justify-between shrink-0 font-bold">
                <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-base">terminal</span>
                    <span>AETHERIUM_GENESIS_ROOT_SHELL</span>
                </div>
                <div class="flex gap-4 text-xs">
                    <span>FREEZE-LIGHT: ENABLED</span>
                    <span>CLEARANCE: LEVEL_1</span>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border-b border-amber-500/20 bg-amber-500/5" id="freeze-panel">
                <div class="space-y-3">
                    <h3 class="text-amber-400 font-bold uppercase text-xs">Freeze Light Controls</h3>
                    <div class="flex flex-wrap gap-2">
                        <button data-freeze-action="freeze" class="px-3 py-1.5 bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 rounded">❄️ Freeze Snapshot</button>
                        <button data-freeze-action="save-png" class="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 rounded">💾 Save PNG</button>
                        <button data-freeze-action="save-pdf" class="px-3 py-1.5 bg-violet-500/20 text-violet-300 border border-violet-400/40 rounded">📄 Save PDF</button>
                    </div>
                    <div class="flex flex-wrap gap-2">
                        <button data-freeze-mode="erase" class="px-3 py-1.5 bg-rose-500/20 text-rose-300 border border-rose-400/40 rounded">🗑️ Erase Mode</button>
                        <button data-freeze-mode="draw" class="px-3 py-1.5 bg-amber-500/20 text-amber-200 border border-amber-400/40 rounded">🖌️ Draw Mode</button>
                        <button data-freeze-action="refresh" class="px-3 py-1.5 bg-slate-700 text-slate-100 border border-slate-500 rounded">↻ Refresh List</button>
                    </div>
                    <div class="text-[11px] text-amber-500/70" id="freeze-status">Ready. Canonical quality rubric: confidence/freshness/completeness.</div>
                </div>
                <div class="space-y-2">
                    <h3 class="text-amber-400 font-bold uppercase text-xs">Frozen Structures</h3>
                    <div class="max-h-36 overflow-y-auto border border-amber-500/20 rounded p-2 space-y-1" id="freeze-list"></div>
                </div>
            </div>

            <div class="flex-1 overflow-y-auto p-4 space-y-2 text-amber-500/80 custom-scrollbar" id="command-feed">
                <div>[14:02:01] <span class="text-amber-500">&lt;SYS&gt;</span> Initializing quantum bridge...</div>
                <div>[14:02:05] <span class="text-amber-500">&lt;SYS&gt;</span> Connection established with Alpha-1.</div>
                <div>[14:02:12] <span class="text-emerald-500">&lt;OK&gt;</span> Neural synchronization at 98.4%.</div>
                <div class="bg-amber-500/10 -mx-4 px-4 py-1">[14:03:44] <span class="text-amber-500 font-bold">&lt;ACT&gt;</span> Freeze pipeline online (dedup + canonical keys).</div>
            </div>

            <div class="h-12 border-t border-amber-500/20 bg-black flex items-center px-4 shrink-0">
                <span class="text-amber-500 mr-2">➜</span>
                <input type="text" placeholder="Enter system command..." class="bg-transparent border-none outline-none text-amber-500 w-full placeholder:text-amber-500/20 focus:ring-0">
            </div>
        `;

        this.bindEvents(container);
        this.renderFreezeList(container);

        return container;
    }

    bindEvents(container) {
        container.querySelectorAll('[data-freeze-mode]').forEach((button) => {
            button.addEventListener('click', () => {
                this.editMode = button.dataset.freezeMode;
                this.setStatus(container, `Edit mode switched to ${this.editMode.toUpperCase()}.`);
            });
        });

        container.querySelectorAll('[data-freeze-action]').forEach((button) => {
            button.addEventListener('click', async () => {
                const action = button.dataset.freezeAction;
                if (action === 'freeze') {
                    this.setStatus(container, `Structure crystallized. Active edit mode: ${this.editMode}.`);
                    return;
                }

                if (action === 'refresh') {
                    await this.pullRemoteList(container);
                    return;
                }

                if (action === 'save-png' || action === 'save-pdf') {
                    const format = action === 'save-png' ? 'png' : 'pdf';
                    await this.saveStructure(container, format);
                }
            });
        });
    }

    async saveStructure(container, format) {
        const structure = {
            mode: this.editMode,
            positions: [[0, 0, 0], [1, 1, 1]],
            colors: this.editMode === 'erase' ? [[1, 0, 0]] : [[0, 1, 1]],
            intensities: [1, 0.8]
        };

        if (!this.freezeClient) {
            this.setStatus(container, `Saved (${format.toUpperCase()}) locally only (API unavailable).`);
            return;
        }

        try {
            const result = await this.freezeClient.save({
                structure,
                fileFormat: format,
                fileName: `light-${Date.now()}`
            });
            this.frozenStructures = [result.freeze, ...this.frozenStructures];
            this.renderFreezeList(container);
            this.setStatus(container, `Saved ${format.toUpperCase()} with canonical key ${result.freeze.canonical_key}.`);
        } catch (error) {
            this.setStatus(container, `Save failed: ${error.message}`);
        }
    }

    async pullRemoteList(container) {
        if (!this.freezeClient) return;
        try {
            const response = await this.freezeClient.list();
            this.frozenStructures = Array.isArray(response.items) ? response.items : [];
            this.renderFreezeList(container);
            this.setStatus(container, `Loaded ${this.frozenStructures.length} frozen structures.`);
        } catch (error) {
            this.setStatus(container, `List failed: ${error.message}`);
        }
    }

    renderFreezeList(container) {
        const listNode = container.querySelector('#freeze-list');
        if (!listNode) return;

        if (!this.frozenStructures.length) {
            listNode.innerHTML = '<div class="text-xs text-slate-400">No saved structures yet.</div>';
            return;
        }

        listNode.innerHTML = this.frozenStructures.slice(0, 10).map((item) => `
            <div class="text-xs flex justify-between gap-2 border-b border-amber-500/10 pb-1">
                <span class="text-amber-200">${item.file_name}.${item.file_format}</span>
                <span class="text-slate-400">${new Date(item.created_at).toLocaleTimeString()}</span>
            </div>
        `).join('');
    }

    setStatus(container, text) {
        const node = container.querySelector('#freeze-status');
        if (node) node.textContent = text;
    }
}
