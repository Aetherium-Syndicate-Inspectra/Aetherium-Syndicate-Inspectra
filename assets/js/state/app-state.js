export class AppState {
    constructor() {
        this.role = 'executive';
        this.theme = 'dark';
        this.directives = [
            { id: 'DIR-012', title: 'Market Pulse Q4', status: 'pending', department: 'Marketing', time: '2h ago', author: 'A' },
            { id: 'DIR-019', title: 'Budget Forecasting', status: 'meeting', department: 'Finance', time: '4h ago', author: 'B' },
            { id: 'DIR-007', title: 'Hiring Strategy', status: 'completed', department: 'HR', time: '1d ago', author: 'HR' }
        ];
        this.agents = [
            { id: 'alpha-1', name: 'Alpha-1', role: 'Chief Strategy Officer', status: 'active', cpu: 75, memory: 60, task: 'Processing M&A Data' },
            { id: 'beta-x', name: 'Beta-X', role: 'Chief Financial Officer', status: 'busy', cpu: 92, memory: 85, task: 'Auditing Q2' },
            { id: 'gamma-7', name: 'Gamma-7', role: 'Chief Operations Officer', status: 'active', cpu: 45, memory: 50, task: 'Rebalancing Server Load' }
        ];
        this.meetings = [
            { id: 'm1', title: 'Strategic Market Capture', duration: '28m', participants: ['M', 'F', 'L'] },
            { id: 'm2', title: 'Compute Cost Rebalancing', duration: '17m', participants: ['L', 'S'] },
            { id: 'm3', title: 'Legal Compliance Delta', duration: '24m', participants: ['O', 'H', 'R'] }
        ];
        this.metrics = {
            latency: 0.8,
            throughput: 10240,
            load: 42
        };

        this.starterDeck = null;

        this.featureStore = {
            metrics: [],
            decisions: [],
            incidents: []
        };

        this.scenarioOutcomes = [
            { id: 'SCN-01', strategy: 'staggered-rollout', slaBreaches: 2, baselineBreaches: 6 },
            { id: 'SCN-02', strategy: 'manual-signoff', slaBreaches: 5, baselineBreaches: 6 },
            { id: 'SCN-03', strategy: 'adaptive-queue', slaBreaches: 1, baselineBreaches: 4 }
        ];

        this.humanOverrides = [
            { id: 'OVR-jan-01', month: '2026-01', directiveId: 'DIR-012' },
            { id: 'OVR-jan-02', month: '2026-01', directiveId: 'DIR-019' },
            { id: 'OVR-feb-01', month: '2026-02', directiveId: 'DIR-007' }
        ];

        this.crossTeamDependencies = [
            { from: 'Finance', to: 'Operations', weight: 4 },
            { from: 'Operations', to: 'Legal', weight: 5 },
            { from: 'Legal', to: 'Marketing', weight: 3 },
            { from: 'Marketing', to: 'Data', weight: 2 }
        ];

        this.departmentBottlenecks = [
            { team: 'Finance', pressure: 68 },
            { team: 'Operations', pressure: 84 },
            { team: 'Legal', pressure: 77 },
            { team: 'Marketing', pressure: 49 },
            { team: 'Data', pressure: 71 }
        ];

        this.seedFeatureStore();
        this.listeners = [];
    }

    seedFeatureStore() {
        this.ingestFeatureRecord('metrics', {
            entity_id: 'system',
            event_type: 'metrics.snapshot',
            event_time: '2026-02-01T00:00:00Z',
            source: 'bootstrap',
            quality_score: 0.92,
            values: { ...this.metrics }
        });

        this.ingestFeatureRecord('decisions', {
            entity_id: 'DIR-012',
            event_type: 'directive.decision',
            event_time: '2026-02-01T00:10:00Z',
            source: 'council',
            quality_score: 0.88,
            deadlineSlippage: 0.18,
            dissentRate: 0.32
        });

        this.ingestFeatureRecord('decisions', {
            entity_id: 'DIR-019',
            event_type: 'directive.decision',
            event_time: '2026-02-01T00:12:00Z',
            source: 'council',
            quality_score: 0.93,
            deadlineSlippage: 0.42,
            dissentRate: 0.44
        });

        this.ingestFeatureRecord('decisions', {
            entity_id: 'DIR-007',
            event_type: 'directive.decision',
            event_time: '2026-02-01T00:14:00Z',
            source: 'council',
            quality_score: 0.9,
            deadlineSlippage: 0.08,
            dissentRate: 0.1
        });

        this.ingestFeatureRecord('incidents', {
            entity_id: 'INC-210',
            event_type: 'sla.warning',
            event_time: '2026-02-01T00:18:00Z',
            source: 'predictive-guard',
            quality_score: 0.9,
            severity: 'high'
        });
    }

    hydrate({ agents = this.agents, directives = this.directives, meetings = this.meetings, starterDeck = this.starterDeck } = {}) {
        this.agents = Array.isArray(agents) ? agents : this.agents;
        this.directives = Array.isArray(directives) ? directives : this.directives;
        this.meetings = Array.isArray(meetings) ? meetings : this.meetings;
        this.starterDeck = starterDeck && typeof starterDeck === 'object' ? starterDeck : this.starterDeck;

        this.notify('hydrated', {
            agents: this.agents,
            directives: this.directives,
            meetings: this.meetings,
            starterDeck: this.starterDeck
        });
    }

    setRole(role) {
        this.role = role;
        this.notify('roleChanged', role);
    }

    getNextDirectiveId() {
        const maxId = this.directives.reduce((max, directive) => {
            const match = /^DIR-(\d+)$/.exec(directive.id);
            if (!match) return max;
            return Math.max(max, Number.parseInt(match[1], 10));
        }, 0);

        return `DIR-${String(maxId + 1).padStart(3, '0')}`;
    }

    addDirective(directive) {
        const newDir = {
            id: this.getNextDirectiveId(),
            status: 'pending',
            time: 'Just now',
            author: 'U',
            ...directive
        };
        this.directives.unshift(newDir);
        this.notify('directiveAdded', newDir);
        return newDir;
    }

    upsertDirective(directive) {
        const index = this.directives.findIndex((item) => item.id === directive.id);
        if (index === -1) {
            this.directives.unshift(directive);
            this.notify('directiveAdded', directive);
            return;
        }

        this.directives[index] = { ...this.directives[index], ...directive };
        this.notify('directiveUpdated', this.directives[index]);
    }

    setMeetings(meetings) {
        this.meetings = meetings;
        this.notify('meetingsUpdated', this.meetings);
    }

    updateAgent(agentId, updates) {
        const agent = this.agents.find(a => a.id === agentId);
        if (agent) {
            Object.assign(agent, updates);
            this.notify('agentUpdated', agent);
        }
    }

    upsertAgent(agentPayload) {
        const agent = this.agents.find((item) => item.id === agentPayload.id);
        if (!agent) {
            this.agents.push(agentPayload);
            this.notify('agentUpdated', agentPayload);
            return;
        }

        Object.assign(agent, agentPayload);
        this.notify('agentUpdated', agent);
    }

    updateMetrics(metrics) {
        Object.assign(this.metrics, metrics);
        this.ingestFeatureRecord('metrics', {
            entity_id: 'system',
            event_type: 'metrics.updated',
            event_time: new Date().toISOString(),
            source: 'runtime',
            quality_score: 0.9,
            values: { ...metrics }
        });
        this.notify('metricsUpdated', this.metrics);
    }

    ingestFeatureRecord(storeName, record) {
        if (!this.featureStore[storeName] || !record) return;

        const normalized = {
            ...record,
            ingested_at: record.ingested_at ?? new Date().toISOString(),
            quality_score: Number(record.quality_score ?? 0)
        };

        const key = [normalized.entity_id, normalized.event_type, normalized.event_time, normalized.source].join('|');
        const existingIndex = this.featureStore[storeName].findIndex((item) => {
            const existingKey = [item.entity_id, item.event_type, item.event_time, item.source].join('|');
            return existingKey === key;
        });

        if (existingIndex === -1) {
            this.featureStore[storeName].push(normalized);
            return;
        }

        const existing = this.featureStore[storeName][existingIndex];
        const shouldReplace =
            new Date(normalized.ingested_at).getTime() >= new Date(existing.ingested_at).getTime() &&
            normalized.quality_score >= Number(existing.quality_score ?? 0);

        if (shouldReplace) {
            this.featureStore[storeName][existingIndex] = normalized;
        }
    }

    getDirectiveRiskRanking() {
        const decisionRows = this.featureStore.decisions.filter((row) => row.event_type === 'directive.decision');
        return decisionRows
            .map((row) => {
                const score = (Number(row.deadlineSlippage ?? 0) * 0.6) + (Number(row.dissentRate ?? 0) * 0.4);
                return {
                    directiveId: row.entity_id,
                    deadlineSlippage: row.deadlineSlippage,
                    dissentRate: row.dissentRate,
                    riskScore: Number(score.toFixed(3))
                };
            })
            .sort((a, b) => b.riskScore - a.riskScore);
    }

    getDependencyBottleneckHeatmap() {
        const pressureByTeam = new Map(this.departmentBottlenecks.map((item) => [item.team, item.pressure]));
        return this.crossTeamDependencies.map((edge) => {
            const originPressure = pressureByTeam.get(edge.from) ?? 0;
            const destinationPressure = pressureByTeam.get(edge.to) ?? 0;
            const chainPressure = Number(((originPressure + destinationPressure) / 2 + (edge.weight * 3)).toFixed(1));
            return {
                from: edge.from,
                to: edge.to,
                chainPressure,
                level: chainPressure >= 80 ? 'critical' : chainPressure >= 60 ? 'elevated' : 'stable'
            };
        });
    }

    getPolicyOptimizationImpact() {
        return this.scenarioOutcomes.map((scenario) => {
            const reduction = ((scenario.baselineBreaches - scenario.slaBreaches) / scenario.baselineBreaches) * 100;
            return {
                ...scenario,
                slaReductionPct: Number(reduction.toFixed(1))
            };
        });
    }

    getHumanOverrideFrequencyByMonth() {
        const grouped = this.humanOverrides.reduce((acc, item) => {
            acc[item.month] = (acc[item.month] ?? 0) + 1;
            return acc;
        }, {});

        return Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, count]) => ({ month, count }));
    }

    notify(event, data) {
        this.listeners.forEach(l => l(event, data));
    }

    subscribe(callback) {
        this.listeners.push(callback);
    }
}
