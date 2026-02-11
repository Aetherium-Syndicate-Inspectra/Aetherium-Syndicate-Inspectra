const VIRTUAL_ROW_HEIGHT = 72;
const VIRTUAL_VISIBLE_ROWS = 40;

export default class DashboardView {
    constructor(state) {
        this.state = state;
        this.container = null;
    }

    onStateChange(event) {
        if (!this.container) return;

        if (event === 'agentUpdated' || event === 'metricsUpdated') {
            const grid = this.container.querySelector('#agent-grid');
            if (grid) grid.innerHTML = this.renderAgents();
        }

        if (event === 'directiveAdded' || event === 'directiveUpdated') {
            this.updateTasks();
        }

        if (event === 'bidLedgerUpdated') {
            const bidRoot = this.container.querySelector('#bid-ledger-root');
            if (bidRoot) {
                bidRoot.innerHTML = this.renderBidLedger();
                this.attachVirtualScrollHandlers();
            }
        }
    }

    updateTasks() {
        const pending = this.container.querySelector('#pending-tasks');
        const meeting = this.container.querySelector('#meeting-tasks');
        const completed = this.container.querySelector('#completed-tasks');

        if (pending) pending.innerHTML = this.renderTasks('pending');
        if (meeting) meeting.innerHTML = this.renderTasks('meeting');
        if (completed) completed.innerHTML = this.renderTasks('completed');
    }

    render() {
        this.container = document.createElement('div');
        this.container.className = 'p-6 lg:p-10 max-w-[1600px] mx-auto space-y-8';
        this.container.id = 'dashboard-root';

        this.container.innerHTML = `
            <section class="dashboard-metrics">
                <div class="flex items-center justify-between mb-6">
                    <div>
                        <h2 class="text-2xl font-bold">CEO AI Council</h2>
                        <p class="text-sm text-slate-400">การติดตามสถานะคณะกรรมการ AI ระดับบริหารแบบเรียลไทม์</p>
                    </div>
                    <span class="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest font-bold border border-primary/30">Live Status</span>
                </div>
                <div class="dashboard-grid grid grid-cols-1 md:grid-cols-3 gap-6" id="agent-grid">
                    ${this.renderAgents()}
                </div>
            </section>

            <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <section class="xl:col-span-2 dashboard-kanban">
                    <div class="flex items-center justify-between mb-6">
                        <h2 class="text-xl font-bold">Active Directives (กระดานคำสั่ง)</h2>
                        <button class="text-xs text-primary hover:underline">View All</button>
                    </div>
                    <div class="kanban-board">
                        <div class="kanban-col">
                            <h4>Pending Review</h4>
                            <div id="pending-tasks">${this.renderTasks('pending')}</div>
                        </div>
                        <div class="kanban-col">
                            <h4>AI Meeting</h4>
                            <div id="meeting-tasks">${this.renderTasks('meeting')}</div>
                        </div>
                        <div class="kanban-col">
                            <h4>Executed</h4>
                            <div id="completed-tasks">${this.renderTasks('completed')}</div>
                        </div>
                    </div>
                </section>

                <div class="space-y-8 dashboard-side-stack">
                    <section class="card" id="bid-ledger-root">
                        ${this.renderBidLedger()}
                    </section>

                    <section class="card">
                        <h3 class="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">Recent AI Meetings</h3>
                        <div class="divide-y divide-slate-800">
                            ${this.renderMeetings()}
                        </div>
                    </section>
                </div>
            </div>
        `;

        this.attachVirtualScrollHandlers();
        return this.container;
    }

    renderAgents() {
        return this.state.agents.map(agent => `
            <div class="card group hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden">
                <div class="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                <div class="flex items-center gap-4 relative z-10">
                    <div class="size-14 rounded-xl bg-slate-800 border-2 border-slate-700 overflow-hidden flex items-center justify-center">
                        <span class="material-symbols-outlined text-3xl text-primary opacity-50">smart_toy</span>
                    </div>
                    <div class="flex-1">
                        <div class="flex justify-between">
                            <h4 class="font-bold text-white">${agent.name}</h4>
                            <span class="text-[10px] font-mono ${agent.status === 'active' ? 'text-emerald-400' : 'text-amber-400' }">${agent.status.toUpperCase()}</span>
                        </div>
                        <p class="text-xs text-slate-400">${agent.role}</p>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderTasks(status) {
        const tasks = this.state.directives.filter(d => d.status === status);
        if (tasks.length === 0) return '<div class="text-[10px] text-slate-600 italic text-center py-4">No active directives</div>';

        return tasks.map(task => `
            <div class="task-card mb-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div class="flex justify-between mb-2">
                    <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">${task.department}</span>
                    <span class="material-symbols-outlined text-xs text-slate-600">more_horiz</span>
                </div>
                <h5 class="text-sm font-bold text-white mb-1">${task.title}</h5>
            </div>
        `).join('');
    }

    renderMeetings() {
        return this.state.meetings.map(m => `
            <div class="py-3 group cursor-pointer">
                <div class="flex justify-between items-start mb-1">
                    <h4 class="text-sm font-medium text-slate-200 group-hover:text-primary transition-colors">${m.title}</h4>
                    <span class="text-[10px] text-slate-500 font-mono">${m.duration}</span>
                </div>
            </div>
        `).join('');
    }

    renderBidLedger() {
        const rows = this.state.bidLedger;
        const useVirtual = rows.length > 10000;
        const title = `Bid Ledger (${rows.length.toLocaleString()})`;

        if (!useVirtual) {
            return `
                <h3 class="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">${title}</h3>
                <div class="space-y-2 max-h-80 overflow-auto">
                    ${rows.map((row) => this.renderBidLedgerRow(row)).join('')}
                </div>
            `;
        }

        const windowedRows = rows.slice(0, VIRTUAL_VISIBLE_ROWS);
        return `
            <h3 class="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">${title} (Virtualized)</h3>
            <div class="text-[10px] text-slate-500 mb-3">Realtime WebSocket/SSE stream with virtualized rendering enabled for >10k rows.</div>
            <div id="bid-ledger-virtual-scroll" class="max-h-80 overflow-auto rounded border border-slate-800" data-total="${rows.length}">
                <div id="bid-ledger-virtual-spacer" style="height:${rows.length * VIRTUAL_ROW_HEIGHT}px; position:relative;">
                    <div id="bid-ledger-virtual-window" style="position:absolute; top:0; left:0; right:0;">
                        ${windowedRows.map((row) => this.renderBidLedgerRow(row)).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    attachVirtualScrollHandlers() {
        const scroller = this.container?.querySelector('#bid-ledger-virtual-scroll');
        const windowEl = this.container?.querySelector('#bid-ledger-virtual-window');
        if (!scroller || !windowEl) return;

        const renderWindow = () => {
            const start = Math.floor(scroller.scrollTop / VIRTUAL_ROW_HEIGHT);
            const rows = this.state.bidLedger.slice(start, start + VIRTUAL_VISIBLE_ROWS);
            windowEl.style.transform = `translateY(${start * VIRTUAL_ROW_HEIGHT}px)`;
            windowEl.innerHTML = rows.map((row) => this.renderBidLedgerRow(row)).join('');
        };

        renderWindow();
        scroller.onscroll = renderWindow;
    }

    renderBidLedgerRow(row) {
        const stateColor = row.payload.state === 'settled' ? 'text-emerald-400' : row.payload.state === 'countering' ? 'text-amber-400' : 'text-sky-400';
        return `
            <article class="p-2 border border-slate-800 rounded bg-slate-900/40 mb-2" style="height:${VIRTUAL_ROW_HEIGHT - 8}px;">
                <div class="flex items-center justify-between">
                    <p class="text-xs font-semibold text-slate-200">${row.payload.bid_id}</p>
                    <span class="text-[10px] ${stateColor} uppercase">${row.payload.state}</span>
                </div>
                <div class="text-[11px] text-slate-400">${row.event_type} · ${row.payload.symbol} · ${row.payload.amount?.toLocaleString?.() ?? '-'}</div>
                <div class="text-[10px] text-slate-500">quality c:${row.quality.confidence} f:${row.quality.freshness} cp:${row.quality.completeness}</div>
            </article>
        `;
    }
}
