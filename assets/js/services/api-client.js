const DEFAULT_HEADERS = {
    Accept: 'application/json'
};

export class ApiClient {
    constructor(baseUrl = '') {
        this.baseUrl = baseUrl;
    }

    async bootstrap() {
        const [agents, directives, meetings] = await Promise.all([
            this.get('/api/agents'),
            this.get('/api/directives'),
            this.get('/api/meetings')
        ]);

        return { agents, directives, meetings };
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
