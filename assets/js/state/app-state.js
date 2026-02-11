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

        this.bidLedger = [];

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

        this.listeners = [];
        this.seedFeatureStore();
        this.seedBidLedger();
        this.seedSyntheticStressDataset();
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



    seedBidLedger() {
        const now = Date.now();
        this.ingestBidLedgerEvent({
            schema_version: 'v1',
            event_id: 'bid-seed-1',
            event_type: 'bid_created',
            event_time: now - 30_000,
            source: 'bootstrap',
            payload: { bid_id: 'BID-1001', symbol: 'AETH', bidder: 'Alpha-1', amount: 320000, state: 'proposing' },
            quality: { confidence: 0.92, freshness: 0.86, completeness: 1 }
        });

        this.ingestBidLedgerEvent({
            schema_version: 'v1',
            event_id: 'bid-seed-2',
            event_type: 'bid_countered',
            event_time: now - 20_000,
            source: 'bootstrap',
            payload: { bid_id: 'BID-1002', symbol: 'NOVA', bidder: 'Beta-X', amount: 275000, state: 'countering' },
            quality: { confidence: 0.9, freshness: 0.89, completeness: 1 }
        });

        this.ingestBidLedgerEvent({
            schema_version: 'v1',
            event_id: 'bid-seed-3',
            event_type: 'conflict_resolved',
            event_time: now - 10_000,
            source: 'bootstrap',
            payload: { bid_id: 'BID-1000', symbol: 'ORBIT', bidder: 'Gamma-7', amount: 410000, state: 'settled' },
            quality: { confidence: 0.97, freshness: 0.94, completeness: 1 }
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



    seedSyntheticStressDataset() {
        this.syntheticStressDataset = this.generateSyntheticStressDataset({
            peakTrafficSamples: 120,
            conflictingDirectivePairs: 18
        });
    }

    generateSyntheticStressDataset({ peakTrafficSamples = 100, conflictingDirectivePairs = 12 } = {}) {
        const baseTimestamp = Date.parse('2026-03-01T00:00:00Z');
        const peakTraffic = Array.from({ length: peakTrafficSamples }, (_, index) => ({
            sample_id: `peak-${index + 1}`,
            timestamp: new Date(baseTimestamp + (index * 1_000)).toISOString(),
            throughput: 12000 + (index % 37) * 110,
            latency: Number((0.45 + (index % 9) * 0.04).toFixed(3)),
            load: 55 + (index % 11) * 3
        }));

        const conflictingDirectives = Array.from({ length: conflictingDirectivePairs }, (_, index) => ({
            directiveId: `DIR-STRESS-${String(index + 1).padStart(3, '0')}`,
            deadlineSlippage: Number((0.25 + ((index % 5) * 0.11)).toFixed(3)),
            dissentRate: Number((0.2 + ((index % 4) * 0.16)).toFixed(3)),
            conflictIntensity: Number((0.4 + ((index % 6) * 0.09)).toFixed(3)),
            source: 'synthetic-stress'
        }));

        return { peakTraffic, conflictingDirectives };
    }

    getFeatureFreshnessByModule(referenceTime = Date.now()) {
        const modules = {
            analytics: this.featureStore.metrics,
            policy: this.featureStore.decisions,
            alerting: this.featureStore.incidents
        };

        const scoreRows = Object.entries(modules).map(([moduleName, rows]) => {
            const freshestTimestamp = rows.reduce((maxTs, row) => {
                const ts = Date.parse(row.event_time || row.ingested_at || 0);
                return Number.isNaN(ts) ? maxTs : Math.max(maxTs, ts);
            }, 0);

            const ageMs = freshestTimestamp ? Math.max(0, referenceTime - freshestTimestamp) : Number.POSITIVE_INFINITY;
            const freshnessScore = freshestTimestamp
                ? Number(Math.max(0, 1 - (ageMs / (1000 * 60 * 60 * 24))).toFixed(4))
                : 0;

            return {
                module: moduleName,
                freshnessScore,
                freshestTimestamp: freshestTimestamp ? new Date(freshestTimestamp).toISOString() : null
            };
        });

        return scoreRows.sort((a, b) => b.freshnessScore - a.freshnessScore);
    }

    getFreshestFeatureModule(referenceTime = Date.now()) {
        const [freshest] = this.getFeatureFreshnessByModule(referenceTime);
        return freshest || null;
    }

    getStressRiskRanking() {
        return this.syntheticStressDataset.conflictingDirectives
            .map((row) => {
                const score = (Number(row.deadlineSlippage ?? 0) * 0.45)
                    + (Number(row.dissentRate ?? 0) * 0.35)
                    + (Number(row.conflictIntensity ?? 0) * 0.2);
                return {
                    directiveId: row.directiveId,
                    riskScore: Number(score.toFixed(3)),
                    source: row.source
                };
            })
            .sort((a, b) => b.riskScore - a.riskScore);
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



    getQualityTotal(quality = {}) {
        return Number(quality.confidence ?? 0) + Number(quality.freshness ?? 0) + Number(quality.completeness ?? 0);
    }

    ingestBidLedgerEvent(eventEnvelope) {
        if (!eventEnvelope || !eventEnvelope.event_type) return;

        const canonical = this.toCanonicalBidEvent(eventEnvelope);
        const existingIndex = this.bidLedger.findIndex((item) => item.canonical_key === canonical.canonical_key);

        if (existingIndex === -1) {
            this.bidLedger.unshift(canonical);
            this.notify('bidLedgerUpdated', this.bidLedger);
            return;
        }

        const existing = this.bidLedger[existingIndex];
        const existingScore = this.getQualityTotal(existing.quality);
        const incomingScore = this.getQualityTotal(canonical.quality);
        const shouldReplace =
            incomingScore > existingScore ||
            (incomingScore === existingScore && Number(canonical.schema_version.slice(1) || 0) >= Number(existing.schema_version.slice(1) || 0));

        if (shouldReplace) {
            this.bidLedger.splice(existingIndex, 1);
            this.bidLedger.unshift(canonical);
            this.notify('bidLedgerUpdated', this.bidLedger);
        }
    }

    toCanonicalBidEvent(eventEnvelope) {
        const payload = eventEnvelope.payload || {};
        const schemaVersion = eventEnvelope.schema_version || 'v1';
        const eventTime = Number(eventEnvelope.event_time || eventEnvelope.timestamp || Date.now());
        const source = eventEnvelope.source || 'unknown';
        const entityId = payload.bid_id || payload.entity_id || 'global';
        return {
            schema_version: schemaVersion,
            event_id: eventEnvelope.event_id || `${entityId}-${eventEnvelope.event_type}-${eventTime}`,
            event_type: eventEnvelope.event_type,
            event_time: eventTime,
            source,
            canonical_key: eventEnvelope.canonical_key || `${schemaVersion}:${entityId}:${eventEnvelope.event_type}:${eventTime}:${source}`,
            payload,
            quality: {
                confidence: Number(eventEnvelope.quality?.confidence ?? 0),
                freshness: Number(eventEnvelope.quality?.freshness ?? 0),
                completeness: Number(eventEnvelope.quality?.completeness ?? 0)
            }
        };
    }

    notify(event, data) {
        this.listeners.forEach(l => l(event, data));
    }

    subscribe(callback) {
        this.listeners.push(callback);
    }
}
