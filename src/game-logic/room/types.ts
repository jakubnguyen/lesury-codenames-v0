// Room management types for multiplayer games

/**
 * Player in a room
 */
export interface Player {
    id: string;
    name: string;
    isHost: boolean;
    joinedAt: number;
    avatar: string; // Emoji avatar for visual identification
}

/**
 * Room state
 */
export interface RoomState {
    roomCode: string;
    hostId: string;
    players: Player[];
    status: 'waiting' | 'starting' | 'playing' | 'ended';
    gameType: string; // 'demo', 'timeline', etc.
}

/**
 * Base room messages
 */
export type RoomMessage =
    | { type: 'join'; playerName: string; gameType?: string; sessionId?: string }
    | { type: 'leave' }
    | { type: 'start' } // Host signals game start
    | { type: 'sync'; state: RoomState }
    | { type: 'kick'; playerId: string }; // Host kicks a player from the lobby
