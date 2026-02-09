import test from 'node:test';
import assert from 'node:assert/strict';
import { AppState } from '../assets/js/state/app-state.js';

test('addDirective generates deterministic next id from existing directives', () => {
    const state = new AppState();
    state.addDirective({ title: 'Test Directive', department: 'Operations' });

    assert.equal(state.directives[0].id, 'DIR-020');
    assert.equal(state.directives[0].status, 'pending');
    assert.equal(state.directives[0].author, 'U');
});

test('getNextDirectiveId skips invalid directive ids safely', () => {
    const state = new AppState();
    state.directives.push({ id: 'CUSTOM-ID', title: 'Legacy', status: 'pending' });

    assert.equal(state.getNextDirectiveId(), 'DIR-020');
});

test('setRole notifies subscribers with roleChanged event', () => {
    const state = new AppState();
    let observed = null;

    state.subscribe((event, data) => {
        observed = { event, data };
    });

    state.setRole('analyst');

    assert.deepEqual(observed, { event: 'roleChanged', data: 'analyst' });
});

test('hydrate replaces collections and emits hydrated event', () => {
    const state = new AppState();
    let observed = null;

    state.subscribe((event, data) => {
        if (event === 'hydrated') observed = data;
    });

    state.hydrate({
        agents: [{ id: 'new-agent' }],
        directives: [{ id: 'DIR-999' }],
        meetings: [{ id: 'new-meeting' }]
    });

    assert.equal(state.agents[0].id, 'new-agent');
    assert.equal(state.directives[0].id, 'DIR-999');
    assert.equal(state.meetings[0].id, 'new-meeting');
    assert.deepEqual(observed, {
        agents: [{ id: 'new-agent' }],
        directives: [{ id: 'DIR-999' }],
        meetings: [{ id: 'new-meeting' }]
    });
});
