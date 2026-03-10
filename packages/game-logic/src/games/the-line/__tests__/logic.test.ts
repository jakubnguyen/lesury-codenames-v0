import { describe, it, beforeAll } from 'vitest';
import * as approvals from 'approvals';
import path from 'path';
import {
    createInitialTheLineState,
    applyTheLineMessage,
    moveCursor,
    placeTheLineCard,
    nextTurn,
    isTheLinePlacementCorrect,
    findTheLineCorrectPosition,
    getTheLineNextPlayerId,
} from '../logic';
import type { TheLineGameState, PlacedTheLineEvent } from '../types';

const APPROVED_DIR = path.join(__dirname);

// nodediff: prints colored text diff to console, no GUI tool. Runs fine in CI.
beforeAll(() => {
    approvals.configure({ reporters: ['nodediff'] } as any);
});

function approve(testName: string, content: unknown) {
    approvals.verifyAsJSON(APPROVED_DIR, testName, content, {});
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PLAYERS = ['player1', 'player2', 'player3'];

function makePlacedEvents(values: number[]): PlacedTheLineEvent[] {
    return values.map((v, i) => ({
        id: `TEST_${i}`,
        title: `Event ${v}`,
        sorting_category: 'Weight',
        funfact: 'Test fun fact',
        display_value: String(v),
        unit: 'kg',
        sorting_value: v,
        placedBy: 'system',
        wasCorrect: true,
    }));
}

function stateWith(overrides: Partial<TheLineGameState> = {}): TheLineGameState {
    return {
        selectedCategory: 'Weight',
        roundLimit: 5,
        roundIndex: 1,
        line: makePlacedEvents([10, 50, 100]),
        deck: [
            {
                id: 'D1',
                title: 'Deck1',
                sorting_category: 'Weight',
                funfact: 'f1',
                display_value: '25',
                unit: 'kg',
                sorting_value: 25,
            },
            {
                id: 'D2',
                title: 'Deck2',
                sorting_category: 'Weight',
                funfact: 'f2',
                display_value: '75',
                unit: 'kg',
                sorting_value: 75,
            },
        ],
        playQueue: PLAYERS,
        activePlayerId: 'player1',
        activeEvent: {
            id: 'A1',
            title: 'Active',
            sorting_category: 'Weight',
            funfact: 'active fact',
            display_value: '30',
            unit: 'kg',
            sorting_value: 30,
        },
        cursorIndex: 1,
        scores: { player1: 0, player2: 0, player3: 0 },
        usedCardIds: [],
        status: 'playing',
        last_action: null,
        ...overrides,
    };
}

// ─── createInitialTheLineState ───────────────────────────────────────────────

describe('createInitialTheLineState', () => {
    it('creates state with correct defaults', () => {
        const state = createInitialTheLineState('Weight', 5, PLAYERS);
        approve('initial_state', {
            selectedCategory: state.selectedCategory,
            roundLimit: state.roundLimit,
            roundIndex: state.roundIndex,
            status: state.status,
            lineLength: state.line.length,
            hasActiveEvent: state.activeEvent !== null,
            activePlayerId: state.activePlayerId,
            playQueue: state.playQueue,
            scores: state.scores,
            seedPlacedBy: state.line[0]?.placedBy,
        });
    });
});

// ─── moveCursor ──────────────────────────────────────────────────────────────

describe('moveCursor', () => {
    it('moves right', () => {
        const state = stateWith({ cursorIndex: 0 });
        const next = moveCursor(state, 'right');
        approve('move_cursor_right', { cursorIndex: next.cursorIndex });
    });

    it('moves left', () => {
        const state = stateWith({ cursorIndex: 2 });
        const next = moveCursor(state, 'left');
        approve('move_cursor_left', { cursorIndex: next.cursorIndex });
    });

    it('clamps at left boundary', () => {
        const state = stateWith({ cursorIndex: 0 });
        const next = moveCursor(state, 'left');
        approve('move_cursor_clamp_left', { cursorIndex: next.cursorIndex });
    });

    it('clamps at right boundary', () => {
        const state = stateWith({ cursorIndex: 3 }); // line has 3 items → max is 3
        const next = moveCursor(state, 'right');
        approve('move_cursor_clamp_right', { cursorIndex: next.cursorIndex });
    });

    it('does nothing when not in playing status', () => {
        const state = stateWith({ status: 'revealing', cursorIndex: 0 });
        const next = moveCursor(state, 'right');
        approve('move_cursor_wrong_status', { cursorIndex: next.cursorIndex, status: next.status });
    });
});

// ─── isTheLinePlacementCorrect ──────────────────────────────────────────────────────

describe('isTheLinePlacementCorrect', () => {
    const line = makePlacedEvents([10, 50, 100]);

    it('accepts correct placement between events', () => {
        const event = {
            id: 'T1',
            title: 'T',
            sorting_category: 'Weight',
            funfact: '',
            display_value: '30',
            unit: 'kg',
            sorting_value: 30,
        };
        approve('placement_correct_between', { result: isTheLinePlacementCorrect(event, 1, line) });
    });

    it('rejects incorrect placement', () => {
        const event = {
            id: 'T1',
            title: 'T',
            sorting_category: 'Weight',
            funfact: '',
            display_value: '30',
            unit: 'kg',
            sorting_value: 30,
        };
        approve('placement_incorrect', { result: isTheLinePlacementCorrect(event, 0, line) });
    });

    it('accepts placement at start for smallest value', () => {
        const event = {
            id: 'T1',
            title: 'T',
            sorting_category: 'Weight',
            funfact: '',
            display_value: '5',
            unit: 'kg',
            sorting_value: 5,
        };
        approve('placement_correct_start', { result: isTheLinePlacementCorrect(event, 0, line) });
    });

    it('accepts placement at end for largest value', () => {
        const event = {
            id: 'T1',
            title: 'T',
            sorting_category: 'Weight',
            funfact: '',
            display_value: '200',
            unit: 'kg',
            sorting_value: 200,
        };
        approve('placement_correct_end', {
            result: isTheLinePlacementCorrect(event, line.length, line),
        });
    });
});

// ─── findTheLineCorrectPosition ────────────────────────────────────────────────────

describe('findTheLineCorrectPosition', () => {
    const line = makePlacedEvents([10, 50, 100]);

    it('finds position at start', () => {
        const event = {
            id: 'T',
            title: 'T',
            sorting_category: 'Weight',
            funfact: '',
            display_value: '5',
            unit: 'kg',
            sorting_value: 5,
        };
        approve('find_position_start', { position: findTheLineCorrectPosition(event, line) });
    });

    it('finds position in middle', () => {
        const event = {
            id: 'T',
            title: 'T',
            sorting_category: 'Weight',
            funfact: '',
            display_value: '30',
            unit: 'kg',
            sorting_value: 30,
        };
        approve('find_position_middle', { position: findTheLineCorrectPosition(event, line) });
    });

    it('finds position at end', () => {
        const event = {
            id: 'T',
            title: 'T',
            sorting_category: 'Weight',
            funfact: '',
            display_value: '200',
            unit: 'kg',
            sorting_value: 200,
        };
        approve('find_position_end', { position: findTheLineCorrectPosition(event, line) });
    });
});

// ─── placeTheLineCard ───────────────────────────────────────────────────────────────

describe('placeTheLineCard', () => {
    it('correct placement — awards point, sets revealing', () => {
        // sorting_value 30 between 10 and 50 at index 1 = correct
        const state = stateWith({ cursorIndex: 1 });
        const next = placeTheLineCard(state);
        approve('place_card_correct', {
            status: next.status,
            score: next.scores['player1'],
            lineLength: next.line.length,
            lastAction: next.last_action?.result,
            placedCorrect: next.line.find((e) => e.id === 'A1')?.wasCorrect,
        });
    });

    it('incorrect placement — no point, card at correct position', () => {
        // sorting_value 30 at index 0 (before 10) = wrong
        const state = stateWith({ cursorIndex: 0 });
        const next = placeTheLineCard(state);
        const insertedIdx = next.line.findIndex((e) => e.id === 'A1');
        approve('place_card_incorrect', {
            status: next.status,
            score: next.scores['player1'],
            lineLength: next.line.length,
            lastAction: next.last_action?.result,
            placedCorrect: next.line.find((e) => e.id === 'A1')?.wasCorrect,
            insertedAtIndex: insertedIdx,
        });
    });

    it('does nothing when not in playing status', () => {
        const state = stateWith({ status: 'revealing' });
        const next = placeTheLineCard(state);
        approve('place_card_wrong_status', { status: next.status, lineLength: next.line.length });
    });
});

// ─── nextTurn ────────────────────────────────────────────────────────────────

describe('nextTurn', () => {
    it('advances to next player and deals card', () => {
        const state = stateWith({ status: 'revealing' });
        const next = nextTurn(state);
        approve('next_turn_advance', {
            activePlayerId: next.activePlayerId,
            status: next.status,
            hasActiveEvent: next.activeEvent !== null,
            roundIndex: next.roundIndex,
            deckLength: next.deck.length,
        });
    });

    it('increments round when wrapping back to first player', () => {
        const state = stateWith({ status: 'revealing', activePlayerId: 'player3', roundIndex: 2 });
        const next = nextTurn(state);
        approve('next_turn_round_increment', {
            activePlayerId: next.activePlayerId,
            roundIndex: next.roundIndex,
        });
    });

    it('triggers finished when round limit exceeded', () => {
        const state = stateWith({
            status: 'revealing',
            activePlayerId: 'player3',
            roundIndex: 5,
            roundLimit: 5,
        });
        const next = nextTurn(state);
        approve('next_turn_game_over', { status: next.status });
    });

    it('triggers finished when deck is empty', () => {
        const state = stateWith({ status: 'revealing', deck: [] });
        const next = nextTurn(state);
        approve('next_turn_deck_empty', { status: next.status });
    });

    it('does nothing when not in revealing status', () => {
        const state = stateWith({ status: 'playing' });
        const next = nextTurn(state);
        approve('next_turn_wrong_status', { status: next.status });
    });
});

// ─── getTheLineNextPlayerId ─────────────────────────────────────────────────────────

describe('getTheLineNextPlayerId', () => {
    it('returns next player in sequence', () => {
        approve('next_player_mid', { next: getTheLineNextPlayerId(PLAYERS, 'player1') });
    });

    it('wraps around to first after last', () => {
        approve('next_player_wrap', { next: getTheLineNextPlayerId(PLAYERS, 'player3') });
    });

    it('handles single player', () => {
        approve('next_player_single', { next: getTheLineNextPlayerId(['only'], 'only') });
    });

    it('handles unknown player (returns index 0)', () => {
        approve('next_player_unknown', { next: getTheLineNextPlayerId(PLAYERS, 'nobody') });
    });
});

// ─── applyTheLineMessage ────────────────────────────────────────────────────

describe('applyTheLineMessage', () => {
    it('move_cursor delegates correctly', () => {
        const state = stateWith({ cursorIndex: 0 });
        const next = applyTheLineMessage(state, { type: 'move_cursor', direction: 'right' });
        approve('apply_move_cursor', { cursorIndex: next.cursorIndex });
    });

    it('place_card delegates correctly', () => {
        const state = stateWith({ cursorIndex: 1 });
        const next = applyTheLineMessage(state, { type: 'place_card' });
        approve('apply_place_card', { status: next.status, lastAction: next.last_action?.result });
    });

    it('next_turn is a no-op when not revealing', () => {
        const state = stateWith({ status: 'playing' });
        const next = applyTheLineMessage(state, { type: 'next_turn' });
        approve('apply_next_turn_noop', { status: next.status });
    });

    it('play_again resets to setup but keeps usedCardIds and playQueue', () => {
        const state = stateWith({
            status: 'finished',
            usedCardIds: ['W01', 'W02', 'W03'],
            scores: { player1: 3, player2: 1, player3: 2 },
        });
        const next = applyTheLineMessage(state, { type: 'play_again' });
        approve('apply_play_again', {
            status: next.status,
            lineLength: next.line.length,
            deckLength: next.deck.length,
            scores: next.scores,
            usedCardIds: next.usedCardIds,
            playQueue: next.playQueue,
            selectedCategory: next.selectedCategory,
            roundLimit: next.roundLimit,
        });
    });
});

// ─── createInitialTheLineState — no-repeat ────────────────────────────────────

describe('createInitialTheLineState — no-repeat', () => {
    it('excludes previously used cards from new pool', () => {
        const first = createInitialTheLineState('Weight', 3, PLAYERS);
        // Use only the first 5 IDs (leaves 45 available, well above the 2-card threshold)
        const usedIds = first.usedCardIds.slice(0, 5);
        const second = createInitialTheLineState('Weight', 3, PLAYERS, usedIds);
        // None of the 5 marked-used IDs should appear in the second game's dealt pool
        const secondDealtIds = [
            second.line[0]?.id,
            second.activeEvent?.id,
            ...second.deck.map((e) => e.id),
        ].filter(Boolean) as string[];
        const overlap = secondDealtIds.filter((id) => usedIds.includes(id));
        approve('no_repeat_cards', { overlapCount: overlap.length });
    });
});
