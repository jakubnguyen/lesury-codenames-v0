'use client';

import type { MindshotPlayer, RoomState } from '@lesury/game-logic';
import { PLAYER_COLOR_HEX } from '@lesury/game-logic';

interface PlayerHUDProps {
    players: Record<string, MindshotPlayer>;
    roomPlayers: RoomState['players'];
    showReady?: boolean;
}

export default function PlayerHUD({ players, roomPlayers, showReady }: PlayerHUDProps) {
    const gamePlayers = Object.values(players);

    return (
        <div className="flex gap-4 flex-wrap justify-center px-4">
            {gamePlayers.map((player) => {
                const roomPlayer = roomPlayers.find((p) => p.id === player.id);
                const color = PLAYER_COLOR_HEX[player.color];
                const isEliminated = player.status === 'eliminated';
                const displayName = roomPlayer?.name ?? player.name ?? player.id.slice(0, 6);

                return (
                    <div
                        key={player.id}
                        className="flex items-center gap-2 bg-[#333] px-3 py-2 rounded-xl"
                        style={{ opacity: isEliminated ? 0.4 : 1 }}
                    >
                        <div
                            className="w-4 h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: color }}
                        />
                        <span className="text-white/90 text-sm font-medium max-w-[80px] truncate">
                            {displayName}
                        </span>
                        <div className="flex gap-0.5">
                            {Array.from({ length: player.maxHp }, (_, i) => (
                                <span
                                    key={i}
                                    className="text-xs"
                                    style={{
                                        color: i < player.hp ? '#E63946' : 'rgba(255,255,255,0.15)',
                                    }}
                                >
                                    &#9829;
                                </span>
                            ))}
                        </div>
                        {showReady && player.status === 'alive' && (
                            <span className="text-xs">
                                {player.lockedIn ? (
                                    <span className="text-green-400">&#10003;</span>
                                ) : (
                                    <span className="text-white/30">...</span>
                                )}
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
