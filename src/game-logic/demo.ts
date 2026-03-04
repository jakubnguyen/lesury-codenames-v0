// Demo game logic for testing PartyKit + Next.js integration
// This is a simple counter that syncs across all connected clients

/**
 * Demo game state
 */
export interface DemoGameState {
    counter: number;
    connectedPlayers: string[];
}

/**
 * Message types for demo game
 */
export type DemoMessage =
    | { type: 'increment' }
    | { type: 'decrement' }
    | { type: 'sync'; state: DemoGameState };

/**
 * Create initial demo game state
 */
export function createInitialDemoState(): DemoGameState {
    return {
        counter: 0,
        connectedPlayers: [],
    };
}

/**
 * Apply a message to the game state
 */
export function applyDemoMessage(
    state: DemoGameState,
    message: DemoMessage
): DemoGameState {
    switch (message.type) {
        case 'increment':
            return { ...state, counter: state.counter + 1 };
        case 'decrement':
            return { ...state, counter: state.counter - 1 };
        case 'sync':
            return message.state;
        default:
            return state;
    }
}
