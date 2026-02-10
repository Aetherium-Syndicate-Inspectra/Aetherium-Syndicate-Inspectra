const DEFAULT_HEADERS = {
    Accept: 'application/json'
};

function detectBaseUrl() {
    const configured = window.__AETHERIUM_API_BASE_URL__
        || window.localStorage.getItem('aetherium:apiBaseUrl')
        || '';
    return configured.replace(/\/$/, '');
}

export class ApiClient {
    constructor(baseUrl = detectBaseUrl()) {
        this.baseUrl = baseUrl;
    }

    async bootstrap() {
        const [agents, directives, meetings, starterDeck] = await Promise.all([
            this.get('/api/agents'),
            this.get('/api/directives'),
            this.get('/api/meetings'),
            this.get('/api/mint-starter-deck?seed=999')
        ]);

        return { agents, directives, meetings, starterDeck };
    }

    async createDirective(payload) {
        return this.request('/api/directives', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...DEFAULT_HEADERS
            },
            body: JSON.stringify(payload)
        });
    }

    async get(path) {
        return this.request(path, { method: 'GET', headers: DEFAULT_HEADERS });
    }

    async request(path, options) {
        const response = await fetch(`${this.baseUrl}${path}`, options);

        if (!response.ok) {
            const body = await response.text();
            throw new Error(`API request failed (${response.status}) ${path}: ${body || response.statusText}`);
        }

        return response.json();
    }
}
