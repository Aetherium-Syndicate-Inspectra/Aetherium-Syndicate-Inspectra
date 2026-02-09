import { AppState } from './state/app-state.js';
import { UIState } from './state/ui-state.js';
import { ThemeManager } from './utils/theme-manager.js';
import { MockAetherBus } from './services/mock-aetherbus.js';
import { ApiClient } from './services/api-client.js';
import { RealtimeChannel } from './services/realtime-channel.js';

class App {
    constructor() {
        this.state = new AppState();
        this.uiState = new UIState();
        this.themeManager = new ThemeManager();
        this.apiClient = new ApiClient();

        this.bus = null;
        this.realtimeChannel = null;

        this.viewContainer = document.getElementById('view-container');
        this.navItems = document.querySelectorAll('.nav-item');
        this.roleSelect = document.getElementById('role-select');

        this.currentViewName = null;
        this.currentViewInstance = null;

        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.startClock();

        this.state.subscribe((event, data) => {
            this.onStateChange(event, data);
        });

        this.uiState.subscribe((event, data) => {
            this.onUIStateChange(event, data);
        });

        await this.bootstrapData();

        await this.loadView(this.uiState.activeView);
        this.uiState.setLoading(false);
    }

    async bootstrapData() {
        try {
            const payload = await this.apiClient.bootstrap();
            this.state.hydrate(payload);
            this.uiState.setConnection({ api: 'connected' });
            this.connectRealtime();
        } catch (error) {
            console.warn('[App] API bootstrap failed, using mock transport.', error);
            this.uiState.setConnection({ api: 'fallback', realtime: 'simulated', transport: 'mock' });
            this.bus = new MockAetherBus(this.state);
        }
    }

    connectRealtime() {
        this.realtimeChannel = new RealtimeChannel({
            onEvent: (payload) => this.handleRealtimeEvent(payload),
            onStatus: (statusPatch) => this.uiState.setConnection(statusPatch)
        });

        this.realtimeChannel.connect();
    }

    handleRealtimeEvent(payload) {
        switch (payload.type) {
            case 'agent.updated':
                this.state.upsertAgent(payload.data);
                break;
            case 'directive.updated':
            case 'directive.created':
                this.state.upsertDirective(payload.data);
                break;
            case 'meeting.appended':
                this.state.setMeetings(payload.data);
                break;
            case 'metrics.updated':
                this.state.updateMetrics(payload.data);
                this.syncGlobalMetrics();
                break;
            default:
                console.info('[Realtime] Unsupported event type', payload.type);
        }
    }

    onStateChange(event, data) {
        if (event === 'roleChanged') {
            this.updateUIPermissions();
        }

        if (event === 'metricsUpdated') {
            this.syncGlobalMetrics();
        }

        if (this.currentViewInstance && this.currentViewInstance.onStateChange) {
            this.currentViewInstance.onStateChange(event, data);
        }
    }

    onUIStateChange(event, data) {
        if (event === 'connectionChanged') {
            this.renderConnectionStatus(data);
            return;
        }

        if (event === 'loadingChanged' && data === false) {
            const loader = document.getElementById('loader');
            if (loader) {
                loader.style.opacity = '0';
                setTimeout(() => loader.remove(), 300);
            }
        }
    }

    setupEventListeners() {
        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.getAttribute('data-view');
                if (view) {
                    this.uiState.setActiveView(view);
                    this.loadView(view);
                }
            });
        });

        this.roleSelect.addEventListener('change', (e) => {
            this.state.setRole(e.target.value);
        });

        document.getElementById('global-action-btn').addEventListener('click', () => {
            this.openDirectiveModal();
        });

        document.getElementById('emergency-council-nav').addEventListener('click', (e) => {
            e.preventDefault();
            this.triggerEmergency();
        });
    }

    async loadView(viewName) {
        if (this.currentViewName === viewName) return;

        this.navItems.forEach(item => {
            if (item.getAttribute('data-view') === viewName) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        this.viewContainer.style.opacity = '0.7';

        try {
            const module = await import(`./views/${viewName}-view.js`);
            const ViewClass = module.default;
            this.currentViewInstance = new ViewClass(this.state);

            this.viewContainer.innerHTML = '';
            this.viewContainer.appendChild(this.currentViewInstance.render());

            this.currentViewName = viewName;
        } catch (error) {
            console.error(`Failed to load view: ${viewName}`, error);
            this.viewContainer.innerHTML = `<div class="p-8 text-rose-500">Error loading ${viewName} terminal.</div>`;
        }

        this.viewContainer.style.opacity = '1';
    }

    renderConnectionStatus(connection) {
        const busStatus = document.getElementById('bus-status');
        if (!busStatus) return;

        if (connection.realtime === 'connected') {
            busStatus.textContent = `LIVE (${connection.transport.toUpperCase()})`;
            busStatus.className = 'text-emerald-400 font-bold';
            return;
        }

        if (connection.api === 'connected') {
            busStatus.textContent = 'API CONNECTED';
            busStatus.className = 'text-amber-400 font-bold';
            return;
        }

        busStatus.textContent = 'SIMULATED';
        busStatus.className = 'text-slate-300 font-bold';
    }

    syncGlobalMetrics() {
        const { latency, throughput, load } = this.state.metrics;

        const latEl = document.getElementById('latency-val');
        const thrEl = document.getElementById('throughput-val');
        const loadValEl = document.getElementById('system-load-val');
        const loadBarEl = document.getElementById('system-load-bar');

        if (latEl) latEl.textContent = `${latency}ms`;
        if (thrEl) thrEl.textContent = `${Number(throughput).toLocaleString()} req/s`;
        if (loadValEl) loadValEl.textContent = `${load}%`;
        if (loadBarEl) {
            loadBarEl.style.width = `${load}%`;
            if (load > 80) loadBarEl.className = 'h-full bg-rose-500 transition-all duration-1000';
            else if (load > 60) loadBarEl.className = 'h-full bg-amber-500 transition-all duration-1000';
            else loadBarEl.className = 'h-full bg-emerald-500 transition-all duration-1000';
        }
    }

    updateUIPermissions() {
        const role = this.state.role;
        const label = document.getElementById('user-role-label');
        const actionBtn = document.getElementById('global-action-btn');
        const userName = document.getElementById('user-name');

        if (label) label.textContent = role.charAt(0).toUpperCase() + role.slice(1) + ' Level 1';

        if (role === 'viewer') {
            if (actionBtn) { actionBtn.style.opacity = '0.3'; actionBtn.style.pointerEvents = 'none'; }
            if (userName) userName.textContent = 'Guest Observer';
        } else if (role === 'analyst') {
            if (actionBtn) { actionBtn.style.opacity = '0.7'; actionBtn.style.pointerEvents = 'auto'; }
            if (userName) userName.textContent = 'Analyst Miller';
        } else {
            if (actionBtn) { actionBtn.style.opacity = '1'; actionBtn.style.pointerEvents = 'auto'; }
            if (userName) userName.textContent = 'Dr. Aris Thorne';
        }

        if (this.currentViewName) {
            const current = this.currentViewName;
            this.currentViewName = null;
            this.loadView(current);
        }
    }

    async openDirectiveModal() {
        const title = prompt('หัวข้อคำสั่ง (Directive Title):');
        if (!title) return;

        const department = prompt('แผนก (Marketing/Finance/R&D/Operations):', 'Operations') || 'Operations';

        try {
            const created = await this.apiClient.createDirective({ title, department });
            this.state.upsertDirective(created);
        } catch (error) {
            console.warn('[App] Failed to save directive to API, using local state only.', error);
            this.state.addDirective({ title, department });
        }
    }

    triggerEmergency() {
        alert('⚠️ EMERGENCY COUNCIL TRIGGERED. Establishing secure quantum link...');
        this.state.agents.forEach(a => {
            this.state.updateAgent(a.id, { status: 'busy', task: 'EMERGENCY SESSION', cpu: 99 });
        });
    }

    startClock() {
        const clockEl = document.getElementById('clock');
        setInterval(() => {
            const now = new Date();
            const timeStr = now.toISOString().split('T')[1].split('.')[0] + ' UTC';
            if (clockEl) clockEl.textContent = timeStr;
        }, 1000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.aetherApp = new App();
});
