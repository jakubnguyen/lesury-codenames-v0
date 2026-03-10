'use client';

import { motion } from 'framer-motion';
import type { MindshotPlayer } from '@lesury/game-logic';
import { PLAYER_COLOR_HEX } from '@lesury/game-logic';

interface PlayerTokenProps {
    player: MindshotPlayer;
    cellSize: number;
}

export default function PlayerToken({ player, cellSize }: PlayerTokenProps) {
    const color = PLAYER_COLOR_HEX[player.color];
    const isEliminated = player.status === 'eliminated';
    const tokenSize = cellSize * 0.7;
    const initial = player.name?.[0]?.toUpperCase() ?? '?';

    return (
        <motion.div
            className="absolute flex items-center justify-center rounded-full"
            style={{
                width: tokenSize,
                height: tokenSize,
                backgroundColor: isEliminated ? '#888' : color,
                opacity: isEliminated ? 0.3 : 1,
                boxShadow: isEliminated ? 'none' : `0 2px 8px ${color}60`,
                zIndex: isEliminated ? 1 : 2,
            }}
            animate={{
                top: player.position.row * cellSize + (cellSize - tokenSize) / 2,
                left: player.position.col * cellSize + (cellSize - tokenSize) / 2,
            }}
            transition={{
                duration: 0.5,
                ease: [0.34, 1.56, 0.64, 1],
            }}
        >
            <span
                className="font-bold select-none"
                style={{
                    fontSize: tokenSize * 0.45,
                    color: 'white',
                    lineHeight: 1,
                }}
            >
                {isEliminated ? '\u2715' : initial}
            </span>

            {/* HP pips below token */}
            {!isEliminated && (
                <div
                    className="absolute flex gap-0.5"
                    style={{ bottom: -tokenSize * 0.35 }}
                >
                    {Array.from({ length: player.maxHp }, (_, i) => (
                        <span
                            key={i}
                            style={{
                                fontSize: tokenSize * 0.28,
                                color: i < player.hp ? '#E63946' : 'rgba(255,255,255,0.2)',
                                lineHeight: 1,
                            }}
                        >
                            &#9829;
                        </span>
                    ))}
                </div>
            )}
        </motion.div>
    );
}
