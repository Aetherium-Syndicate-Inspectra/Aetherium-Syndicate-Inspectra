import { AppState } from './state/app-state.js';
import { ThemeManager } from './utils/theme-manager.js';
import { MockAetherBus } from './services/mock-aetherbus.js';

class App {
    constructor() {
        this.state = new AppState();
        this.bus = new MockAetherBus(this.state);
        this.themeManager = new ThemeManager();

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

        // Subscribe to state changes
        this.state.subscribe((event, data) => {
            this.onStateChange(event, data);
        });

        // Initial view
        await this.loadView('dashboard');

        // Hide loader
        const loader = document.getElementById('loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.remove(), 300);
        }
    }

    onStateChange(event, data) {
        // Global UI updates
        if (event === 'roleChanged') {
            this.updateUIPermissions();
        }

        // View-specific updates (delegated to the view instance)
        if (this.currentViewInstance && this.currentViewInstance.onStateChange) {
            this.currentViewInstance.onStateChange(event, data);
        }
    }

    setupEventListeners() {
        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.getAttribute('data-view');
                if (view) this.loadView(view);
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

        // Re-render
        if (this.currentViewName) {
            const current = this.currentViewName;
            this.currentViewName = null; // Force reload
            this.loadView(current);
        }
    }

    openDirectiveModal() {
        const title = prompt('หัวข้อคำสั่ง (Directive Title):');
        if (title) {
            const dept = prompt('แผนก (Marketing/Finance/R&D/Operations):', 'Operations');
            this.state.addDirective({ title, department: dept });
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
