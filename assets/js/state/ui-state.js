export class UIState {
    constructor() {
        this.activeView = 'dashboard';
        this.isLoading = true;
        this.connection = {
            api: 'disconnected',
            realtime: 'disconnected',
            transport: 'none'
        };
        this.listeners = [];
    }

    subscribe(callback) {
        this.listeners.push(callback);
    }

    notify(event, data) {
        this.listeners.forEach((listener) => listener(event, data));
    }

    setActiveView(viewName) {
        this.activeView = viewName;
        this.notify('viewChanged', viewName);
    }

    setLoading(isLoading) {
        this.isLoading = isLoading;
        this.notify('loadingChanged', isLoading);
    }

    setConnection(connectionPatch) {
        this.connection = {
            ...this.connection,
            ...connectionPatch
        };
        this.notify('connectionChanged', this.connection);
    }
}
