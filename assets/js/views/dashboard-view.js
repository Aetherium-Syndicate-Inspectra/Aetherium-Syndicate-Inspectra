export default class DashboardView {
    constructor(state) {
        this.state = state;
        this.container = null;
    }

    onStateChange(event, data) {
        if (!this.container) return;

        if (event === 'agentUpdated' || event === 'metricsUpdated') {
            const grid = this.container.querySelector('#agent-grid');
            if (grid) grid.innerHTML = this.renderAgents();
        }

        if (event === 'directiveAdded' || event === 'directiveUpdated') {
            this.updateTasks();
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

        this.container.innerHTML = `
            <section>
                <div class="flex items-center justify-between mb-6">
                    <div>
                        <h2 class="text-2xl font-bold">CEO AI Council</h2>
                        <p class="text-sm text-slate-400">การติดตามสถานะคณะกรรมการ AI ระดับบริหารแบบเรียลไทม์</p>
                    </div>
                    <span class="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest font-bold border border-primary/30">Live Status</span>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6" id="agent-grid">
                    ${this.renderAgents()}
                </div>
            </section>

            <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <section class="xl:col-span-2">
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

                <div class="space-y-8">
                    <section class="card">
                        <h3 class="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">Recent AI Meetings</h3>
                        <div class="divide-y divide-slate-800">
                            ${this.renderMeetings()}
                        </div>
                    </section>

                    <section class="card bg-gradient-to-br from-primary/10 to-transparent">
                        <h3 class="text-sm font-bold uppercase tracking-widest text-slate-500 mb-2">Company Structure</h3>
                        <div class="text-3xl font-black text-white">1,024</div>
                        <div class="text-xs text-slate-400 mt-1">Active Autonomous Agents</div>
                        <div class="mt-4 p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                            <div class="text-[10px] text-primary font-bold uppercase mb-1">Node Distribution</div>
                            <div class="flex h-1.5 rounded-full overflow-hidden gap-0.5">
                                <div class="bg-primary w-1/4"></div>
                                <div class="bg-emerald-500 w-1/3"></div>
                                <div class="bg-amber-500 w-1/6"></div>
                                <div class="bg-slate-700 w-1/4"></div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        `;

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
                <div class="mt-4 space-y-2 relative z-10">
                    <div class="flex justify-between text-[10px] text-slate-500">
                        <span class="truncate pr-4">${agent.task}</span>
                        <span>${agent.cpu.toFixed(0)}%</span>
                    </div>
                    <div class="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div class="h-full bg-primary shadow-[0_0_8px_rgba(19,55,236,0.6)] transition-all duration-500" style="width: ${agent.cpu}%"></div>
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
                <div class="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/50">
                    <div class="flex items-center gap-1 text-[9px] text-slate-500">
                        <span class="material-symbols-outlined text-[12px]">schedule</span>
                        <span>${task.time}</span>
                    </div>
                    <div class="size-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary font-bold border border-primary/20">
                        ${task.author}
                    </div>
                </div>
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
                <div class="flex -space-x-2">
                    ${m.participants.map(p => `<div class="size-5 rounded-full bg-slate-800 border border-slate-900 flex items-center justify-center text-[8px] font-bold">${p}</div>`).join('')}
                </div>
            </div>
        `).join('');
    }
}
