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

test('feature store deduplicates by canonical key and keeps best quality/latest record', () => {
    const state = new AppState();
    const keyRecord = {
        entity_id: 'DIR-012',
        event_type: 'directive.decision',
        event_time: '2026-02-01T00:10:00Z',
        source: 'council'
    };

    state.ingestFeatureRecord('decisions', {
        ...keyRecord,
        ingested_at: '2030-02-01T01:00:00Z',
        quality_score: 0.99,
        deadlineSlippage: 0.2,
        dissentRate: 0.4
    });

    state.ingestFeatureRecord('decisions', {
        ...keyRecord,
        ingested_at: '2030-02-01T00:30:00Z',
        quality_score: 0.5,
        deadlineSlippage: 0.8,
        dissentRate: 0.8
    });

    const replaced = state.featureStore.decisions.find((row) => row.entity_id === 'DIR-012' && row.event_time === '2026-02-01T00:10:00Z' && row.source === 'council');
    assert.equal(replaced.quality_score, 0.99);
    assert.equal(replaced.deadlineSlippage, 0.2);
});

test('directive risk ranking sorts highest risk first', () => {
    const state = new AppState();
    const ranking = state.getDirectiveRiskRanking();

    assert.equal(ranking[0].directiveId, 'DIR-019');
    assert.ok(ranking[0].riskScore >= ranking[1].riskScore);
});

test('human override frequency aggregates by month', () => {
    const state = new AppState();
    const summary = state.getHumanOverrideFrequencyByMonth();

    assert.deepEqual(summary, [
        { month: '2026-01', count: 2 },
        { month: '2026-02', count: 1 }
    ]);
});
