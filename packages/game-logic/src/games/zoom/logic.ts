import { ZoomGameState, ZoomMessage, ZoomPlayer } from './types';

// Constants
export const ZOOM_ROUND_DURATION_MS = 90 * 1000; // 90 seconds
export const ZOOM_BASE_SCORE = 1000;
export const ZOOM_MIN_SCORE = 100;
export const ZOOM_SCORE_PENALTY_PER_SEC = 10;
export const ZOOM_RANK_BONUSES = [150, 100, 50]; // 1st, 2nd, 3rd

export function createInitialZoomState(playerIds: string[]): ZoomGameState {
    const players: Record<string, ZoomPlayer> = {};
    playerIds.forEach((id) => {
        players[id] = {
            id,
            name: '', // will be filled by front-end lookup or room state
            score: 0,
            guessedCorrectly: false,
            pointsThisRound: 0,
            pointsBase: 0,
        };
    });

    return {
        phase: 'lobby',
        round: 0,
        totalRounds: 0,
        roundStartTime: null,
        levels: [],
        players,
        winnerId: null,
        guessOrder: [],
        isPaused: false,
        pausedTimeRemaining: null,
    };
}

// Ensure string matches (case insensitive + trim)
function isCorrectGuess(guess: string, answers: string[]): boolean {
    const cleanedGuess = guess.trim().toLowerCase();
    return answers.some((ans) => ans.trim().toLowerCase() === cleanedGuess);
}

function calculateScore(
    startTime: number,
    guessTime: number,
    rankIndex: number // 0 for 1st, 1 for 2nd, etc.
): number {
    const elapsedSeconds = Math.max(0, Math.floor((guessTime - startTime) / 1000));
    const baseScore = Math.max(ZOOM_MIN_SCORE, ZOOM_BASE_SCORE - elapsedSeconds * ZOOM_SCORE_PENALTY_PER_SEC);
    const bonus = ZOOM_RANK_BONUSES[rankIndex] || 0;
    return baseScore + bonus;
}

export function applyZoomMessage(
    state: ZoomGameState,
    msg: ZoomMessage,
    senderId: string,
    activePlayerIds?: string[]
): ZoomGameState {
    switch (msg.type) {
        case 'start_game': {
            if (state.phase !== 'lobby') return state;

            // Re-initialize players to handle any late joiners or disconnects
            const players = { ...state.players };
            if (activePlayerIds) {
                // Ensure all active players are in state
                activePlayerIds.forEach(id => {
                    if (!players[id]) {
                        players[id] = {
                            id,
                            name: '',
                            score: 0,
                            guessedCorrectly: false,
                            pointsThisRound: 0,
                            pointsBase: 0,
                        };
                    }
                });
                // Optional: remove players not in activePlayerIds
            }

            return {
                ...state,
                phase: 'playing',
                round: 1,
                totalRounds: msg.levels.length,
                levels: msg.levels,
                players,
                roundStartTime: Date.now(),
                guessOrder: [],
            };
        }

        case 'guess': {
            if (state.phase !== 'playing' || state.isPaused) return state;

            const player = state.players[senderId];
            if (!player || player.guessedCorrectly) return state;

            const level = state.levels[state.round - 1];
            if (!level) return state;

            if (isCorrectGuess(msg.word, level.answers)) {
                const now = Date.now();
                const rankIndex = state.guessOrder.length;
                const points = calculateScore(state.roundStartTime || now, now, rankIndex);

                const updatedPlayer: ZoomPlayer = {
                    ...player,
                    guessedCorrectly: true,
                    pointsThisRound: points,
                    score: player.score + points,
                };

                const newGuessOrder = [...state.guessOrder, senderId];
                const newPlayers = { ...state.players, [senderId]: updatedPlayer };

                // Check if all active players guessed
                const activeCount = activePlayerIds
                    ? activePlayerIds.length
                    : Object.keys(newPlayers).length;

                const expectedGuesses = activePlayerIds
                    ? activePlayerIds.filter(id => newPlayers[id]).length
                    : Object.keys(newPlayers).length;

                // Auto-transition to reveal if everyone guessed
                if (newGuessOrder.length >= expectedGuesses && expectedGuesses > 0) {
                    return {
                        ...state,
                        players: newPlayers,
                        guessOrder: newGuessOrder,
                        phase: 'reveal',
                    };
                }

                return {
                    ...state,
                    players: newPlayers,
                    guessOrder: newGuessOrder,
                };
            }
            // Wrong guess -> silent ignore (frontend handles local shake)
            return state;
        }

        case 'time_up': {
            if (state.phase !== 'playing') return state;
            return {
                ...state,
                phase: 'reveal',
            };
        }

        case 'next_round': {
            if (state.phase === 'reveal') {
                return {
                    ...state,
                    phase: 'round_leaderboard',
                };
            }

            if (state.phase === 'round_leaderboard') {
                if (state.round >= state.totalRounds) {
                    // Game Over! Determine winner
                    const winnerId = Object.values(state.players).reduce(
                        (best: ZoomPlayer | null, p) => (!best || p.score > best.score ? p : best),
                        null
                    )?.id;

                    return { ...state, phase: 'game_over', winnerId: winnerId || null };
                }

                // Reset for next round
                const nextRound = state.round + 1;
                const players = { ...state.players };
                Object.keys(players).forEach(id => {
                    players[id] = {
                        ...players[id],
                        guessedCorrectly: false,
                        pointsThisRound: 0,
                    };
                });

                return {
                    ...state,
                    phase: 'playing',
                    round: nextRound,
                    players,
                    roundStartTime: Date.now(),
                    guessOrder: [],
                };
            }
            return state;
        }

        case 'pause': {
            if (state.phase !== 'playing' || state.isPaused || !state.roundStartTime) return state;
            const elapsed = Date.now() - state.roundStartTime;
            const remaining = Math.max(0, ZOOM_ROUND_DURATION_MS - elapsed);
            return {
                ...state,
                isPaused: true,
                pausedTimeRemaining: remaining,
            };
        }

        case 'resume': {
            if (state.phase !== 'playing' || !state.isPaused || state.pausedTimeRemaining === null) return state;
            const newStartTime = Date.now() - (ZOOM_ROUND_DURATION_MS - state.pausedTimeRemaining);
            return {
                ...state,
                isPaused: false,
                roundStartTime: newStartTime,
                pausedTimeRemaining: null,
            };
        }

        case 'play_again': {
            return createInitialZoomState(Object.keys(state.players));
        }

        default:
            return state;
    }
}
