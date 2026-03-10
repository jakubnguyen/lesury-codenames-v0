import type {
    MindshotGameState,
    MindshotPlayer,
    CellState,
    Direction,
    Position,
    ResolutionStep,
    RoundEvent,
} from './types';
import { DEFAULT_ACTIONS } from './types';
import { computeZoneUpdate } from './zone';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DIRECTION_DELTAS: Record<Direction, { dr: number; dc: number }> = {
    up: { dr: -1, dc: 0 },
    down: { dr: 1, dc: 0 },
    left: { dr: 0, dc: -1 },
    right: { dr: 0, dc: 1 },
};

function posKey(pos: Position): string {
    return `${pos.row},${pos.col}`;
}

function clonePlayers(
    players: Record<string, MindshotPlayer>
): Record<string, MindshotPlayer> {
    return JSON.parse(JSON.stringify(players));
}

function cloneGrid(grid: CellState[][]): CellState[][] {
    return grid.map((row) => [...row]);
}

function applyMove(
    pos: Position,
    dir: Direction | 'stay',
    boardSize: number
): Position {
    if (dir === 'stay') return pos;
    const delta = DIRECTION_DELTAS[dir];
    const newRow = pos.row + delta.dr;
    const newCol = pos.col + delta.dc;
    if (newRow < 0 || newRow >= boardSize || newCol < 0 || newCol >= boardSize) {
        return pos;
    }
    return { row: newRow, col: newCol };
}

// ─── Main Resolution ─────────────────────────────────────────────────────────

/**
 * Resolve an entire round into sequential ResolutionSteps.
 * Each step contains the state snapshot after that phase and the events that occurred.
 */
export function resolveRound(state: MindshotGameState): {
    steps: ResolutionStep[];
    finalPlayers: Record<string, MindshotPlayer>;
    finalGrid: CellState[][];
    allEvents: RoundEvent[];
    placements: string[];
    winner: string | null;
} {
    const boardSize = state.arena.boardSize;
    let players = clonePlayers(state.players);
    let grid = cloneGrid(state.grid);
    const steps: ResolutionStep[] = [];
    const allEvents: RoundEvent[] = [];
    let placements = [...state.placements];

    // Fill in default actions for players who didn't submit
    for (const p of Object.values(players)) {
        if (p.status === 'alive' && !p.actions) {
            players[p.id] = { ...p, actions: { ...DEFAULT_ACTIONS } };
        }
    }

    const alivePlayers = () => Object.values(players).filter((p) => p.status === 'alive');

    // ── Move 1 ───────────────────────────────────────────────────────────────
    const move1Events: RoundEvent[] = [];
    for (const player of alivePlayers()) {
        const actions = player.actions!;
        const from = { ...player.position };
        const to = applyMove(player.position, actions.move1, boardSize);
        players[player.id] = { ...players[player.id], position: to };
        move1Events.push({
            type: 'move',
            playerId: player.id,
            direction: actions.move1,
            phase: 'move1',
            from,
            to,
        });
    }
    allEvents.push(...move1Events);
    steps.push({
        phase: 'resolution-move1',
        players: clonePlayers(players),
        grid: cloneGrid(grid),
        events: move1Events,
    });

    // ── Move 2 ───────────────────────────────────────────────────────────────
    const move2Events: RoundEvent[] = [];
    for (const player of alivePlayers()) {
        const actions = players[player.id].actions!;
        const from = { ...players[player.id].position };
        const to = applyMove(players[player.id].position, actions.move2, boardSize);
        players[player.id] = { ...players[player.id], position: to };
        move2Events.push({
            type: 'move',
            playerId: player.id,
            direction: actions.move2,
            phase: 'move2',
            from,
            to,
        });
    }
    allEvents.push(...move2Events);
    steps.push({
        phase: 'resolution-move2',
        players: clonePlayers(players),
        grid: cloneGrid(grid),
        events: move2Events,
    });

    // ── Shoot ────────────────────────────────────────────────────────────────
    const shootEvents: RoundEvent[] = [];
    const damageFromShots: Record<string, number> = {};

    // Build position map for hit detection (post-movement positions)
    const positionMap = new Map<string, string[]>();
    for (const player of alivePlayers()) {
        const key = posKey(players[player.id].position);
        if (!positionMap.has(key)) positionMap.set(key, []);
        positionMap.get(key)!.push(player.id);
    }

    for (const player of alivePlayers()) {
        const actions = players[player.id].actions!;
        if (actions.shoot === 'skip') {
            shootEvents.push({
                type: 'shoot',
                playerId: player.id,
                direction: 'skip',
                hit: null,
            });
            continue;
        }

        const dir = actions.shoot;
        const delta = DIRECTION_DELTAS[dir];
        let hitPlayerId: string | null = null;

        // Trace projectile from player position
        let r = players[player.id].position.row;
        let c = players[player.id].position.col;

        for (let step = 0; step < boardSize; step++) {
            r += delta.dr;
            c += delta.dc;
            if (r < 0 || r >= boardSize || c < 0 || c >= boardSize) break;

            const key = posKey({ row: r, col: c });
            const occupants = positionMap.get(key);
            if (occupants) {
                const target = occupants.find((id) => id !== player.id);
                if (target) {
                    hitPlayerId = target;
                    break;
                }
            }
        }

        if (hitPlayerId) {
            damageFromShots[hitPlayerId] = (damageFromShots[hitPlayerId] ?? 0) + 1;
        }

        shootEvents.push({
            type: 'shoot',
            playerId: player.id,
            direction: dir,
            hit: hitPlayerId,
        });
    }

    // Apply shot damage simultaneously
    for (const [targetId, dmg] of Object.entries(damageFromShots)) {
        const target = players[targetId];
        const newHp = Math.max(0, target.hp - dmg);
        players[targetId] = {
            ...target,
            hp: newHp,
            stats: {
                ...target.stats,
                damageTaken: target.stats.damageTaken + dmg,
            },
        };
        shootEvents.push({
            type: 'damage',
            playerId: targetId,
            source: 'projectile',
            amount: dmg,
            newHp,
        });

        // Credit damage dealt to shooters
        for (const evt of shootEvents) {
            if (evt.type === 'shoot' && evt.hit === targetId) {
                const shooter = players[evt.playerId];
                players[evt.playerId] = {
                    ...shooter,
                    stats: {
                        ...shooter.stats,
                        damageDealt: shooter.stats.damageDealt + 1,
                    },
                };
            }
        }
    }

    allEvents.push(...shootEvents);
    steps.push({
        phase: 'resolution-shoot',
        players: clonePlayers(players),
        grid: cloneGrid(grid),
        events: shootEvents,
    });

    // ── Zone ─────────────────────────────────────────────────────────────────
    const zoneEvents: RoundEvent[] = [];
    const { newGrid, warningCells, activatedCells } = computeZoneUpdate(
        grid,
        state.arena.shrinkCount
    );
    grid = newGrid;

    if (activatedCells.length > 0) {
        zoneEvents.push({ type: 'zone-activate', cells: activatedCells });
    }
    if (warningCells.length > 0) {
        zoneEvents.push({ type: 'zone-warning', cells: warningCells });
    }

    // Zone damage
    for (const player of alivePlayers()) {
        const pos = players[player.id].position;
        if (grid[pos.row][pos.col] === 'danger') {
            const p = players[player.id];
            const newHp = Math.max(0, p.hp - 1);
            players[player.id] = {
                ...p,
                hp: newHp,
                stats: {
                    ...p.stats,
                    damageTaken: p.stats.damageTaken + 1,
                },
            };
            zoneEvents.push({
                type: 'damage',
                playerId: player.id,
                source: 'zone',
                amount: 1,
                newHp,
            });
        }
    }

    allEvents.push(...zoneEvents);
    steps.push({
        phase: 'resolution-zone',
        players: clonePlayers(players),
        grid: cloneGrid(grid),
        events: zoneEvents,
    });

    // ── Elimination & Win Check ──────────────────────────────────────────────
    const summaryEvents: RoundEvent[] = [];
    const newlyEliminated: string[] = [];

    for (const player of alivePlayers()) {
        if (players[player.id].hp <= 0) {
            players[player.id] = {
                ...players[player.id],
                status: 'eliminated',
            };
            newlyEliminated.push(player.id);
        }
    }

    // Update rounds survived for all alive players
    for (const player of Object.values(players)) {
        if (player.status === 'alive') {
            players[player.id] = {
                ...player,
                stats: {
                    ...player.stats,
                    roundsSurvived: player.stats.roundsSurvived + 1,
                },
            };
        }
    }

    // Track eliminations caused by shooters
    for (const elimId of newlyEliminated) {
        for (const evt of shootEvents) {
            if (evt.type === 'shoot' && evt.hit === elimId) {
                const shooter = players[evt.playerId];
                if (shooter) {
                    players[evt.playerId] = {
                        ...shooter,
                        stats: {
                            ...shooter.stats,
                            eliminations: shooter.stats.eliminations + 1,
                        },
                    };
                }
            }
        }
    }

    // Placements: eliminated players get placed (last eliminated = worst placement)
    for (const elimId of newlyEliminated) {
        placements.unshift(elimId);
        const placement = Object.keys(players).length - placements.length + 1;
        summaryEvents.push({
            type: 'elimination',
            playerId: elimId,
            placement,
        });
    }

    // Win check
    const survivors = Object.values(players).filter((p) => p.status === 'alive');
    let winner: string | null = null;
    if (survivors.length === 1) {
        winner = survivors[0].id;
        placements.unshift(winner);
    } else if (survivors.length === 0) {
        winner = null; // draw
    }

    allEvents.push(...summaryEvents);
    steps.push({
        phase: 'round-summary',
        players: clonePlayers(players),
        grid: cloneGrid(grid),
        events: summaryEvents,
    });

    return {
        steps,
        finalPlayers: players,
        finalGrid: grid,
        allEvents,
        placements,
        winner,
    };
}
