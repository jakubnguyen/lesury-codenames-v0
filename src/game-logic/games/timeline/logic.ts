/**
 * Timeline Game Logic
 * Core gameplay mechanics: placement, validation, scoring
 */

import type { TimelineGameState, TimelineMessage, PlacedEvent, TimelineEvent, GameMode } from './types';
import { getStartingEvent, getRandomEvent, timelineEvents } from './events';

/**
 * Create initial game state
 */
export function createInitialTimelineState(mode: GameMode = 'coop', cardsGoal: number = 20): TimelineGameState {
    const startingEvent = getStartingEvent();

    return {
        mode,
        placedEvents: [{
            ...startingEvent,
            placedBy: 'system',
            wasCorrect: true,
        }],
        activePlayerId: '',
        activeEvent: null,
        proposedPosition: 0,
        lives: 3,
        cardsPlaced: 1,  // Starting event counts
        cardsGoal,
        playerScores: {},
        status: 'waiting',
        remainingEvents: timelineEvents.filter(e => e.id !== startingEvent.id),
        usedEventIds: [startingEvent.id],
    };
}

/**
 * Deal a new event to active player
 */
export function dealNextEvent(state: TimelineGameState, playerId: string): TimelineGameState {
    const newEvent = getRandomEvent(state.usedEventIds);

    if (!newEvent) {
        // No more events - game over
        return {
            ...state,
            status: 'gameOver',
            winner: 'team',
        };
    }

    return {
        ...state,
        activePlayerId: playerId,
        activeEvent: newEvent,
        proposedPosition: Math.floor(state.placedEvents.length / 2), // Start in middle
        status: 'placing',
        usedEventIds: [...state.usedEventIds, newEvent.id],
    };
}

/**
 * Move card left or right
 */
export function moveCard(state: TimelineGameState, direction: 'left' | 'right'): TimelineGameState {
    if (state.status !== 'placing') return state;

    const newPosition = direction === 'left'
        ? Math.max(0, state.proposedPosition - 1)
        : Math.min(state.placedEvents.length, state.proposedPosition + 1);

    return {
        ...state,
        proposedPosition: newPosition,
    };
}

/**
 * Check if placement is correct
 */
export function isPlacementCorrect(
    event: TimelineEvent,
    position: number,
    placedEvents: PlacedEvent[]
): boolean {
    // Edge cases
    if (placedEvents.length === 0) return true;
    if (position === 0 && event.year <= placedEvents[0].year) return true;
    if (position === placedEvents.length && event.year >= placedEvents[placedEvents.length - 1].year) return true;

    // Check if year fits between neighbors
    const leftNeighbor = placedEvents[position - 1];
    const rightNeighbor = placedEvents[position];

    if (!leftNeighbor) {
        return event.year <= rightNeighbor.year;
    }
    if (!rightNeighbor) {
        return event.year >= leftNeighbor.year;
    }

    return event.year >= leftNeighbor.year && event.year <= rightNeighbor.year;
}

/**
 * Find correct position for an event
 */
export function findCorrectPosition(event: TimelineEvent, placedEvents: PlacedEvent[]): number {
    // Find correct position based on year
    for (let i = 0; i <= placedEvents.length; i++) {
        if (i === 0 && event.year <= placedEvents[0]?.year) return 0;
        if (i === placedEvents.length) return placedEvents.length;

        const left = placedEvents[i - 1];
        const right = placedEvents[i];

        if (event.year >= left?.year && event.year <= right?.year) {
            return i;
        }
    }

    return placedEvents.length;
}

/**
 * Place card and validate
 */
export function placeCard(state: TimelineGameState): TimelineGameState {
    if (state.status !== 'placing' || !state.activeEvent) return state;

    const isCorrect = isPlacementCorrect(
        state.activeEvent,
        state.proposedPosition,
        state.placedEvents
    );

    const correctPosition = isCorrect
        ? state.proposedPosition
        : findCorrectPosition(state.activeEvent, state.placedEvents);

    const placedEvent: PlacedEvent = {
        ...state.activeEvent,
        placedBy: state.activePlayerId,
        wasCorrect: isCorrect,
    };

    // Insert at correct position
    const newPlacedEvents = [...state.placedEvents];
    newPlacedEvents.splice(correctPosition, 0, placedEvent);

    // Update scoring
    let newLives = state.lives;
    let newPlayerScores = { ...state.playerScores };

    if (state.mode === 'coop') {
        if (!isCorrect) {
            newLives = Math.max(0, state.lives - 1);
        }
    } else {
        // Competitive mode
        if (isCorrect) {
            newPlayerScores[state.activePlayerId] = (newPlayerScores[state.activePlayerId] || 0) + 1;
        }
    }

    // Check win/loss conditions
    let newStatus: TimelineGameState['status'] = 'revealing';
    let winner: string | 'team' | undefined;

    if (state.mode === 'coop') {
        if (newLives === 0) {
            newStatus = 'gameOver';
            winner = undefined; // Loss
        } else if (state.cardsPlaced + 1 >= state.cardsGoal) {
            newStatus = 'gameOver';
            winner = 'team'; // Win
        }
    } else {
        // Competitive - check if all events used
        if (state.usedEventIds.length >= timelineEvents.length - 1) {
            newStatus = 'gameOver';
            // Find winner
            const maxScore = Math.max(...Object.values(newPlayerScores));
            winner = Object.keys(newPlayerScores).find(id => newPlayerScores[id] === maxScore);
        }
    }

    return {
        ...state,
        placedEvents: newPlacedEvents,
        lives: newLives,
        cardsPlaced: state.cardsPlaced + 1,
        playerScores: newPlayerScores,
        status: newStatus,
        winner,
        proposedPosition: correctPosition,
    };
}

/**
 * Get the ID of the next player in turn order.
 * @param playerIds - Ordered list of non-host player IDs
 * @param currentPlayerId - The player who just finished their turn
 * @returns The ID of the next player
 */
export function getNextPlayerId(playerIds: string[], currentPlayerId: string): string {
    if (playerIds.length === 0) return currentPlayerId;
    const currentIndex = playerIds.indexOf(currentPlayerId);
    const nextIndex = (currentIndex + 1) % playerIds.length;
    return playerIds[nextIndex];
}

/**
 * Apply Timeline message to state
 */
export function applyTimelineMessage(state: TimelineGameState, message: TimelineMessage): TimelineGameState {
    switch (message.type) {
        case 'startGame':
            return createInitialTimelineState(message.mode, message.cardsGoal);

        case 'moveCard':
            return moveCard(state, message.direction);

        case 'setPosition':
            if (state.status !== 'placing') return state;
            return {
                ...state,
                proposedPosition: Math.max(0, Math.min(state.placedEvents.length, message.position)),
            };

        case 'placeCard':
            return placeCard(state);

        case 'nextTurn':
            // Logic handled by server (needs to know next player)
            return state;

        case 'sync':
            return message.state;

        default:
            return state;
    }
}
