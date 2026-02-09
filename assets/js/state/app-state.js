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
        this.listeners = [];
    }

    hydrate({ agents = this.agents, directives = this.directives, meetings = this.meetings } = {}) {
        this.agents = Array.isArray(agents) ? agents : this.agents;
        this.directives = Array.isArray(directives) ? directives : this.directives;
        this.meetings = Array.isArray(meetings) ? meetings : this.meetings;

        this.notify('hydrated', {
            agents: this.agents,
            directives: this.directives,
            meetings: this.meetings
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
        this.notify('metricsUpdated', this.metrics);
    }

    notify(event, data) {
        this.listeners.forEach(l => l(event, data));
    }

    subscribe(callback) {
        this.listeners.push(callback);
    }
}
