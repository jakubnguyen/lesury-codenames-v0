import { sendGAEvent } from '@next/third-parties/google';

export const trackRoomCreated = (roomId: string) => {
    sendGAEvent('event', 'room_created', { room_id: roomId });
};

export const trackPlayerJoined = (roomId: string, playerName: string) => {
    sendGAEvent('event', 'player_joined', { room_id: roomId, player_name: playerName });
};

export const trackGameStarted = (gameName: string, playerCount: number) => {
    sendGAEvent('event', 'game_started', { game_name: gameName, player_count: playerCount });
};

export const trackGameCompleted = (gameName: string, durationSeconds: number) => {
    sendGAEvent('event', 'game_completed', { game_name: gameName, duration_seconds: durationSeconds });
};

export const trackGameAborted = (gameName: string, durationSeconds: number) => {
    sendGAEvent('event', 'game_aborted', { game_name: gameName, duration_seconds: durationSeconds });
};

export const trackJoinError = (roomCode: string, step: string) => {
    sendGAEvent('event', 'join_error', { room_id: roomCode, error_step: step });
};
