'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TimelineGameState } from '@lesury/game-logic';
import { getCategoryIcon, getCategoryLabel, getCategoryColor } from '@lesury/game-logic';
import GameLayout from '@/components/layout/GameLayout';
import ControlPad from './ControlPad';
import ResultOverlay from './ResultOverlay';

interface TimelinePlayerProps {
    state: {
        room: any;
        game: TimelineGameState;
    };
    myPlayerId?: string;
}

export default function TimelinePlayer({ state, myPlayerId = '' }: TimelinePlayerProps) {
    const { room, game } = state;
    const [showResult, setShowResult] = useState(false);
    const [lastResult, setLastResult] = useState<'correct' | 'incorrect'>('correct');

    // Derive playerId: prefer the explicitly passed myPlayerId, fall back to first non-host
    const playerId = myPlayerId || room.players.find((p: any) => !p.isHost)?.id || '';

    // Show result overlay when revealing
    useEffect(() => {
        if (game.status === 'revealing' && game.activeEvent) {
            const placed = game.placedEvents.find((e) => e.id === game.activeEvent?.id);
            if (placed) {
                setLastResult(placed.wasCorrect ? 'correct' : 'incorrect');
                setShowResult(true);
            }
        } else {
            setShowResult(false);
        }
    }, [game.status, game.activeEvent, game.placedEvents]);

    const isMyTurn = game.activePlayerId === playerId;
    const socket = (window as any).__partySocket;

    const handleMove = (direction: 'left' | 'right') => {
        if (!socket || !isMyTurn) return;
        socket.send(JSON.stringify({ type: 'moveCard', direction }));
    };

    const handlePlace = () => {
        if (!socket || !isMyTurn) return;
        socket.send(JSON.stringify({ type: 'placeCard' }));
    };

    // Game Over
    if (game.status === 'gameOver') {
        const isWinner = game.winner === playerId || game.winner === 'team';

        return (
            <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl p-8 text-center max-w-md shadow-xl"
                >
                    <div className="text-6xl mb-4">
                        {isWinner ? '🏆' : game.winner === 'team' ? '🎉' : '😐'}
                    </div>
                    <h2 className="text-2xl font-bold mb-2 text-[#141413]">
                        {game.winner === 'team'
                            ? 'Team Victory!'
                            : game.winner === playerId
                                ? 'You Win!'
                                : 'Game Over'}
                    </h2>
                    {game.mode === 'competitive' && (
                        <p className="text-xl text-[#B0AEA5] mb-4">
                            Your Score: {game.playerScores[playerId] || 0} points
                        </p>
                    )}
                    <button
                        onClick={() => (window.location.href = '/games/timeline')}
                        className="bg-[#D97757] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#CC785C] transition-colors mt-4"
                    >
                        New Game
                    </button>
                </motion.div>
            </div>
        );
    }

    // Waiting for turn
    if (!isMyTurn) {
        return (
            <div className="min-h-screen bg-[#FAF9F5] flex flex-col">
                <GameLayout backUrl="/games/timeline" theme="light" backLabel="← Back">
                    <div className="flex-1 flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center"
                        >
                            <motion.div
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="text-6xl mb-6"
                            >
                                ⏳
                            </motion.div>
                            <p className="text-2xl font-bold mb-2 text-[#141413]">
                                {room.players.find((p: any) => p.id === game.activePlayerId)?.name || 'Another player'} is playing
                            </p>
                            <p className="text-lg text-[#B0AEA5]">Watch the TV!</p>

                            {game.mode === 'competitive' && (
                                <div className="mt-6 bg-white rounded-xl p-4 shadow-md">
                                    <p className="text-sm text-[#B0AEA5]">Your Score</p>
                                    <p className="text-3xl font-bold text-[#141413]">
                                        {game.playerScores[playerId] || 0}
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </GameLayout>

                {/* Result overlay */}
                <ResultOverlay
                    show={showResult}
                    isCorrect={lastResult === 'correct'}
                    onComplete={() => setShowResult(false)}
                />
            </div>
        );
    }

    // Active turn - show event and controls
    if (!game.activeEvent) {
        return (
            <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center">
                <div className="text-xl text-[#B0AEA5]">Loading...</div>
            </div>
        );
    }

    const categoryColor = getCategoryColor(game.activeEvent.category);

    return (
        <div className="min-h-screen bg-[#FAF9F5] flex flex-col">
            {/* Event Info - Top 2/3 */}
            <div className="flex-[2] bg-[#F0EFEA] p-6 flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center max-w-md"
                >
                    {/* Category Badge */}
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <span className="text-4xl">{getCategoryIcon(game.activeEvent.category)}</span>
                        <span
                            className="text-xs font-bold uppercase px-3 py-1 rounded-full"
                            style={{
                                backgroundColor: `${categoryColor}20`,
                                color: categoryColor,
                            }}
                        >
                            {getCategoryLabel(game.activeEvent.category)}
                        </span>
                    </div>

                    {/* Event Title */}
                    <h2 className="text-3xl font-extrabold mb-4 text-[#141413]">
                        {game.activeEvent.title}
                    </h2>

                    {/* Instructions */}
                    <p className="text-lg text-[#B0AEA5]">
                        Place this event in the correct chronological order
                    </p>

                    {/* Position indicator */}
                    <motion.div
                        key={game.proposedPosition}
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        className="mt-6 bg-white rounded-xl p-4 shadow-md"
                    >
                        <p className="text-sm text-[#B0AEA5] mb-1">Position</p>
                        <p className="text-5xl font-bold text-[#D97757] tabular-nums">
                            {game.proposedPosition + 1}
                        </p>
                        <p className="text-xs text-[#B0AEA5] mt-1">
                            of {game.placedEvents.length + 1} slots
                        </p>
                    </motion.div>
                </motion.div>
            </div>

            {/* Control Pad - Bottom 1/3 */}
            <div className="flex-1 bg-[#E8E6DC] flex items-center justify-center">
                <ControlPad
                    onMoveLeft={() => handleMove('left')}
                    onMoveRight={() => handleMove('right')}
                    onPlace={handlePlace}
                    disabled={game.status !== 'placing'}
                />
            </div>

            {/* Result overlay */}
            <ResultOverlay
                show={showResult}
                isCorrect={lastResult === 'correct'}
                onComplete={() => {
                    setShowResult(false);
                    // Active player advances the turn after the reveal animation
                    const s = (window as any).__partySocket;
                    if (s) s.send(JSON.stringify({ type: 'nextTurn' }));
                }}
            />
        </div>
    );
}
