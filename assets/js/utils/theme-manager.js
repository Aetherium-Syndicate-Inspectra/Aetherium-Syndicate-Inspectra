export class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'dark';
        this.toggleBtn = document.getElementById('theme-toggle');
        this.init();
    }

    init() {
        document.documentElement.setAttribute('data-theme', this.theme);
        this.updateIcon();

        if (this.toggleBtn) {
            this.toggleBtn.addEventListener('click', () => this.toggle());
        }
    }

    toggle() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', this.theme);
        localStorage.setItem('theme', this.theme);
        this.updateIcon();
    }

    updateIcon() {
        if (!this.toggleBtn) return;
        const icon = this.toggleBtn.querySelector('.material-symbols-outlined');
        if (icon) {
            icon.textContent = this.theme === 'dark' ? 'light_mode' : 'dark_mode';
        }
    }
}
