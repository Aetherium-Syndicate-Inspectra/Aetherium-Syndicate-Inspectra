export default class AnalyticsView {
    constructor(state) {
        this.state = state;
    }

    render() {
        const container = document.createElement('div');
        container.className = 'p-8 max-w-7xl mx-auto space-y-8';

        const riskRanking = this.state.getDirectiveRiskRanking();
        const dependencyHeatmap = this.state.getDependencyBottleneckHeatmap();
        const policyImpact = this.state.getPolicyOptimizationImpact();
        const overrides = this.state.getHumanOverrideFrequencyByMonth();

        container.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <div class="size-12 rounded-xl bg-pink-500/20 flex items-center justify-center text-pink-500">
                        <span class="material-symbols-outlined text-3xl">monitoring</span>
                    </div>
                    <div>
                        <h2 class="text-2xl font-bold">Advanced Analytics</h2>
                        <p class="text-sm text-slate-400">Unified feature insights for risk, dependency bottlenecks, and policy tuning.</p>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button class="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors">Export CSV</button>
                    <button class="bg-pink-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-pink-500/20">Generate Report</button>
                </div>
            </div>

            <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div class="xl:col-span-2 card p-6">
                    <h3 class="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Directive Risk Score Ranking</h3>
                    <div class="space-y-3">
                        ${riskRanking.map((item, index) => `
                            <div class="bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
                                <div>
                                    <div class="text-xs text-slate-500 uppercase tracking-widest">Priority ${index + 1}</div>
                                    <div class="text-sm font-semibold text-white">${item.directiveId}</div>
                                </div>
                                <div class="text-xs text-slate-400">Slippage: ${(item.deadlineSlippage * 100).toFixed(0)}%</div>
                                <div class="text-xs text-slate-400">Conflict: ${(item.dissentRate * 100).toFixed(0)}%</div>
                                <div class="text-base font-black ${item.riskScore >= 0.4 ? 'text-rose-400' : 'text-emerald-400'}">${item.riskScore}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="card p-6">
                    <h3 class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Unified Feature Store</h3>
                    <div class="space-y-3 text-sm">
                        <div class="flex justify-between"><span class="text-slate-400">Metrics</span><span class="font-bold text-white">${this.state.featureStore.metrics.length}</span></div>
                        <div class="flex justify-between"><span class="text-slate-400">Decisions</span><span class="font-bold text-white">${this.state.featureStore.decisions.length}</span></div>
                        <div class="flex justify-between"><span class="text-slate-400">Incidents</span><span class="font-bold text-white">${this.state.featureStore.incidents.length}</span></div>
                    </div>
                    <p class="text-[11px] text-slate-500 mt-4">Canonical key de-dup: <code>(entity_id, event_type, event_time, source)</code></p>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="card p-6">
                    <h3 class="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Cross-team Chain Bottleneck Heatmap</h3>
                    <div class="space-y-2">
                        ${dependencyHeatmap.map((item) => `
                            <div class="flex items-center gap-3">
                                <div class="text-xs text-slate-400 min-w-[140px]">${item.from} → ${item.to}</div>
                                <div class="h-2 flex-1 bg-slate-800 rounded-full overflow-hidden">
                                    <div class="h-full ${item.level === 'critical' ? 'bg-rose-500' : item.level === 'elevated' ? 'bg-amber-500' : 'bg-emerald-500'}" style="width:${Math.min(item.chainPressure, 100)}%"></div>
                                </div>
                                <div class="text-xs font-bold text-white min-w-[42px] text-right">${item.chainPressure}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="card p-6">
                    <h3 class="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Scenario Counterfactual Outcomes</h3>
                    <div class="space-y-3">
                        ${policyImpact.map((item) => `
                            <div class="bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2 flex items-center justify-between">
                                <div>
                                    <div class="text-[10px] text-slate-500 uppercase">${item.id}</div>
                                    <div class="text-sm text-white font-semibold">${item.strategy}</div>
                                </div>
                                <div class="text-xs text-emerald-400 font-bold">SLA Breach -${item.slaReductionPct}%</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <div class="card p-6">
                <h3 class="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Human Override Frequency (Monthly AI Council Audit)</h3>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
                    ${overrides.map((item) => `
                        <div class="bg-slate-900/80 border border-slate-800 rounded-lg px-4 py-3">
                            <div class="text-xs text-slate-500">${item.month}</div>
                            <div class="text-2xl font-black text-white">${item.count}</div>
                            <div class="text-[10px] uppercase tracking-widest text-slate-400">overrides</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        return container;
    }
}
