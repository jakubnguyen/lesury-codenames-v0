import { describe, it, beforeAll } from 'vitest';
import * as approvals from 'approvals';
import path from 'path';
import { createInitialDemoState, applyDemoMessage } from '../logic';

// Store approved snapshots alongside the test file
const APPROVED_DIR = path.join(__dirname);

// nodediff: prints colored text diff to console, no GUI tool. Runs fine in CI.
beforeAll(() => {
    approvals.configure({ reporters: ['nodediff'] } as any);
});

function approve(testName: string, content: unknown) {
    approvals.verifyAsJSON(APPROVED_DIR, testName, content, {});
}

// ─── createInitialDemoState ──────────────────────────────────────────────────

describe('createInitialDemoState', () => {
    it('creates state with counter at 0', () => {
        approve('initial_state', createInitialDemoState());
    });
});

// ─── applyDemoMessage ────────────────────────────────────────────────────────

describe('applyDemoMessage', () => {
    it('increments counter', () => {
        const state = { counter: 5 };
        approve('increment', applyDemoMessage(state, { type: 'increment' }));
    });

    it('decrements counter', () => {
        const state = { counter: 5 };
        approve('decrement', applyDemoMessage(state, { type: 'decrement' }));
    });

    it('allows counter to go below zero', () => {
        const state = { counter: 0 };
        approve('decrement_below_zero', applyDemoMessage(state, { type: 'decrement' }));
    });
});
