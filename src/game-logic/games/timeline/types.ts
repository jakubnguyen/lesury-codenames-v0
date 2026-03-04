/**
 * Timeline Game Types
 * Chronological event placement game - MVP Structure
 */

/**
 * Visual categories for MVP Timeline game
 */
export type EventCategory =
    | 'Science'
    | 'Tragedy'
    | 'War'
    | 'Economy'
    | 'Tech'
    | 'Space'
    | 'Politics';

/**
 * Timeline event with year-based ordering
 */
export interface TimelineEvent {
    id: number;           // 1-20
    title: string;        // "Moon Landing (Apollo 11)"
    year: number;         // 1969
    category: EventCategory;
    imageUrl: string;     // Path to event image
}

export interface PlacedEvent extends TimelineEvent {
    placedBy: string;     // Player ID
    wasCorrect: boolean;  // Was placement correct?
}

export type GameMode = 'coop' | 'competitive';

export interface TimelineGameState {
    mode: GameMode;

    // Timeline (always sorted by year)
    placedEvents: PlacedEvent[];

    // Current turn
    activePlayerId: string;
    activeEvent: TimelineEvent | null;
    proposedPosition: number;  // Index where player wants to place (0 = leftmost)

    // Co-op scoring
    lives: number;             // Hearts remaining
    cardsPlaced: number;       // Successfully placed
    cardsGoal: number;         // Win condition

    // Competitive scoring
    playerScores: Record<string, number>;

    // Game flow
    status: 'waiting' | 'placing' | 'revealing' | 'nextTurn' | 'gameOver';
    winner?: string | 'team';

    // Event deck
    remainingEvents: TimelineEvent[];
    usedEventIds: number[];    // Changed from string[] to number[]
}

export type TimelineMessage =
    | { type: 'startGame'; mode: GameMode; cardsGoal?: number }
    | { type: 'moveCard'; direction: 'left' | 'right' }
    | { type: 'setPosition'; position: number }
    | { type: 'placeCard' }
    | { type: 'nextTurn' }
    | { type: 'sync'; state: TimelineGameState };

