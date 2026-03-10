// ─── Primitives ──────────────────────────────────────────────────────────────

export type Direction = 'up' | 'down' | 'left' | 'right';

export type CellState = 'safe' | 'warning' | 'danger';

export type ArenaSize = 'small' | 'medium' | 'large';

export type PlayerColor = 'blue' | 'green' | 'purple' | 'yellow';

export interface Position {
    row: number;
    col: number;
}

// ─── Arena ───────────────────────────────────────────────────────────────────

export interface ArenaConfig {
    size: ArenaSize;
    boardSize: 8 | 10 | 12;
    shrinkCount: 6 | 9 | 13;
    minStartDistance: 2 | 3 | 4;
}

export const ARENA_CONFIGS: Record<ArenaSize, ArenaConfig> = {
    small: { size: 'small', boardSize: 8, shrinkCount: 6, minStartDistance: 2 },
    medium: { size: 'medium', boardSize: 10, shrinkCount: 9, minStartDistance: 3 },
    large: { size: 'large', boardSize: 12, shrinkCount: 13, minStartDistance: 4 },
};

// ─── Player ──────────────────────────────────────────────────────────────────

export interface PlayerActions {
    move1: Direction | 'stay';
    move2: Direction | 'stay';
    shoot: Direction | 'skip';
}

export const DEFAULT_ACTIONS: PlayerActions = {
    move1: 'stay',
    move2: 'stay',
    shoot: 'skip',
};

export interface PlayerStats {
    damageDealt: number;
    damageTaken: number;
    roundsSurvived: number;
    eliminations: number;
}

export interface MindshotPlayer {
    id: string;
    name: string;
    color: PlayerColor;
    position: Position;
    hp: number;
    maxHp: number;
    status: 'alive' | 'eliminated';
    actions: PlayerActions | null;
    lockedIn: boolean;
    stats: PlayerStats;
}

// ─── Game Phase ──────────────────────────────────────────────────────────────

export type Phase =
    | 'lobby'
    | 'planning'
    | 'resolution-move1'
    | 'resolution-move2'
    | 'resolution-shoot'
    | 'resolution-zone'
    | 'round-summary'
    | 'game-over';

// ─── Round Events ────────────────────────────────────────────────────────────

export type RoundEvent =
    | { type: 'move'; playerId: string; direction: Direction | 'stay'; phase: 'move1' | 'move2'; from: Position; to: Position }
    | { type: 'shoot'; playerId: string; direction: Direction | 'skip'; hit: string | null }
    | { type: 'damage'; playerId: string; source: 'projectile' | 'zone'; amount: number; newHp: number }
    | { type: 'elimination'; playerId: string; placement: number }
    | { type: 'zone-warning'; cells: Position[] }
    | { type: 'zone-activate'; cells: Position[] };

// ─── Resolution Steps ────────────────────────────────────────────────────────

export interface ResolutionStep {
    phase: 'resolution-move1' | 'resolution-move2' | 'resolution-shoot' | 'resolution-zone' | 'round-summary';
    players: Record<string, MindshotPlayer>;
    grid: CellState[][];
    events: RoundEvent[];
}

// ─── Game State ──────────────────────────────────────────────────────────────

export interface MindshotGameState {
    phase: Phase;
    round: number;
    arena: ArenaConfig;
    grid: CellState[][];
    players: Record<string, MindshotPlayer>;
    planningDuration: 15 | 20 | 30;
    planningTimer: number;
    roundEvents: RoundEvent[];
    placements: string[];
    winner: string | null;
    resolutionSteps: ResolutionStep[];
    currentStep: number;
}

// ─── Player Colors ───────────────────────────────────────────────────────────

export const MINDSHOT_PLAYER_COLORS: PlayerColor[] = ['blue', 'green', 'purple', 'yellow'];

export const PLAYER_COLOR_HEX: Record<PlayerColor, string> = {
    blue: '#3B82F6',
    green: '#22C55E',
    purple: '#A855F7',
    yellow: '#EAB308',
};

export const START_HP = 3;

// ─── Messages ────────────────────────────────────────────────────────────────

export type MindshotMessage =
    | { type: 'start_game'; arenaSize: ArenaSize; planningDuration: 15 | 20 | 30 }
    | { type: 'submit_actions'; actions: PlayerActions }
    | { type: 'unlock_actions' }
    | { type: 'end_planning' }
    | { type: 'advance_phase' }
    | { type: 'play_again' };
