export type ZoomPhase =
    | 'lobby'
    | 'playing' // Image zooming out, players guessing
    | 'reveal' // Image fully revealed, answer shown
    | 'round_leaderboard' // Scores shown between rounds
    | 'game_over';

export interface ZoomPlayer {
    id: string;
    name: string;
    score: number;
    guessedCorrectly: boolean;
    pointsThisRound: number;
    pointsBase: number; // accumulated over the game
    avatar?: string;
}

export interface ZoomLevel {
    id: string;
    imageUrl: string;
    answers: string[]; // e.g. ["jablko", "apple"]
    funFact: string;
}

export interface ZoomGameState {
    phase: ZoomPhase;
    round: number;
    totalRounds: number;

    // Server-side timestamp for round start (in ms).
    roundStartTime: number | null;

    // All levels for this game (e.g. 10 levels)
    levels: ZoomLevel[];

    players: Record<string, ZoomPlayer>;
    winnerId: string | null;

    // Ordered list of IDs of players who guessed correctly this round
    guessOrder: string[];

    // Host controls paused state
    isPaused: boolean;
    pausedTimeRemaining: number | null; // how many ms were left when paused
}

export type ZoomMessage =
    | { type: 'start_game'; levels: ZoomLevel[] } // Host provides levels to start
    | { type: 'guess'; word: string } // Player makes a guess
    | { type: 'time_up' } // Host or server signals 90s are up
    | { type: 'next_round' } // Host advances to next round
    | { type: 'pause' } // Host pauses zoom
    | { type: 'resume' } // Host resumes zoom
    | { type: 'play_again' };
