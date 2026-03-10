// Shared TypeScript interfaces for game state and props
// All game definitions must use these base types

/**
 * Base player state that all games must extend
 */
export interface BasePlayer {
    id: string;
    name: string;
    isHost: boolean;
}

/**
 * Base game state that all games must extend
 */
export interface BaseGameState {
    players: Record<string, BasePlayer>;
    phase: string;
}

/**
 * Room configuration
 */
export interface RoomConfig {
    roomCode: string;
    maxPlayers: number;
    gameType: string;
}
