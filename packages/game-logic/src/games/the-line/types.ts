/**
 * The Line Game Types
 * Category-based sorting game where players place events on a line by sorting_value
 */

/**
 * A single event card from the CSV dataset
 */
export interface TheLineEvent {
    id: string; // e.g. "W01", "S12"
    title: string; // "Electron", "Cheetah"
    sorting_category: string; // "Weight", "Speed", etc.
    funfact: string; // Fun fact about the event
    display_value: string; // Human-readable value e.g. "1.00E+00", "120"
    unit: string; // Unit label e.g. "yoctogram", "km/h"
    sorting_value: number; // Numeric value used for ordering
    imageUrl?: string; // Optional path to card image (e.g. "/games/the-line/cards/W01.png")
}

/**
 * An event that has been placed on the line
 */
export interface PlacedTheLineEvent extends TheLineEvent {
    placedBy: string; // Player ID or 'system' for seed card
    wasCorrect: boolean; // Whether the placement was correct
}

/**
 * Result of the last placement action
 */
export interface LastAction {
    result: 'success' | 'fail';
    playerId: string;
    eventId: string;
    funfact: string;
    display_value: string;
    unit: string;
}

/**
 * Full game state for The Line
 */
export interface TheLineGameState {
    // Category & rounds
    selectedCategory: string;
    roundLimit: number;
    roundIndex: number; // 1-based current round

    // The line (always sorted by sorting_value)
    line: PlacedTheLineEvent[];

    // Remaining deck (filtered by selected category)
    deck: TheLineEvent[];

    // Turn management
    playQueue: string[]; // Ordered list of player IDs
    activePlayerId: string;

    // Current card being placed
    activeEvent: TheLineEvent | null;
    cursorIndex: number; // Where the player wants to place (0 = leftmost gap)

    // Scoring
    scores: Record<string, number>;

    // Card pool — no-repeat draw within a session
    usedCardIds: string[];

    // Game flow
    status: 'setup' | 'playing' | 'revealing' | 'finished';
    last_action: LastAction | null;
}

/**
 * Messages the game can receive
 */
export type TheLineMessage =
    | { type: 'start_game'; category: string; roundLimit: number; playerIds: string[] }
    | { type: 'move_cursor'; direction: 'left' | 'right' }
    | { type: 'place_card' }
    | { type: 'next_turn' }
    | { type: 'play_again' };

/** Auto-advance delay in milliseconds after card placement result */
export const AUTO_ADVANCE_DELAY_MS = 3000;
