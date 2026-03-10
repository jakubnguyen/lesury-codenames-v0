'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { CellState, MindshotPlayer, Position } from '@lesury/game-logic';
import { PLAYER_COLOR_HEX } from '@lesury/game-logic';
import PlayerToken from './PlayerToken';

export interface ProjectileData {
    id: string;
    from: Position;
    to: Position;
    color: string;
    hit: boolean;
}

interface GridProps {
    grid: CellState[][];
    players: Record<string, MindshotPlayer>;
    boardSize: number;
    projectiles?: ProjectileData[];
    hitCells?: Position[];
}

const CELL_COLORS: Record<CellState, string> = {
    safe: '#F0EFEA',
    warning: '#F4A261',
    danger: '#E63946',
};

export default function Grid({ grid, players, boardSize, projectiles, hitCells }: GridProps) {
    const cellSize = Math.min(Math.floor(640 / boardSize), 64);
    const gridPx = boardSize * cellSize;

    const hitCellKeys = new Set(
        (hitCells ?? []).map((p) => `${p.row},${p.col}`)
    );

    return (
        <div className="relative" style={{ width: gridPx, height: gridPx }}>
            {/* Grid cells */}
            <div
                className="grid"
                style={{
                    gridTemplateColumns: `repeat(${boardSize}, ${cellSize}px)`,
                    gridTemplateRows: `repeat(${boardSize}, ${cellSize}px)`,
                    gap: 0,
                }}
            >
                {grid.map((row, r) =>
                    row.map((cell, c) => {
                        const isHit = hitCellKeys.has(`${r},${c}`);
                        return (
                            <div
                                key={`${r}-${c}`}
                                className="border border-black/5 transition-colors duration-500"
                                style={{
                                    width: cellSize,
                                    height: cellSize,
                                    backgroundColor: isHit ? '#fff' : CELL_COLORS[cell],
                                    animation: cell === 'warning'
                                        ? 'pulse 2s infinite'
                                        : isHit
                                          ? 'none'
                                          : undefined,
                                    transition: 'background-color 0.15s ease',
                                }}
                            />
                        );
                    })
                )}
            </div>

            {/* Player tokens */}
            {Object.values(players).map((player) => (
                <PlayerToken
                    key={player.id}
                    player={player}
                    cellSize={cellSize}
                />
            ))}

            {/* Projectile animations */}
            <AnimatePresence>
                {(projectiles ?? []).map((proj) => (
                    <motion.div
                        key={proj.id}
                        className="absolute rounded-full pointer-events-none"
                        style={{
                            width: cellSize * 0.3,
                            height: cellSize * 0.3,
                            backgroundColor: proj.color,
                            boxShadow: `0 0 10px ${proj.color}, 0 0 20px ${proj.color}80`,
                            zIndex: 10,
                        }}
                        initial={{
                            top: proj.from.row * cellSize + cellSize / 2 - cellSize * 0.15,
                            left: proj.from.col * cellSize + cellSize / 2 - cellSize * 0.15,
                            opacity: 1,
                            scale: 1,
                        }}
                        animate={{
                            top: proj.to.row * cellSize + cellSize / 2 - cellSize * 0.15,
                            left: proj.to.col * cellSize + cellSize / 2 - cellSize * 0.15,
                            opacity: proj.hit ? 1 : 0.3,
                            scale: proj.hit ? 1.5 : 0.5,
                        }}
                        exit={{ opacity: 0, scale: 0 }}
                        transition={{ duration: 0.35, ease: 'linear' }}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
}
