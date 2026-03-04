// Demo game logic

import { DemoGameState, DemoGameMessage } from './types';

/**
 * Create initial demo game state
 */
export function createInitialDemoState(): DemoGameState {
    return {
        counter: 0,
    };
}

/**
 * Apply a message to the demo game state
 */
export function applyDemoMessage(
    state: DemoGameState,
    message: DemoGameMessage
): DemoGameState {
    switch (message.type) {
        case 'increment':
            return { ...state, counter: state.counter + 1 };
        case 'decrement':
            return { ...state, counter: state.counter - 1 };
        default:
            return state;
    }
}
