import { describe, it, beforeAll } from 'vitest';
import * as approvals from 'approvals';
import path from 'path';
import {
    createInitialTimelineState,
    dealNextEvent,
    moveCard,
    placeCard,
    isPlacementCorrect,
    getNextPlayerId,
    applyTimelineMessage,
} from '../logic';
import type { TimelineGameState, PlacedEvent } from '../types';

const APPROVED_DIR = path.join(__dirname);

// nodediff: prints colored text diff to console, no GUI tool. Runs fine in CI.
beforeAll(() => {
    approvals.configure({ reporters: ['nodediff'] } as any);
});

function approve(testName: string, content: unknown) {
    approvals.verifyAsJSON(APPROVED_DIR, testName, content, {});
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stateWith(overrides: Partial<TimelineGameState> = {}): TimelineGameState {
    return { ...createInitialTimelineState('coop', 5), ...overrides };
}

const TWO_PLACED: PlacedEvent[] = [
    { id: 1, title: 'Early', year: 1900, category: 'Science', imageUrl: '', placedBy: 'system', wasCorrect: true },
    { id: 2, title: 'Late', year: 2000, category: 'Science', imageUrl: '', placedBy: 'system', wasCorrect: true },
];

// ─── createInitialTimelineState ──────────────────────────────────────────────

describe('createInitialTimelineState', () => {
    it('creates coop state with correct defaults', () => {
        const state = createInitialTimelineState('coop', 10);
        approve('initial_state_coop', {
            mode: state.mode,
            status: state.status,
            lives: state.lives,
            cardsPlaced: state.cardsPlaced,
            cardsGoal: state.cardsGoal,
            activePlayerId: state.activePlayerId,
            activeEvent: state.activeEvent,
            proposedPosition: state.proposedPosition,
            playerScores: state.playerScores,
            placedEventsCount: state.placedEvents.length,
        });
    });

    it('creates competitive state', () => {
        const state = createInitialTimelineState('competitive', 15);
        approve('initial_state_competitive', { mode: state.mode, cardsGoal: state.cardsGoal });
    });
});

// ─── dealNextEvent ───────────────────────────────────────────────────────────

describe('dealNextEvent', () => {
    it('deals an event to a player and sets status to placing', () => {
        const state = createInitialTimelineState('coop', 10);
        const next = dealNextEvent(state, 'player1');
        approve('deal_next_event', {
            status: next.status,
            activePlayerId: next.activePlayerId,
            hasActiveEvent: next.activeEvent !== null,
            usedEventIdsCount: next.usedEventIds.length,
        });
    });

    it('transitions to gameOver when no events remain', () => {
        const state = stateWith({
            usedEventIds: Array.from({ length: 100 }, (_, i) => i + 1),
        });
        const next = dealNextEvent(state, 'player1');
        approve('deal_next_event_exhausted', { status: next.status, winner: next.winner });
    });
});

// ─── moveCard ────────────────────────────────────────────────────────────────

describe('moveCard', () => {
    it('moves right', () => {
        const state = stateWith({ status: 'placing', proposedPosition: 0 });
        approve('move_card_right', { proposedPosition: moveCard(state, 'right').proposedPosition });
    });

    it('moves left', () => {
        const state = stateWith({ status: 'placing', proposedPosition: 1 });
        approve('move_card_left', { proposedPosition: moveCard(state, 'left').proposedPosition });
    });

    it('clamps at left boundary', () => {
        const state = stateWith({ status: 'placing', proposedPosition: 0 });
        approve('move_card_clamp_left', { proposedPosition: moveCard(state, 'left').proposedPosition });
    });

    it('does nothing when not in placing status', () => {
        const state = stateWith({ status: 'revealing', proposedPosition: 0 });
        const next = moveCard(state, 'right');
        approve('move_card_wrong_status', { proposedPosition: next.proposedPosition, status: next.status });
    });
});

// ─── isPlacementCorrect ──────────────────────────────────────────────────────

describe('isPlacementCorrect', () => {
    const placed: PlacedEvent[] = [
        { id: 1, title: 'A', year: 1900, category: 'Science', imageUrl: '', placedBy: 'system', wasCorrect: true },
        { id: 2, title: 'B', year: 1950, category: 'Science', imageUrl: '', placedBy: 'system', wasCorrect: true },
        { id: 3, title: 'C', year: 2000, category: 'Science', imageUrl: '', placedBy: 'system', wasCorrect: true },
    ];

    it('accepts correct placement between events', () => {
        const event = { id: 4, title: 'E', year: 1925, category: 'Science' as const, imageUrl: '' };
        approve('placement_correct_between', { result: isPlacementCorrect(event, 1, placed) });
    });

    it('rejects incorrect placement', () => {
        const event = { id: 4, title: 'E', year: 1925, category: 'Science' as const, imageUrl: '' };
        approve('placement_incorrect', { result: isPlacementCorrect(event, 0, placed) });
    });

    it('accepts placement at start for earliest event', () => {
        const event = { id: 4, title: 'E', year: 1800, category: 'Science' as const, imageUrl: '' };
        approve('placement_correct_start', { result: isPlacementCorrect(event, 0, placed) });
    });

    it('accepts placement at end for latest event', () => {
        const event = { id: 4, title: 'E', year: 2020, category: 'Science' as const, imageUrl: '' };
        approve('placement_correct_end', { result: isPlacementCorrect(event, placed.length, placed) });
    });
});

// ─── placeCard ───────────────────────────────────────────────────────────────

describe('placeCard', () => {
    it('places correctly — sets revealing status', () => {
        const state: TimelineGameState = {
            ...stateWith(),
            status: 'placing',
            activePlayerId: 'player1',
            activeEvent: { id: 10, title: 'Mid', year: 1950, category: 'Science', imageUrl: '' },
            placedEvents: TWO_PLACED,
            proposedPosition: 1, // between 1900 and 2000 ✓
        };
        const next = placeCard(state);
        approve('place_card_correct', {
            status: next.status,
            lives: next.lives,
            cardsPlaced: next.cardsPlaced,
            lastCorrect: next.placedEvents.find(e => e.id === 10)?.wasCorrect,
        });
    });

    it('places incorrectly — deducts life, moves card to correct spot', () => {
        const state: TimelineGameState = {
            ...stateWith(),
            status: 'placing',
            activePlayerId: 'player1',
            activeEvent: { id: 10, title: 'Mid', year: 1950, category: 'Science', imageUrl: '' },
            placedEvents: TWO_PLACED,
            proposedPosition: 0, // wrong: placing 1950 before 1900
            lives: 3,
        };
        const next = placeCard(state);
        approve('place_card_incorrect', {
            status: next.status,
            lives: next.lives,
            lastCorrect: next.placedEvents.find(e => e.id === 10)?.wasCorrect,
            correctPosition: next.placedEvents.findIndex(e => e.id === 10),
        });
    });

    it('triggers gameOver when last life lost', () => {
        const state: TimelineGameState = {
            ...stateWith(),
            status: 'placing',
            activePlayerId: 'player1',
            activeEvent: { id: 10, title: 'Mid', year: 1950, category: 'Science', imageUrl: '' },
            placedEvents: TWO_PLACED,
            proposedPosition: 0,
            lives: 1,
        };
        const next = placeCard(state);
        approve('place_card_game_over_lives', { status: next.status, lives: next.lives, winner: next.winner });
    });

    it('triggers team win when cardsGoal reached', () => {
        const state: TimelineGameState = {
            ...stateWith({ cardsPlaced: 4 }),
            status: 'placing',
            activePlayerId: 'player1',
            activeEvent: { id: 10, title: 'Mid', year: 1950, category: 'Science', imageUrl: '' },
            placedEvents: TWO_PLACED,
            proposedPosition: 1, // correct placement ✓
        };
        const next = placeCard(state);
        approve('place_card_team_win', { status: next.status, winner: next.winner });
    });
});

// ─── getNextPlayerId ─────────────────────────────────────────────────────────

describe('getNextPlayerId', () => {
    const players = ['p1', 'p2', 'p3'];

    it('returns next player in sequence', () => {
        approve('next_player_mid', { next: getNextPlayerId(players, 'p1') });
    });

    it('wraps around to first after last', () => {
        approve('next_player_wrap', { next: getNextPlayerId(players, 'p3') });
    });

    it('handles single player', () => {
        approve('next_player_single', { next: getNextPlayerId(['only'], 'only') });
    });

    it('handles unknown player (returns index 0)', () => {
        approve('next_player_unknown', { next: getNextPlayerId(players, 'nobody') });
    });
});

// ─── applyTimelineMessage ────────────────────────────────────────────────────

describe('applyTimelineMessage', () => {
    it('moveCard delegates correctly', () => {
        const state = stateWith({ status: 'placing', proposedPosition: 0 });
        const next = applyTimelineMessage(state, { type: 'moveCard', direction: 'right' });
        approve('apply_move_card', { proposedPosition: next.proposedPosition });
    });

    it('nextTurn is a server-side no-op on the client', () => {
        const state = stateWith({ status: 'placing', proposedPosition: 1 });
        const next = applyTimelineMessage(state, { type: 'nextTurn' });
        approve('apply_next_turn_noop', { status: next.status, proposedPosition: next.proposedPosition });
    });
});
