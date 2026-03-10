import { describe, it, beforeAll } from 'vitest';
import * as approvals from 'approvals';
import path from 'path';
import {
    createInitialMindshotState,
    applyMindshotMessage,
} from '../logic';
import { computeZoneUpdate } from '../zone';
import { resolveRound } from '../resolution';
import type {
    MindshotGameState,
    MindshotPlayer,
    CellState,
    PlayerActions,
} from '../types';
import { ARENA_CONFIGS, DEFAULT_ACTIONS, START_HP } from '../types';

const APPROVED_DIR = path.join(__dirname);

beforeAll(() => {
    approvals.configure({ reporters: ['nodediff'] } as any);
});

function approve(testName: string, content: unknown) {
    approvals.verifyAsJSON(APPROVED_DIR, testName, content, {});
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PLAYER_IDS = ['p1', 'p2'];

function makePlayer(
    id: string,
    row: number,
    col: number,
    overrides: Partial<MindshotPlayer> = {}
): MindshotPlayer {
    return {
        id,
        name: id,
        color: id === 'p1' ? 'blue' : 'green',
        position: { row, col },
        hp: START_HP,
        maxHp: START_HP,
        status: 'alive',
        actions: null,
        lockedIn: false,
        stats: { damageDealt: 0, damageTaken: 0, roundsSurvived: 0, eliminations: 0 },
        ...overrides,
    };
}

function makeGrid(size: number, fill: CellState = 'safe'): CellState[][] {
    return Array.from({ length: size }, () =>
        Array.from({ length: size }, () => fill)
    );
}

function makeState(overrides: Partial<MindshotGameState> = {}): MindshotGameState {
    const arena = ARENA_CONFIGS['medium'];
    return {
        phase: 'planning',
        round: 1,
        arena,
        grid: makeGrid(arena.boardSize),
        players: {
            p1: makePlayer('p1', 3, 3),
            p2: makePlayer('p2', 7, 7),
        },
        planningDuration: 20,
        planningTimer: 20,
        roundEvents: [],
        placements: [],
        winner: null,
        resolutionSteps: [],
        currentStep: 0,
        ...overrides,
    };
}

// ─── createInitialMindshotState ──────────────────────────────────────────

describe('createInitialMindshotState', () => {
    it('creates correct shape', () => {
        const state = createInitialMindshotState(PLAYER_IDS);
        approve('initial_shape', {
            phase: state.phase,
            round: state.round,
            playerCount: Object.keys(state.players).length,
            gridSize: state.grid.length,
            arenaSize: state.arena.size,
            planningDuration: state.planningDuration,
            winner: state.winner,
        });
    });

    it('all players start with correct HP', () => {
        const state = createInitialMindshotState(PLAYER_IDS);
        const hps = Object.values(state.players).map((p) => p.hp);
        approve('initial_hp', { hps, expected: START_HP });
    });

    it('all players start alive with no actions', () => {
        const state = createInitialMindshotState(PLAYER_IDS);
        const statuses = Object.values(state.players).map((p) => ({
            status: p.status,
            actionsNull: p.actions === null,
            lockedIn: p.lockedIn,
        }));
        approve('initial_statuses', { statuses });
    });

    it('all cells start safe', () => {
        const state = createInitialMindshotState(PLAYER_IDS);
        const allSafe = state.grid.every((row) => row.every((c) => c === 'safe'));
        approve('initial_grid_safe', { allSafe });
    });

    it('respects arena size setting', () => {
        const small = createInitialMindshotState(PLAYER_IDS, 'small');
        const large = createInitialMindshotState(PLAYER_IDS, 'large');
        approve('initial_arena_sizes', {
            small: { boardSize: small.arena.boardSize, shrinkCount: small.arena.shrinkCount },
            large: { boardSize: large.arena.boardSize, shrinkCount: large.arena.shrinkCount },
        });
    });
});

// ─── start_game ──────────────────────────────────────────────────────────────

describe('applyMindshotMessage: start_game', () => {
    it('transitions from lobby to planning', () => {
        const state = makeState({ phase: 'lobby', round: 0 });
        const next = applyMindshotMessage(state, {
            type: 'start_game',
            arenaSize: 'medium',
            planningDuration: 20,
        });
        approve('start_game_phase', { phase: next.phase, round: next.round });
    });

    it('is a no-op if not in lobby', () => {
        const state = makeState({ phase: 'planning' });
        const next = applyMindshotMessage(state, {
            type: 'start_game',
            arenaSize: 'medium',
            planningDuration: 20,
        });
        approve('start_game_noop', { phase: next.phase });
    });
});

// ─── submit_actions ──────────────────────────────────────────────────────────

describe('applyMindshotMessage: submit_actions', () => {
    const ACTIONS: PlayerActions = { move1: 'right', move2: 'up', shoot: 'left' };

    it('stores actions and marks player locked in', () => {
        const state = makeState();
        const next = applyMindshotMessage(
            state,
            { type: 'submit_actions', actions: ACTIONS },
            'p1'
        );
        approve('submit_actions_stored', {
            p1LockedIn: next.players['p1'].lockedIn,
            p1HasActions: next.players['p1'].actions !== null,
            p2LockedIn: next.players['p2'].lockedIn,
            phase: next.phase,
        });
    });

    it('starts resolution when all alive players submit', () => {
        let state = makeState();
        state = applyMindshotMessage(
            state,
            { type: 'submit_actions', actions: ACTIONS },
            'p1'
        );
        state = applyMindshotMessage(
            state,
            { type: 'submit_actions', actions: ACTIONS },
            'p2'
        );
        approve('submit_all_resolves', {
            phase: state.phase,
            hasSteps: state.resolutionSteps.length > 0,
        });
    });

    it('ignores eliminated player', () => {
        const state = makeState({
            players: {
                p1: makePlayer('p1', 3, 3, { status: 'eliminated', hp: 0 }),
                p2: makePlayer('p2', 7, 7),
            },
        });
        const next = applyMindshotMessage(
            state,
            { type: 'submit_actions', actions: ACTIONS },
            'p1'
        );
        approve('submit_eliminated_noop', {
            p1ActionsNull: next.players['p1'].actions === null,
        });
    });
});

// ─── unlock_actions ──────────────────────────────────────────────────────────

describe('applyMindshotMessage: unlock_actions', () => {
    it('unlocks a locked-in player', () => {
        let state = makeState();
        state = applyMindshotMessage(
            state,
            { type: 'submit_actions', actions: { move1: 'up', move2: 'down', shoot: 'left' } },
            'p1'
        );
        const unlocked = applyMindshotMessage(
            state,
            { type: 'unlock_actions' },
            'p1'
        );
        approve('unlock_actions', {
            lockedInBefore: state.players['p1'].lockedIn,
            lockedInAfter: unlocked.players['p1'].lockedIn,
        });
    });
});

// ─── end_planning ────────────────────────────────────────────────────────────

describe('applyMindshotMessage: end_planning', () => {
    it('defaults missing actions and starts resolution', () => {
        const state = makeState();
        const next = applyMindshotMessage(state, { type: 'end_planning' });
        approve('end_planning_defaults', {
            phase: next.phase,
            p1Actions: next.players['p1'].actions,
            p2Actions: next.players['p2'].actions,
            hasSteps: next.resolutionSteps.length > 0,
        });
    });

    it('preserves submitted actions', () => {
        const actions: PlayerActions = { move1: 'right', move2: 'up', shoot: 'left' };
        let state = makeState();
        state = applyMindshotMessage(
            state,
            { type: 'submit_actions', actions },
            'p1'
        );
        const next = applyMindshotMessage(state, { type: 'end_planning' });
        approve('end_planning_preserves', {
            p1Move1: next.players['p1'].actions?.move1,
            p2Move1: next.players['p2'].actions?.move1,
        });
    });
});

// ─── advance_phase ───────────────────────────────────────────────────────────

describe('applyMindshotMessage: advance_phase', () => {
    it('advances through resolution steps', () => {
        let state = makeState();
        state = applyMindshotMessage(state, { type: 'end_planning' });
        const firstPhase = state.phase;
        state = applyMindshotMessage(state, { type: 'advance_phase' });
        approve('advance_phase', {
            firstPhase,
            secondPhase: state.phase,
            currentStep: state.currentStep,
        });
    });

    it('transitions to next round after all steps', () => {
        let state = makeState();
        state = applyMindshotMessage(state, { type: 'end_planning' });
        for (let i = 0; i < state.resolutionSteps.length; i++) {
            state = applyMindshotMessage(state, { type: 'advance_phase' });
        }
        approve('advance_to_next_round', {
            phase: state.phase,
            round: state.round,
        });
    });

    it('is a no-op in planning phase', () => {
        const state = makeState({ phase: 'planning' });
        const next = applyMindshotMessage(state, { type: 'advance_phase' });
        approve('advance_noop', { phase: next.phase });
    });
});

// ─── Movement ────────────────────────────────────────────────────────────────

describe('movement rules', () => {
    it('moves player in the chosen direction', () => {
        const state = makeState({
            players: {
                p1: makePlayer('p1', 5, 5, {
                    actions: { move1: 'right', move2: 'up', shoot: 'skip' },
                    lockedIn: true,
                }),
                p2: makePlayer('p2', 0, 0, {
                    actions: { move1: 'stay', move2: 'stay', shoot: 'skip' },
                    lockedIn: true,
                }),
            },
        });
        const { steps } = resolveRound(state);
        const afterMove1 = steps[0];
        const afterMove2 = steps[1];
        approve('move_direction', {
            p1AfterMove1: afterMove1.players['p1'].position,
            p1AfterMove2: afterMove2.players['p1'].position,
        });
    });

    it('clamps movement at grid edge', () => {
        const state = makeState({
            players: {
                p1: makePlayer('p1', 0, 0, {
                    actions: { move1: 'up', move2: 'left', shoot: 'skip' },
                    lockedIn: true,
                }),
                p2: makePlayer('p2', 5, 5, {
                    actions: { move1: 'stay', move2: 'stay', shoot: 'skip' },
                    lockedIn: true,
                }),
            },
        });
        const { steps } = resolveRound(state);
        approve('move_edge_clamp', {
            p1AfterMove1: steps[0].players['p1'].position,
            p1AfterMove2: steps[1].players['p1'].position,
        });
    });
});

// ─── Shooting ────────────────────────────────────────────────────────────────

describe('shooting rules', () => {
    it('hits player in line of sight', () => {
        const state = makeState({
            players: {
                p1: makePlayer('p1', 5, 3, {
                    actions: { move1: 'stay', move2: 'stay', shoot: 'right' },
                    lockedIn: true,
                }),
                p2: makePlayer('p2', 5, 7, {
                    actions: { move1: 'stay', move2: 'stay', shoot: 'skip' },
                    lockedIn: true,
                }),
            },
        });
        const { steps } = resolveRound(state);
        const shootStep = steps[2];
        const shootEvents = shootStep.events.filter((e) => e.type === 'shoot');
        approve('shoot_hit', {
            p1Shot: shootEvents.find((e) => e.type === 'shoot' && e.playerId === 'p1'),
            p2Hp: shootStep.players['p2'].hp,
        });
    });

    it('misses when no player in path', () => {
        const state = makeState({
            players: {
                p1: makePlayer('p1', 5, 3, {
                    actions: { move1: 'stay', move2: 'stay', shoot: 'up' },
                    lockedIn: true,
                }),
                p2: makePlayer('p2', 5, 7, {
                    actions: { move1: 'stay', move2: 'stay', shoot: 'up' },
                    lockedIn: true,
                }),
            },
        });
        const { steps } = resolveRound(state);
        const shootStep = steps[2];
        const shootEvents = shootStep.events.filter(
            (e) => e.type === 'shoot' && e.playerId === 'p1'
        );
        approve('shoot_miss', {
            p1Shot: shootEvents[0],
        });
    });

    it('mutual shots both deal damage', () => {
        const state = makeState({
            players: {
                p1: makePlayer('p1', 5, 3, {
                    actions: { move1: 'stay', move2: 'stay', shoot: 'right' },
                    lockedIn: true,
                }),
                p2: makePlayer('p2', 5, 7, {
                    actions: { move1: 'stay', move2: 'stay', shoot: 'left' },
                    lockedIn: true,
                }),
            },
        });
        const { steps } = resolveRound(state);
        const shootStep = steps[2];
        approve('shoot_mutual', {
            p1Hp: shootStep.players['p1'].hp,
            p2Hp: shootStep.players['p2'].hp,
            bothHit: shootStep.players['p1'].hp < 3 && shootStep.players['p2'].hp < 3,
        });
    });
});

// ─── Zone ────────────────────────────────────────────────────────────────────

describe('zone shrink', () => {
    it('promotes warning to danger and adds new warnings', () => {
        const grid = makeGrid(10);
        grid[0][0] = 'warning';
        grid[0][1] = 'warning';
        const { newGrid, warningCells, activatedCells } = computeZoneUpdate(grid, 9);
        approve('zone_update', {
            activatedCount: activatedCells.length,
            warningCount: warningCells.length,
            cell00: newGrid[0][0],
            cell01: newGrid[0][1],
        });
    });

    it('handles empty grid (all safe)', () => {
        const grid = makeGrid(10);
        const { warningCells } = computeZoneUpdate(grid, 9);
        approve('zone_empty_grid', {
            warningCount: warningCells.length,
        });
    });
});

// ─── Elimination ─────────────────────────────────────────────────────────────

describe('elimination', () => {
    it('eliminates player at 0 HP', () => {
        const state = makeState({
            players: {
                p1: makePlayer('p1', 5, 3, {
                    hp: 1,
                    actions: { move1: 'stay', move2: 'stay', shoot: 'skip' },
                    lockedIn: true,
                }),
                p2: makePlayer('p2', 5, 7, {
                    actions: { move1: 'stay', move2: 'stay', shoot: 'left' },
                    lockedIn: true,
                }),
            },
        });
        const { finalPlayers } = resolveRound(state);
        approve('elimination_at_zero', {
            p1Status: finalPlayers['p1'].status,
            p1Hp: finalPlayers['p1'].hp,
        });
    });

    it('declares winner when one player remains', () => {
        const state = makeState({
            players: {
                p1: makePlayer('p1', 5, 3, {
                    hp: 1,
                    actions: { move1: 'stay', move2: 'stay', shoot: 'skip' },
                    lockedIn: true,
                }),
                p2: makePlayer('p2', 5, 7, {
                    actions: { move1: 'stay', move2: 'stay', shoot: 'left' },
                    lockedIn: true,
                }),
            },
        });
        const { winner } = resolveRound(state);
        approve('winner_declared', { winner });
    });

    it('declares draw on mutual elimination', () => {
        const state = makeState({
            players: {
                p1: makePlayer('p1', 5, 3, {
                    hp: 1,
                    actions: { move1: 'stay', move2: 'stay', shoot: 'right' },
                    lockedIn: true,
                }),
                p2: makePlayer('p2', 5, 7, {
                    hp: 1,
                    actions: { move1: 'stay', move2: 'stay', shoot: 'left' },
                    lockedIn: true,
                }),
            },
        });
        const { winner, finalPlayers } = resolveRound(state);
        approve('draw_mutual_elimination', {
            winner,
            p1Status: finalPlayers['p1'].status,
            p2Status: finalPlayers['p2'].status,
        });
    });
});

// ─── play_again ──────────────────────────────────────────────────────────────

describe('applyMindshotMessage: play_again', () => {
    it('resets to lobby with same players', () => {
        const state = makeState({ phase: 'game-over', winner: 'p1' });
        const next = applyMindshotMessage(state, { type: 'play_again' });
        approve('play_again_reset', {
            phase: next.phase,
            round: next.round,
            playerCount: Object.keys(next.players).length,
            winner: next.winner,
            allSafe: next.grid.every((row) => row.every((c) => c === 'safe')),
        });
    });
});
