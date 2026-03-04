// Demo game types

/**
 * Demo game state (counter only)
 */
export interface DemoGameState {
    counter: number;
}

/**
 * Demo game messages
 */
export type DemoGameMessage =
    | { type: 'increment' }
    | { type: 'decrement' };
