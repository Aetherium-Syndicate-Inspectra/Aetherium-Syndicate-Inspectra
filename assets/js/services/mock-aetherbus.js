export class MockAetherBus {
    constructor(state) {
        this.state = state;
        this.startSimulation();
    }

    startSimulation() {
        // High frequency metrics (every 2 seconds)
        setInterval(() => {
            this.simulateMetrics();
        }, 2000);

        // Agent fluctuations (every 5 seconds)
        setInterval(() => {
            this.simulateAgents();
        }, 5000);

        // Occasional directive workflow updates (every 15 seconds)
        setInterval(() => {
            this.simulateEvents();
        }, 15000);
    }

    simulateMetrics() {
        const latency = (0.5 + Math.random() * 0.4).toFixed(2);
        const throughput = Math.floor(9000 + Math.random() * 2000);
        const load = Math.floor(35 + Math.random() * 15);

        this.state.updateMetrics({ latency, throughput, load });

        // Update Global UI elements directly for responsiveness
        const latEl = document.getElementById('latency-val');
        const thrEl = document.getElementById('throughput-val');
        const loadValEl = document.getElementById('system-load-val');
        const loadBarEl = document.getElementById('system-load-bar');

        if (latEl) latEl.textContent = latency + 'ms';
        if (thrEl) thrEl.textContent = throughput.toLocaleString() + ' req/s';
        if (loadValEl) loadValEl.textContent = load + '%';
        if (loadBarEl) {
            loadBarEl.style.width = load + '%';
            if (load > 80) loadBarEl.className = 'h-full bg-rose-500 transition-all duration-1000';
            else if (load > 60) loadBarEl.className = 'h-full bg-amber-500 transition-all duration-1000';
            else loadBarEl.className = 'h-full bg-emerald-500 transition-all duration-1000';
        }
    }

    simulateAgents() {
        this.state.agents.forEach(agent => {
            const cpuDelta = Math.floor(Math.random() * 10 - 5);
            const newCpu = Math.max(10, Math.min(100, agent.cpu + cpuDelta));

            this.state.updateAgent(agent.id, {
                cpu: newCpu,
                status: newCpu > 90 ? 'busy' : (Math.random() > 0.8 ? 'in meeting' : 'active')
            });
        });
    }

    simulateEvents() {
        // Chance to update a directive status
        const pending = this.state.directives.find(d => d.status === 'pending');
        if (pending && Math.random() > 0.7) {
            pending.status = 'meeting';
            this.state.notify('directiveUpdated', pending);
        }
    }
}
