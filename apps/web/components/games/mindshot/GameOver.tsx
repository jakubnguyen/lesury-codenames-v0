'use client';

import { motion } from 'framer-motion';
import type { MindshotGameState, RoomState } from '@lesury/game-logic';
import { PLAYER_COLOR_HEX } from '@lesury/game-logic';
import LeadCaptureForm from '@/components/LeadCaptureForm';

interface GameOverProps {
    state: {
        room: RoomState;
        game: MindshotGameState;
    };
    onPlayAgain: () => void;
}

export default function GameOver({ state, onPlayAgain }: GameOverProps) {
    const { room, game } = state;
    const winner = game.winner
        ? room.players.find((p) => p.id === game.winner)
        : null;

    // Build ranked list from placements
    const ranked = game.placements.map((id, i) => {
        const player = game.players[id];
        const roomPlayer = room.players.find((p) => p.id === id);
        return {
            id,
            name: roomPlayer?.name ?? player?.name ?? id,
            color: player?.color ?? 'blue',
            placement: i + 1,
            stats: player?.stats ?? { damageDealt: 0, damageTaken: 0, roundsSurvived: 0, eliminations: 0 },
        };
    });

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card rounded-xl shadow-2xl p-12 text-center max-w-2xl w-full"
            >
                {/* Trophy / Draw icon */}
                <div className="text-7xl mb-4">{winner ? '🏆' : '💥'}</div>

                {/* Winner headline */}
                <h1 className="text-4xl font-bold mb-2 text-foreground">
                    {winner ? `${winner.name} Wins!` : 'Draw!'}
                </h1>

                {/* Subtitle */}
                <p className="text-muted-foreground mb-8">
                    {winner ? 'Last one standing' : 'No survivors'}
                </p>

                {/* Stats table */}
                {ranked.length > 0 && (
                    <div className="bg-secondary rounded-xl overflow-hidden mb-8">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border text-muted-foreground">
                                    <th className="py-2 px-3 text-left">#</th>
                                    <th className="py-2 px-3 text-left">Player</th>
                                    <th className="py-2 px-3 text-center">Rounds</th>
                                    <th className="py-2 px-3 text-center">Dmg</th>
                                    <th className="py-2 px-3 text-center">Elims</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ranked.map((p, idx) => (
                                    <motion.tr
                                        key={p.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className={`border-b border-border/50 last:border-0 ${idx === 0 ? 'bg-accent text-accent-foreground' : ''}`}
                                    >
                                        <td className="py-3 px-3 font-bold">
                                            {p.placement === 1 ? '🥇' : p.placement === 2 ? '🥈' : p.placement === 3 ? '🥉' : `${p.placement}th`}
                                        </td>
                                        <td className="py-3 px-3">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                                    style={{ backgroundColor: PLAYER_COLOR_HEX[p.color] }}
                                                />
                                                <span className="font-bold">{p.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-3 text-center tabular-nums">
                                            {p.stats.roundsSurvived}
                                        </td>
                                        <td className="py-3 px-3 text-center tabular-nums">
                                            {p.stats.damageDealt}
                                        </td>
                                        <td className="py-3 px-3 text-center tabular-nums">
                                            {p.stats.eliminations}
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Lead capture */}
                <div className="mb-6">
                    <LeadCaptureForm />
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                    <button
                        onClick={onPlayAgain}
                        className="flex-1 bg-accent text-accent-foreground px-8 py-4 rounded-xl text-lg font-bold hover:opacity-90 transition-opacity shadow-lg"
                    >
                        Play Again
                    </button>
                    <button
                        onClick={() => (window.location.href = '/games/mindshot')}
                        className="flex-1 bg-secondary text-secondary-foreground px-8 py-4 rounded-xl text-lg font-bold hover:opacity-80 transition-opacity shadow-lg"
                    >
                        Home
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
