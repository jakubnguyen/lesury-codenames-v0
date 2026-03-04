/**
 * The Line — Pure Game Logic
 *
 * All game rules, state transitions, scoring, and validation.
 * No side effects, no I/O — pure functions only.
 */

import type {
    TheLineEvent,
    TheLineGameState,
    TheLineMessage,
    PlacedTheLineEvent,
    LastAction,
} from './types';
import { getEventsByCategory, getEventsWithImages } from './data';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Simple deterministic shuffle (Fisher-Yates) using a seed-able approach.
 * For production we just use Math.random.
 */
function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/**
 * Get the ID of the next player in turn order.
 */
export function getTheLineNextPlayerId(playerIds: string[], currentPlayerId: string): string {
    if (playerIds.length === 0) return currentPlayerId;
    const currentIndex = playerIds.indexOf(currentPlayerId);
    const nextIndex = (currentIndex + 1) % playerIds.length;
    return playerIds[nextIndex];
}

// ---------------------------------------------------------------------------
// State creation
// ---------------------------------------------------------------------------

/**
 * Create the initial game state for a given category and round limit.
 *
 * Seeds the line with one random card and prepares the deck.
 */
export function createInitialTheLineState(
    category: string,
    roundLimit: number,
    playerIds: string[],
    previouslyUsedCardIds: string[] = []
): TheLineGameState {
    // Use only events with images; fall back to all category events if none have images
    const eventsWithImages = getEventsWithImages(category);
    const categoryEvents = eventsWithImages.length > 0 ? eventsWithImages : getEventsByCategory(category);

    // Filter out previously used cards (no-repeat within session)
    let availableEvents = categoryEvents.filter(e => !previouslyUsedCardIds.includes(e.id));
    let carriedUsedIds = previouslyUsedCardIds;

    // If pool exhausted (fewer than 2 cards left), reshuffle full pool
    if (availableEvents.length < 2) {
        availableEvents = categoryEvents;
        carriedUsedIds = [];
    }

    const shuffled = shuffle(availableEvents);

    // Seed the line with one card
    const seedCard = shuffled[0];
    const remaining = shuffled.slice(1);

    // Deal first active card
    const activeEvent = remaining[0] ?? null;
    const deck = remaining.slice(1);

    const seedPlaced: PlacedTheLineEvent = {
        ...seedCard,
        placedBy: 'system',
        wasCorrect: true,
    };

    // Initialize scores
    const scores: Record<string, number> = {};
    for (const pid of playerIds) {
        scores[pid] = 0;
    }

    // Track all dealt card IDs for no-repeat
    const usedCardIds = [...carriedUsedIds, ...shuffled.map(e => e.id)];

    return {
        selectedCategory: category,
        roundLimit,
        roundIndex: 1,
        line: [seedPlaced],
        deck,
        playQueue: playerIds,
        activePlayerId: playerIds[0] ?? '',
        activeEvent,
        cursorIndex: 0,
        scores,
        usedCardIds,
        status: 'playing',
        last_action: null,
    };
}

// ---------------------------------------------------------------------------
// Placement logic
// ---------------------------------------------------------------------------

/**
 * Check if placing a card at cursorIndex is correct.
 *
 * cursorIndex represents a gap: 0 = before line[0], 1 = between line[0] and
 * line[1], ..., N = after line[N-1].
 */
export function isTheLinePlacementCorrect(
    card: TheLineEvent,
    cursorIndex: number,
    line: PlacedTheLineEvent[]
): boolean {
    const prevValue = cursorIndex > 0
        ? line[cursorIndex - 1].sorting_value
        : -Infinity;
    const nextValue = cursorIndex < line.length
        ? line[cursorIndex].sorting_value
        : Infinity;

    return prevValue <= card.sorting_value && card.sorting_value <= nextValue;
}

/**
 * Find the correct index to insert a card into the sorted line.
 */
export function findTheLineCorrectPosition(
    card: TheLineEvent,
    line: PlacedTheLineEvent[]
): number {
    for (let i = 0; i < line.length; i++) {
        if (card.sorting_value <= line[i].sorting_value) {
            return i;
        }
    }
    return line.length;
}

// ---------------------------------------------------------------------------
// Move cursor
// ---------------------------------------------------------------------------

export function moveCursor(
    state: TheLineGameState,
    direction: 'left' | 'right'
): TheLineGameState {
    if (state.status !== 'playing') return state;

    // Max cursor = line.length (after the last card)
    const maxIndex = state.line.length;

    const newIndex = direction === 'left'
        ? Math.max(0, state.cursorIndex - 1)
        : Math.min(maxIndex, state.cursorIndex + 1);

    return { ...state, cursorIndex: newIndex };
}

// ---------------------------------------------------------------------------
// Place card
// ---------------------------------------------------------------------------

export function placeTheLineCard(state: TheLineGameState): TheLineGameState {
    if (state.status !== 'playing' || !state.activeEvent) return state;

    const card = state.activeEvent;
    const correct = isTheLinePlacementCorrect(card, state.cursorIndex, state.line);

    const insertIndex = correct
        ? state.cursorIndex
        : findTheLineCorrectPosition(card, state.line);

    const placedEvent: PlacedTheLineEvent = {
        ...card,
        placedBy: state.activePlayerId,
        wasCorrect: correct,
    };

    // Insert into line
    const newLine = [...state.line];
    newLine.splice(insertIndex, 0, placedEvent);

    // Update score
    const newScores = { ...state.scores };
    if (correct) {
        newScores[state.activePlayerId] = (newScores[state.activePlayerId] || 0) + 1;
    }

    // Build last_action
    const last_action: LastAction = {
        result: correct ? 'success' : 'fail',
        playerId: state.activePlayerId,
        eventId: card.id,
        funfact: card.funfact,
        display_value: card.display_value,
        unit: card.unit,
    };

    return {
        ...state,
        line: newLine,
        scores: newScores,
        status: 'revealing',
        last_action,
    };
}

// ---------------------------------------------------------------------------
// Next turn
// ---------------------------------------------------------------------------

/**
 * Advance to next turn: rotate player, deal next card, check game over.
 */
export function nextTurn(state: TheLineGameState): TheLineGameState {
    if (state.status !== 'revealing') return state;

    const nextPlayer = getTheLineNextPlayerId(state.playQueue, state.activePlayerId);

    // Determine if we've gone back to the first player (= round complete)
    const currentIdx = state.playQueue.indexOf(state.activePlayerId);
    const nextIdx = state.playQueue.indexOf(nextPlayer);
    const roundComplete = nextIdx <= currentIdx;

    const newRoundIndex = roundComplete ? state.roundIndex + 1 : state.roundIndex;

    // Check game over: round limit reached
    if (roundComplete && newRoundIndex > state.roundLimit) {
        return {
            ...state,
            status: 'finished',
        };
    }

    // Check game over: no more cards in deck
    if (state.deck.length === 0) {
        return {
            ...state,
            status: 'finished',
        };
    }

    // Deal next card
    const nextEvent = state.deck[0];
    const newDeck = state.deck.slice(1);

    return {
        ...state,
        activePlayerId: nextPlayer,
        activeEvent: nextEvent,
        deck: newDeck,
        cursorIndex: Math.floor(state.line.length / 2), // Start cursor in middle
        roundIndex: newRoundIndex,
        status: 'playing',
        last_action: null,
    };
}

// ---------------------------------------------------------------------------
// Main reducer
// ---------------------------------------------------------------------------

/**
 * Apply a message to the game state. Pure function.
 */
export function applyTheLineMessage(
    state: TheLineGameState,
    message: TheLineMessage
): TheLineGameState {
    switch (message.type) {
        case 'start_game':
            return createInitialTheLineState(
                message.category,
                message.roundLimit,
                message.playerIds
            );

        case 'move_cursor':
            return moveCursor(state, message.direction);

        case 'place_card':
            return placeTheLineCard(state);

        case 'next_turn':
            return nextTurn(state);

        case 'play_again':
            return {
                selectedCategory: state.selectedCategory,
                roundLimit: state.roundLimit,
                roundIndex: 0,
                line: [],
                deck: [],
                playQueue: state.playQueue,
                activePlayerId: '',
                activeEvent: null,
                cursorIndex: 0,
                scores: {},
                usedCardIds: state.usedCardIds,
                status: 'setup',
                last_action: null,
            };

        default:
            return state;
    }
}
