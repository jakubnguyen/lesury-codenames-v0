'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TimelineGameState, PlacedEvent } from '@lesury/game-logic';
import { formatYear, getCategoryIcon } from '@lesury/game-logic';
import type { RoomState } from '@lesury/game-logic';
import GameLayout from '@/components/layout/GameLayout';
import EventCard from './EventCard';

interface TimelineHostProps {
    state: {
        room: RoomState;
        game: TimelineGameState;
    };
}

export default function TimelineHost({ state }: TimelineHostProps) {
    const { room, game } = state;
    const timelineRef = useRef<HTMLDivElement>(null);

    const playerName = (id: string) =>
        room.players.find((p: { id: string; name: string }) => p.id === id)?.name ?? id;

    // Auto-scroll to keep active slot centered
    useEffect(() => {
        if (game.status === 'placing' && timelineRef.current) {
            // Calculate scroll position to center active slot
            const container = timelineRef.current;
            const activeSlotIndex = game.proposedPosition;
            const cardWidth = 160; // w-40 = 160px
            const slotWidth = game.proposedPosition === activeSlotIndex ? 160 : 8;
            const gap = 12; // gap-3 = 12px

            const scrollPosition = activeSlotIndex * (cardWidth + gap + slotWidth);
            const containerCenter = container.offsetWidth / 2;
            const scrollTo = scrollPosition - containerCenter + cardWidth / 2;

            container.scrollTo({
                left: Math.max(0, scrollTo),
                behavior: 'smooth',
            });
        }
    }, [game.proposedPosition, game.status]);

    // Game Over Screen
    if (game.status === 'gameOver') {
        const winner = game.winner === 'team'
            ? 'Team Victory!'
            : game.winner
                ? `${game.winner} Wins!`
                : 'Game Over';

        return (
            <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl p-12 text-center max-w-2xl shadow-xl"
                >
                    <div className="text-7xl mb-6">🏆</div>
                    <h1 className="text-4xl font-bold mb-4 text-[#141413]">{winner}</h1>

                    {game.mode === 'coop' && (
                        <p className="text-xl text-[#B0AEA5] mb-6">
                            {game.winner
                                ? `You placed ${game.cardsPlaced} cards successfully!`
                                : 'Better luck next time!'}
                        </p>
                    )}

                    {game.mode === 'competitive' && (
                        <div className="space-y-2 mb-6">
                            {Object.entries(game.playerScores)
                                .sort(([, a], [, b]) => b - a)
                                .map(([playerId, score], idx) => (
                                    <div
                                        key={playerId}
                                        className="flex justify-between items-center p-3 bg-[#F0EFEA] rounded-xl"
                                    >
                                        <span className="font-bold">
                                            #{idx + 1} {playerId}
                                        </span>
                                        <span className="font-bold text-[#D97757]">
                                            {score} pts
                                        </span>
                                    </div>
                                ))}
                        </div>
                    )}

                    <button
                        onClick={() => (window.location.href = '/games/timeline')}
                        className="bg-[#D97757] text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-[#CC785C] transition-colors shadow-lg"
                    >
                        Play Again
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <GameLayout backUrl="/games/timeline" theme="light">
            <div className="min-h-screen bg-[#FAF9F5] flex flex-col">
                {/* Header Bar */}
                <div className="bg-[#F0EFEA] border-b border-[#E8E6DC] py-4 px-6">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-[#141413]">Timeline</h1>

                        {/* Player Scores / Status */}
                        <div className="flex gap-3">
                            {game.mode === 'coop' ? (
                                <div className="flex items-center gap-4">
                                    <div className="text-2xl">
                                        {'❤️'.repeat(game.lives)}
                                        {'🤍'.repeat(Math.max(0, 3 - game.lives))}
                                    </div>
                                    <div className="text-lg font-bold text-[#141413]">
                                        {game.cardsPlaced} / {game.cardsGoal} cards
                                    </div>
                                </div>
                            ) : (
                                Object.entries(game.playerScores).map(([playerId, score]) => (
                                    <div
                                        key={playerId}
                                        className={`px-4 py-2 rounded-full font-bold transition-all ${playerId === game.activePlayerId
                                            ? 'bg-[#D97757] text-white shadow-md'
                                            : 'bg-white text-[#141413]'
                                            }`}
                                    >
                                        {playerName(playerId)}: {score}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Timeline Area */}
                <div className="flex-1 py-12 relative">
                    <div
                        ref={timelineRef}
                        className="max-w-7xl mx-auto px-6 overflow-x-auto pb-4 scrollbar-hide"
                        style={{
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                        }}
                    >
                        {/* Timeline horizontal scroll container */}
                        <div className="relative min-w-max">
                            {/* Timeline line */}
                            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#E8E6DC] -translate-y-1/2" />

                            {/* Cards and slots */}
                            <div className="relative z-10 flex items-center gap-3">
                                <AnimatePresence mode="popLayout">
                                    {game.placedEvents.map((event, index) => {
                                        const showActiveHere =
                                            game.status === 'placing' &&
                                            game.activeEvent &&
                                            game.proposedPosition === index;

                                        return (
                                            <div key={`slot-${index}`} className="flex items-center gap-3">
                                                {/* Placement slot before this card */}
                                                {showActiveHere && game.activeEvent && (
                                                    <motion.div
                                                        initial={{ width: 8, opacity: 0 }}
                                                        animate={{ width: 160, opacity: 1 }}
                                                        exit={{ width: 8, opacity: 0 }}
                                                        className="h-64 bg-[#D97757]/20 border-2 border-dashed border-[#D97757] rounded-2xl flex items-center justify-center"
                                                    >
                                                        <motion.div
                                                            initial={{ scale: 0.9 }}
                                                            animate={{ scale: 1 }}
                                                            className="scale-90"
                                                        >
                                                            <EventCard
                                                                event={game.activeEvent}
                                                                showYear={false}
                                                                isActive={true}
                                                            />
                                                        </motion.div>
                                                    </motion.div>
                                                )}

                                                {!showActiveHere && (
                                                    <div className="w-2 h-12 bg-[#E8E6DC]/50 rounded-full" />
                                                )}

                                                {/* Placed card */}
                                                <motion.div layout transition={{ type: 'spring', stiffness: 300, damping: 25 }}>
                                                    <EventCard
                                                        event={event}
                                                        showYear={true}
                                                        result={
                                                            game.status === 'revealing' && event.id === game.activeEvent?.id
                                                                ? event.wasCorrect
                                                                    ? 'correct'
                                                                    : 'incorrect'
                                                                : null
                                                        }
                                                    />
                                                </motion.div>
                                            </div>
                                        );
                                    })}

                                    {/* Active card at end */}
                                    {game.status === 'placing' &&
                                        game.activeEvent &&
                                        game.proposedPosition === game.placedEvents.length && (
                                            <>
                                                <div className="w-2 h-12 bg-[#E8E6DC]/50 rounded-full" />
                                                <motion.div
                                                    initial={{ width: 8, opacity: 0 }}
                                                    animate={{ width: 160, opacity: 1 }}
                                                    exit={{ width: 8, opacity: 0 }}
                                                    className="h-64 bg-[#D97757]/20 border-2 border-dashed border-[#D97757] rounded-2xl flex items-center justify-center"
                                                >
                                                    <motion.div
                                                        initial={{ scale: 0.9 }}
                                                        animate={{ scale: 1 }}
                                                        className="scale-90"
                                                    >
                                                        <EventCard
                                                            event={game.activeEvent}
                                                            showYear={false}
                                                            isActive={true}
                                                        />
                                                    </motion.div>
                                                </motion.div>
                                            </>
                                        )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Gradient fade indicators */}
                        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#FAF9F5] to-transparent pointer-events-none" />
                        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#FAF9F5] to-transparent pointer-events-none" />
                    </div>
                </div>

                {/* Footer Bar */}
                <div className="bg-[#F0EFEA] border-t border-[#E8E6DC] py-4 px-6">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        {/* Current card preview */}
                        <div className="flex items-center gap-4">
                            {game.activeEvent && (
                                <>
                                    <div className="text-3xl">{getCategoryIcon(game.activeEvent.category)}</div>
                                    <div>
                                        <p className="text-sm text-[#B0AEA5]">Current Card</p>
                                        <p className="font-bold text-[#141413]">{game.activeEvent.title}</p>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Current turn */}
                        <div className="text-right">
                            <p className="text-sm text-[#B0AEA5]">Current Turn</p>
                            <p className="font-bold text-[#D97757] text-lg">
                                {game.activePlayerId ? playerName(game.activePlayerId) : 'Waiting...'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </GameLayout>
    );
}
