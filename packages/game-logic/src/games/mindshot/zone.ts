import type { CellState, Position } from './types';

/**
 * Compute the "distance to nearest edge or danger cell" for a safe cell.
 * Lower distance = more "outer". The outermost safe cells get converted first.
 */
function distanceToEdgeOrDanger(
    row: number,
    col: number,
    boardSize: number,
    grid: CellState[][]
): number {
    const distToEdge = Math.min(row, col, boardSize - 1 - row, boardSize - 1 - col);

    let distToDanger = Infinity;
    const deltas = [
        [-1, 0], [1, 0], [0, -1], [0, 1],
        [-1, -1], [-1, 1], [1, -1], [1, 1],
    ];
    for (const [dr, dc] of deltas) {
        let r = row + dr;
        let c = col + dc;
        if (r >= 0 && r < boardSize && c >= 0 && c < boardSize) {
            if (grid[r][c] === 'danger') {
                distToDanger = 1;
                break;
            }
        }
    }

    return Math.min(distToEdge, distToDanger);
}

/**
 * Compute the zone update for one round:
 * 1. Promote all 'warning' cells to 'danger'
 * 2. Pick `shrinkCount` new cells from the outermost ring of safe cells and mark them 'warning'
 *
 * Returns: { newGrid, warningCells, activatedCells }
 */
export function computeZoneUpdate(
    grid: CellState[][],
    shrinkCount: number
): {
    newGrid: CellState[][];
    warningCells: Position[];
    activatedCells: Position[];
} {
    const boardSize = grid.length;
    const newGrid: CellState[][] = grid.map((row) => [...row]);

    // Step 1: Activate all warning cells → danger
    const activatedCells: Position[] = [];
    for (let r = 0; r < boardSize; r++) {
        for (let c = 0; c < boardSize; c++) {
            if (newGrid[r][c] === 'warning') {
                newGrid[r][c] = 'danger';
                activatedCells.push({ row: r, col: c });
            }
        }
    }

    // Step 2: Collect all safe cells with their distance to edge/danger
    const safeCells: { pos: Position; dist: number }[] = [];
    for (let r = 0; r < boardSize; r++) {
        for (let c = 0; c < boardSize; c++) {
            if (newGrid[r][c] === 'safe') {
                safeCells.push({
                    pos: { row: r, col: c },
                    dist: distanceToEdgeOrDanger(r, c, boardSize, newGrid),
                });
            }
        }
    }

    if (safeCells.length === 0) {
        return { newGrid, warningCells: [], activatedCells };
    }

    // Sort by distance ascending (outermost first)
    safeCells.sort((a, b) => a.dist - b.dist);

    // Pick cells from the outermost ring first, then inward
    const toConvert = Math.min(shrinkCount, safeCells.length);
    const warningCells: Position[] = [];

    // Group by distance ring
    let ringStart = 0;
    let remaining = toConvert;

    while (remaining > 0 && ringStart < safeCells.length) {
        const currentDist = safeCells[ringStart].dist;
        let ringEnd = ringStart;
        while (ringEnd < safeCells.length && safeCells[ringEnd].dist === currentDist) {
            ringEnd++;
        }

        const ringCells = safeCells.slice(ringStart, ringEnd);

        if (ringCells.length <= remaining) {
            for (const cell of ringCells) {
                warningCells.push(cell.pos);
            }
            remaining -= ringCells.length;
        } else {
            // Randomly pick from this ring
            const shuffled = shuffleArray(ringCells);
            for (let i = 0; i < remaining; i++) {
                warningCells.push(shuffled[i].pos);
            }
            remaining = 0;
        }

        ringStart = ringEnd;
    }

    // Apply warning to grid
    for (const pos of warningCells) {
        newGrid[pos.row][pos.col] = 'warning';
    }

    return { newGrid, warningCells, activatedCells };
}

export function shuffleArray<T>(arr: T[]): T[] {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}
