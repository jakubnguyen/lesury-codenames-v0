import type {
    ArenaSize,
    MindshotGameState,
    MindshotMessage,
    MindshotPlayer,
    CellState,
    PlayerActions,
    PlayerColor,
    Position,
} from './types';
import {
    ARENA_CONFIGS,
    DEFAULT_ACTIONS,
    MINDSHOT_PLAYER_COLORS,
    START_HP,
} from './types';
import { resolveRound } from './resolution';
import { shuffleArray } from './zone';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function manhattanDistance(a: Position, b: Position): number {
    return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

function createEmptyGrid(boardSize: number): CellState[][] {
    return Array.from({ length: boardSize }, () =>
        Array.from({ length: boardSize }, () => 'safe' as CellState)
    );
}

/**
 * Place players at random positions with minimum Manhattan distance between any two.
 */
function placePlayersRandomly(
    playerIds: string[],
    boardSize: number,
    minDistance: number
): Position[] {
    const allCells: Position[] = [];
    for (let r = 0; r < boardSize; r++) {
        for (let c = 0; c < boardSize; c++) {
            allCells.push({ row: r, col: c });
        }
    }

    const shuffled = shuffleArray(allCells);
    const positions: Position[] = [];

    for (let i = 0; i < playerIds.length; i++) {
        const pos = shuffled.find((candidate) =>
            positions.every((placed) => manhattanDistance(candidate, placed) >= minDistance)
        );
        positions.push(pos ?? shuffled[i]);
    }

    return positions;
}

// ─── Initial State ───────────────────────────────────────────────────────────

export function createInitialMindshotState(
    playerIds: string[],
    arenaSize: ArenaSize = 'medium',
    planningDuration: 15 | 20 | 30 = 20
): MindshotGameState {
    const arena = ARENA_CONFIGS[arenaSize];
    const grid = createEmptyGrid(arena.boardSize);
    const positions = placePlayersRandomly(
        playerIds,
        arena.boardSize,
        arena.minStartDistance
    );

    const colors = shuffleArray([...MINDSHOT_PLAYER_COLORS]);
    const players: Record<string, MindshotPlayer> = {};

    playerIds.forEach((id, i) => {
        players[id] = {
            id,
            name: '',
            color: colors[i % colors.length] as PlayerColor,
            position: positions[i],
            hp: START_HP,
            maxHp: START_HP,
            status: 'alive',
            actions: null,
            lockedIn: false,
            stats: {
                damageDealt: 0,
                damageTaken: 0,
                roundsSurvived: 0,
                eliminations: 0,
            },
        };
    });

    return {
        phase: 'lobby',
        round: 0,
        arena,
        grid,
        players,
        planningDuration,
        planningTimer: planningDuration,
        roundEvents: [],
        placements: [],
        winner: null,
        resolutionSteps: [],
        currentStep: 0,
    };
}

// ─── Main Reducer ────────────────────────────────────────────────────────────

export function applyMindshotMessage(
    state: MindshotGameState,
    msg: MindshotMessage,
    senderId?: string,
    activePlayerIds?: string[]
): MindshotGameState {
    switch (msg.type) {
        case 'start_game': {
            if (state.phase !== 'lobby') return state;
            const arena = ARENA_CONFIGS[msg.arenaSize];
            const playerIds = Object.keys(state.players);
            const grid = createEmptyGrid(arena.boardSize);
            const positions = placePlayersRandomly(
                playerIds,
                arena.boardSize,
                arena.minStartDistance
            );

            const colors = shuffleArray([...MINDSHOT_PLAYER_COLORS]);
            const players: Record<string, MindshotPlayer> = {};

            playerIds.forEach((id, i) => {
                const existing = state.players[id];
                players[id] = {
                    ...existing,
                    color: colors[i % colors.length] as PlayerColor,
                    position: positions[i],
                    hp: START_HP,
                    maxHp: START_HP,
                    status: 'alive',
                    actions: null,
                    lockedIn: false,
                    stats: {
                        damageDealt: 0,
                        damageTaken: 0,
                        roundsSurvived: 0,
                        eliminations: 0,
                    },
                };
            });

            return {
                ...state,
                phase: 'planning',
                round: 1,
                arena,
                grid,
                players,
                planningDuration: msg.planningDuration,
                planningTimer: msg.planningDuration,
                roundEvents: [],
                placements: [],
                winner: null,
                resolutionSteps: [],
                currentStep: 0,
            };
        }

        case 'submit_actions': {
            if (state.phase !== 'planning' || !senderId) return state;
            const player = state.players[senderId];
            if (!player || player.status !== 'alive') return state;

            const players = {
                ...state.players,
                [senderId]: {
                    ...player,
                    actions: msg.actions,
                    lockedIn: true,
                },
            };

            // Check if all alive players are locked in
            const alivePlayers = Object.values(players).filter(
                (p) => p.status === 'alive' && (!activePlayerIds || activePlayerIds.includes(p.id))
            );
            const allLockedIn = alivePlayers.length > 0 && alivePlayers.every((p) => p.lockedIn);

            if (allLockedIn) {
                return startResolution({ ...state, players });
            }

            return { ...state, players };
        }

        case 'unlock_actions': {
            if (state.phase !== 'planning' || !senderId) return state;
            const player = state.players[senderId];
            if (!player || player.status !== 'alive') return state;

            return {
                ...state,
                players: {
                    ...state.players,
                    [senderId]: {
                        ...player,
                        lockedIn: false,
                    },
                },
            };
        }

        case 'end_planning': {
            if (state.phase !== 'planning') return state;

            const players = { ...state.players };

            for (const player of Object.values(players)) {
                if (player.status !== 'alive') continue;

                // Default missing actions for players who didn't submit
                if (!player.actions) {
                    players[player.id] = {
                        ...player,
                        actions: { ...DEFAULT_ACTIONS },
                        lockedIn: true,
                    };
                } else if (!player.lockedIn) {
                    players[player.id] = {
                        ...player,
                        lockedIn: true,
                    };
                }
            }

            return startResolution({ ...state, players });
        }

        case 'advance_phase': {
            if (!state.phase.startsWith('resolution-') && state.phase !== 'round-summary') {
                return state;
            }

            const nextStep = state.currentStep + 1;
            if (nextStep >= state.resolutionSteps.length) {
                return startNextRound(state);
            }

            const step = state.resolutionSteps[nextStep];
            return {
                ...state,
                phase: step.phase,
                players: step.players,
                grid: step.grid,
                roundEvents: [...state.roundEvents, ...step.events],
                currentStep: nextStep,
            };
        }

        case 'play_again': {
            const playerIds = Object.keys(state.players);
            return createInitialMindshotState(
                playerIds,
                state.arena.size,
                state.planningDuration
            );
        }

        default:
            return state;
    }
}

// ─── Internal Helpers ────────────────────────────────────────────────────────

function startResolution(state: MindshotGameState): MindshotGameState {
    const { steps, placements, winner } = resolveRound(state);

    if (steps.length === 0) return state;

    const firstStep = steps[0];
    return {
        ...state,
        phase: firstStep.phase,
        players: firstStep.players,
        grid: firstStep.grid,
        roundEvents: firstStep.events,
        resolutionSteps: steps,
        currentStep: 0,
        winner,
        placements,
    };
}

function startNextRound(state: MindshotGameState): MindshotGameState {
    const survivors = Object.values(state.players).filter(
        (p) => p.status === 'alive'
    );

    if (survivors.length <= 1 || state.winner !== null) {
        return { ...state, phase: 'game-over' };
    }

    // Reset actions for next round
    const players: Record<string, MindshotPlayer> = {};
    for (const [id, player] of Object.entries(state.players)) {
        players[id] = {
            ...player,
            actions: null,
            lockedIn: false,
        };
    }

    return {
        ...state,
        phase: 'planning',
        round: state.round + 1,
        players,
        planningTimer: state.planningDuration,
        roundEvents: [],
        resolutionSteps: [],
        currentStep: 0,
    };
}
