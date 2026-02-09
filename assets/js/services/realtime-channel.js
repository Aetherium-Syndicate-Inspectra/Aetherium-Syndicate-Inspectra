const WEBSOCKET_RETRY_MS = 5000;

export class RealtimeChannel {
    constructor({ onEvent, onStatus }) {
        this.onEvent = onEvent;
        this.onStatus = onStatus;
        this.socket = null;
        this.eventSource = null;
        this.retryTimeout = null;
    }

    connect() {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host}/ws/status`;

        try {
            this.socket = new WebSocket(wsUrl);
            this.attachWebSocketHandlers();
        } catch (error) {
            this.openSse(error);
        }
    }

    attachWebSocketHandlers() {
        this.socket.addEventListener('open', () => {
            this.updateStatus({ realtime: 'connected', transport: 'websocket' });
        });

        this.socket.addEventListener('message', (event) => {
            this.handlePayload(event.data);
        });

        this.socket.addEventListener('close', () => {
            this.updateStatus({ realtime: 'disconnected', transport: 'none' });
            this.openSse();
        });

        this.socket.addEventListener('error', () => {
            this.openSse();
        });
    }

    openSse(initialError) {
        if (initialError) {
            console.warn('[Realtime] WebSocket unavailable. Falling back to SSE.', initialError);
        }

        if (this.eventSource && this.eventSource.readyState !== EventSource.CLOSED) {
            return;
        }

        this.eventSource = new EventSource('/api/events');

        this.eventSource.onopen = () => {
            this.updateStatus({ realtime: 'connected', transport: 'sse' });
        };

        this.eventSource.onmessage = (event) => {
            this.handlePayload(event.data);
        };

        this.eventSource.onerror = () => {
            this.updateStatus({ realtime: 'disconnected', transport: 'none' });
            this.eventSource.close();
            this.scheduleReconnect();
        };
    }

    handlePayload(rawPayload) {
        try {
            const payload = JSON.parse(rawPayload);
            this.onEvent?.(payload);
        } catch (error) {
            console.error('[Realtime] Invalid payload format', error);
        }
    }

    updateStatus(statusPatch) {
        this.onStatus?.(statusPatch);
    }

    scheduleReconnect() {
        clearTimeout(this.retryTimeout);
        this.retryTimeout = setTimeout(() => this.connect(), WEBSOCKET_RETRY_MS);
    }
}
