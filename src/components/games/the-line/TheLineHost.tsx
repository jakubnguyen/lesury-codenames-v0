'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import type { TheLineGameState, PlacedTheLineEvent } from '@lesury/game-logic';
import { getCategories, formatDisplayValue, AUTO_ADVANCE_DELAY_MS } from '@lesury/game-logic';
import type { RoomState } from '@lesury/game-logic';
import QRCode from 'qrcode';
import { generateRoomUrl } from '@lesury/game-logic';

interface TheLineHostProps {
    state: {
        room: RoomState;
        game: TheLineGameState;
    };
    socket?: any;
}

export default function TheLineHost({ state, socket: propSocket }: TheLineHostProps) {
    const { room, game: rawGame } = state;
    const timelineRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [selectedCategory, setSelectedCategory] = useState('Weight');
    const [selectedRounds, setSelectedRounds] = useState(5);
    const categories = getCategories();

    // Auto-advance state
    const [autoAdvanceProgress, setAutoAdvanceProgress] = useState(0);
    const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const autoAdvanceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Normalize: ensure all TheLineGameState properties exist with safe defaults
    const game = {
        ...(rawGame || {}),
        line: Array.isArray((rawGame as any)?.line) ? (rawGame as any).line : [],
        playQueue: Array.isArray((rawGame as any)?.playQueue) ? (rawGame as any).playQueue : [],
        scores: (rawGame as any)?.scores || {},
        status: (rawGame as any)?.status || 'setup',
    } as TheLineGameState;

    const playerName = (id: string) =>
        room.players.find((p: { id: string; name: string }) => p.id === id)?.name ?? id;

    const playerAvatar = (id: string) =>
        room.players.find((p: any) => p.id === id)?.avatar || '👤';

    // Helper: get the live socket at call time to avoid stale closures
    const getSocket = useCallback(() =>
        propSocket ?? (typeof window !== 'undefined' ? (window as any).__partySocket : null),
    [propSocket]);

    // ALL hooks must be declared before any conditional returns (Rules of Hooks)

    // Auto-scroll to keep active slot visible
    useEffect(() => {
        if ((game.status === 'playing' || game.status === 'revealing') && timelineRef.current) {
            const container = timelineRef.current;
            const cardWidth = 208; // w-52
            const gap = 16; // gap-4

            let targetIndex = game.cursorIndex;
            if (game.status === 'revealing' && game.last_action) {
                const placedIdx = game.line.findIndex(e => e.id === game.last_action?.eventId);
                if (placedIdx >= 0) targetIndex = placedIdx;
            }

            const scrollPosition = targetIndex * (cardWidth + gap);
            const containerCenter = container.offsetWidth / 2;
            const scrollTo = scrollPosition - containerCenter + cardWidth / 2;

            container.scrollTo({
                left: Math.max(0, scrollTo),
                behavior: 'smooth',
            });
        }
    }, [game.cursorIndex, game.status, game.activeEvent?.id, game.last_action?.eventId, game.line]);

    // Auto-advance timer when revealing
    useEffect(() => {
        if (game.status === 'revealing') {
            setAutoAdvanceProgress(0);
            const startTime = Date.now();

            autoAdvanceIntervalRef.current = setInterval(() => {
                const elapsed = Date.now() - startTime;
                setAutoAdvanceProgress(Math.min(elapsed / AUTO_ADVANCE_DELAY_MS, 1));
            }, 50);

            autoAdvanceTimerRef.current = setTimeout(() => {
                const s = getSocket();
                if (s) s.send(JSON.stringify({ type: 'next_turn' }));
            }, AUTO_ADVANCE_DELAY_MS);
        }

        return () => {
            if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
            if (autoAdvanceIntervalRef.current) clearInterval(autoAdvanceIntervalRef.current);
        };
    }, [game.status, game.last_action?.eventId, getSocket]);

    // QR code generation for setup screen
    useEffect(() => {
        if (game.status !== 'setup' || !canvasRef.current) return;
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const url = generateRoomUrl('the-line', room.roomCode, baseUrl);
        QRCode.toCanvas(canvasRef.current, url, {
            width: 250,
            margin: 2,
            color: { dark: '#141413', light: '#F0EFEA' },
        }, (err) => { if (err) console.error('QR generation failed:', err); });
    }, [game.status, room.roomCode]);

    const skipAutoAdvance = () => {
        if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
        if (autoAdvanceIntervalRef.current) clearInterval(autoAdvanceIntervalRef.current);
        const s = getSocket();
        if (s) s.send(JSON.stringify({ type: 'next_turn' }));
    };

    // ─── Setup Screen (Merged Lobby + Settings) ─────────────────────────────

    if (game.status === 'setup') {
        const nonHostPlayers = room.players.filter((p: any) => !p.isHost && p.name !== 'Host');

        return (
            <div className="min-h-screen bg-[#2A2A2A] flex items-center justify-center p-6">
                <div className="flex gap-8 max-w-5xl w-full">
                    {/* LEFT: QR Code + Room Code + Players */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex-1 bg-[#F0EFEA] rounded-3xl p-8 shadow-2xl flex flex-col"
                    >
                        <p className="text-[#B0AEA5] text-center text-sm mb-4">Scan to join on mobile</p>
                        <div className="flex justify-center mb-6">
                            <canvas ref={canvasRef} width={250} height={250} className="rounded-xl" />
                        </div>

                        {/* Room Code */}
                        <div className="bg-white rounded-xl p-4 mb-6 text-center">
                            <p className="text-xs text-[#B0AEA5] mb-1">Room Code</p>
                            <p className="text-4xl font-bold tracking-widest text-[#141413] tabular-nums">
                                {room.roomCode}
                            </p>
                        </div>

                        {/* Player list with kick buttons */}
                        <div className="flex-1">
                            <p className="text-sm font-bold text-[#141413] mb-2">
                                Players ({nonHostPlayers.length})
                            </p>
                            {nonHostPlayers.length === 0 ? (
                                <p className="text-[#B0AEA5] text-sm">Waiting for players to join...</p>
                            ) : (
                                <div className="space-y-2">
                                    {nonHostPlayers.map((p: any) => (
                                        <div
                                            key={p.id}
                                            className="bg-white px-3 py-2 rounded-xl text-sm font-bold text-[#141413] flex items-center gap-2"
                                        >
                                            <span className="text-lg">{p.avatar || '👤'}</span>
                                            <span className="flex-1">{p.name}</span>
                                            <button
                                                onClick={() => {
                                                    if (confirm(`Remove ${p.name} from the game?`)) {
                                                        const s = getSocket();
                                                        if (s) s.send(JSON.stringify({ type: 'kick', playerId: p.id }));
                                                    }
                                                }}
                                                className="text-[#B0AEA5] hover:text-red-500 transition-colors text-lg px-1"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* RIGHT: Category + Rounds + Start */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex-1 bg-[#F0EFEA] rounded-3xl p-8 shadow-2xl flex flex-col"
                    >
                        <h1 className="text-3xl font-bold text-[#141413] mb-2 text-center">The Line</h1>
                        <p className="text-[#B0AEA5] text-center mb-8">Configure your game</p>

                        {/* Category Select */}
                        <div className="mb-6">
                            <label className="block text-sm font-bold text-[#141413] mb-2">
                                Category
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {categories.map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-4 py-3 rounded-xl font-bold text-sm transition-all ${selectedCategory === cat
                                            ? 'bg-[#D97757] text-white shadow-md'
                                            : 'bg-white text-[#141413] hover:bg-[#E8E6DC]'
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Rounds Selector */}
                        <div className="mb-8">
                            <label className="block text-sm font-bold text-[#141413] mb-2">
                                Rounds: <span className="text-[#D97757] tabular-nums">{selectedRounds}</span>
                            </label>
                            <input
                                type="range"
                                min={3}
                                max={10}
                                value={selectedRounds}
                                onChange={(e) => setSelectedRounds(Number(e.target.value))}
                                className="w-full accent-[#D97757]"
                            />
                            <div className="flex justify-between text-xs text-[#B0AEA5] mt-1">
                                <span>3</span>
                                <span>10</span>
                            </div>
                        </div>

                        <div className="flex-1" />

                        {/* Start Button */}
                        <button
                            type="button"
                            onClick={() => {
                                const s = getSocket();
                                if (!s) return;
                                s.send(JSON.stringify({
                                    type: 'start_game',
                                    category: selectedCategory,
                                    roundLimit: selectedRounds,
                                }));
                            }}
                            className="w-full bg-[#D97757] text-white px-6 py-4 rounded-xl font-bold text-lg hover:bg-[#CC785C] transition-colors cursor-pointer"
                        >
                            Start Game
                        </button>
                    </motion.div>
                </div>
            </div>
        );
    }

    // ─── Game Over Screen ─────────────────────────────────────────────────────

    if (game.status === 'finished') {
        const sortedScores = Object.entries(game.scores).sort(([, a], [, b]) => b - a);
        const winnerId = sortedScores[0]?.[0];

        return (
            <div className="min-h-screen bg-[#2A2A2A] flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-[#F0EFEA] rounded-3xl p-12 text-center max-w-2xl w-full shadow-2xl"
                >
                    <div className="text-7xl mb-4">🏆</div>
                    {winnerId && (
                        <div className="text-5xl mb-2">{playerAvatar(winnerId)}</div>
                    )}
                    <h1 className="text-4xl font-bold mb-2 text-[#141413]">
                        {winnerId ? `${playerName(winnerId)} Wins!` : 'Game Over'}
                    </h1>
                    <p className="text-[#B0AEA5] mb-8">
                        Category: {game.selectedCategory} · {game.roundLimit} rounds
                    </p>

                    <div className="space-y-2 mb-8">
                        {sortedScores.map(([pid, score], idx) => (
                            <motion.div
                                key={pid}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className={`flex justify-between items-center p-4 rounded-xl ${idx === 0 ? 'bg-[#D97757] text-white' : 'bg-white'
                                }`}
                            >
                                <span className="font-bold flex items-center gap-2">
                                    <span className="text-2xl">{playerAvatar(pid)}</span>
                                    #{idx + 1} {playerName(pid)}
                                </span>
                                <span className="font-bold tabular-nums text-xl">
                                    {score} pts
                                </span>
                            </motion.div>
                        ))}
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => {
                                const s = getSocket();
                                if (s) s.send(JSON.stringify({ type: 'play_again' }));
                            }}
                            className="flex-1 bg-[#D97757] text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-[#CC785C] transition-colors shadow-lg"
                        >
                            Play Again
                        </button>
                        <button
                            onClick={() => (window.location.href = '/games/the-line')}
                            className="flex-1 bg-[#3A3A3A] text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-[#4A4A4A] transition-colors shadow-lg"
                        >
                            Home
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    // ─── Gameplay Screen ──────────────────────────────────────────────────────

    const isRevealing = game.status === 'revealing';
    const lastAction = game.last_action;
    const resultColor = lastAction?.result === 'success' ? 'bg-green-500/10' : lastAction?.result === 'fail' ? 'bg-red-500/10' : '';

    // Reusable card slot component for the active card preview
    const ActiveCardSlot = ({ activeEvent }: { activeEvent: NonNullable<TheLineGameState['activeEvent']> }) => (
        <motion.div
            initial={{ width: 8, opacity: 0 }}
            animate={{ width: 208, opacity: 1 }}
            exit={{ width: 8, opacity: 0 }}
            className="h-[34rem] bg-[#D97757]/20 border-2 border-dashed border-[#D97757] rounded-2xl flex flex-col items-center flex-shrink-0 overflow-hidden p-3"
        >
            {/* Fixed 2-row title area */}
            <div className="h-[72px] flex items-center justify-center text-center px-1 flex-shrink-0 overflow-hidden">
                <p className="text-white font-bold text-[28px] leading-[1.25] line-clamp-2">
                    {activeEvent.title}
                </p>
            </div>
            {/* Image — always at the same Y position */}
            {activeEvent.imageUrl && (
                <div className="relative w-full aspect-square overflow-hidden rounded-lg mt-2 flex-shrink-0">
                    <Image src={activeEvent.imageUrl} alt={activeEvent.title} fill className="object-contain" />
                </div>
            )}
            {/* Fixed value+unit area */}
            <div className="h-[56px] flex flex-col items-center justify-center flex-shrink-0 mt-2">
                <p className="text-[#D97757] font-bold text-3xl leading-none">???</p>
            </div>
            {/* Funfact area — 18px gap from unit, full text always visible */}
            <div className="min-h-[52px] flex items-start justify-center flex-shrink-0 mt-[18px]">
                {activeEvent.funfact && (
                    <p className="text-[#E8E6DC] text-[18px] leading-snug text-center px-1">
                        {activeEvent.funfact}
                    </p>
                )}
            </div>
        </motion.div>
    );

    return (
        <div className={`min-h-screen bg-[#2A2A2A] flex flex-col transition-colors duration-500 ${isRevealing ? resultColor : ''}`}>
            {/* Top Bar — Scores & Round */}
            <div className="bg-[#1E1E1E] border-b border-[#3A3A3A] py-3 px-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity mr-6 flex-shrink-0">
                        <Image src="/logo.png" alt="Lesury" width={32} height={32} className="w-8 h-8 rounded-full object-cover" />
                        <span className="text-lg font-extrabold text-[#E8E6DC]">lesury</span>
                    </Link>

                    {/* Player scores */}
                    <div className="flex gap-3 flex-1">
                        {(game.playQueue || []).map((pid) => (
                            <div
                                key={pid}
                                className={`px-5 py-3 rounded-2xl font-bold text-base transition-all ${pid === game.activePlayerId
                                    ? 'bg-[#D97757] text-white shadow-lg scale-110 ring-2 ring-[#D97757]/50'
                                    : 'bg-[#3A3A3A] text-[#B0AEA5]'
                                }`}
                            >
                                <span className="text-lg">{playerAvatar(pid)}</span>{' '}
                                <span className="text-lg">{playerName(pid)}</span>{' '}
                                <span className="tabular-nums text-xl">{game.scores[pid] ?? 0}</span>
                            </div>
                        ))}
                    </div>

                    {/* Round progress dots */}
                    <div className="flex items-center gap-3">
                        <div className="flex gap-1.5">
                            {Array.from({ length: game.roundLimit }, (_, i) => (
                                <div
                                    key={i}
                                    className={`w-3 h-3 rounded-full transition-colors ${
                                        i < game.roundIndex
                                            ? 'bg-[#D97757]'
                                            : 'bg-[#3A3A3A]'
                                    }`}
                                />
                            ))}
                        </div>
                        <span className="text-[#5A5A5A] text-xs tabular-nums">
                            {game.roundIndex}/{game.roundLimit}
                        </span>
                    </div>
                </div>
            </div>

            {/* Center — The Line */}
            <div className="flex-1 flex flex-col relative overflow-hidden">
                {/* Main instruction title */}
                <div className="text-center pt-4 pb-2 flex-shrink-0">
                    <p className="text-xl font-medium">
                        <span className="text-[#E8E6DC]">Order cards based on the </span>
                        <span className="text-[#D97757] font-bold">{game.selectedCategory}</span>
                    </p>
                </div>
                <div
                    ref={timelineRef}
                    className="flex-1 flex items-center overflow-x-auto px-12"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    <div className="relative min-w-max">
                        {/* Horizontal line */}
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#3A3A3A] -translate-y-1/2" />

                        {/* Cards and slots */}
                        <div className="relative z-10 flex items-center gap-4">
                            <AnimatePresence mode="popLayout">
                                {game.line.map((event, index) => {
                                    const showSlotHere =
                                        game.status === 'playing' &&
                                        game.activeEvent &&
                                        game.cursorIndex === index;

                                    return (
                                        <div key={`slot-${event.id}`} className="flex items-center gap-4">
                                            {/* Cursor slot before this card */}
                                            {showSlotHere && game.activeEvent && (
                                                <ActiveCardSlot activeEvent={game.activeEvent} />
                                            )}

                                            {/* Placed card */}
                                            <motion.div
                                                layout
                                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                                className={`w-52 h-[34rem] rounded-2xl p-3 flex flex-col items-center flex-shrink-0 overflow-hidden ${isRevealing && event.id === lastAction?.eventId
                                                    ? event.wasCorrect
                                                        ? 'bg-green-500/20 border-2 border-green-400'
                                                        : 'bg-red-500/20 border-2 border-red-400'
                                                    : 'bg-[#F0EFEA] border border-[#E8E6DC]'
                                                }`}
                                            >
                                                {/* Fixed 2-row title area */}
                                                <div className="h-[72px] flex items-center justify-center text-center px-1 flex-shrink-0 overflow-hidden">
                                                    <p className="text-[#141413] font-bold text-[28px] leading-[1.25] line-clamp-2">
                                                        {event.title}
                                                    </p>
                                                </div>
                                                {/* Image — always at the same Y position */}
                                                {event.imageUrl && (
                                                    <div className="relative w-full aspect-square overflow-hidden rounded-lg mt-2 flex-shrink-0">
                                                        <Image src={event.imageUrl} alt={event.title} fill className="object-contain" />
                                                    </div>
                                                )}
                                                {/* Fixed value+unit area */}
                                                <div className="h-[56px] flex flex-col items-center justify-center flex-shrink-0 mt-2">
                                                    <p className="text-[#D97757] font-bold text-3xl tabular-nums leading-none">
                                                        {formatDisplayValue(event.display_value)}
                                                    </p>
                                                    <p className="text-[#141413] text-base font-bold uppercase tracking-wide mt-1">
                                                        {event.unit}
                                                    </p>
                                                </div>
                                                {/* Funfact area — 18px gap from unit, full text always visible */}
                                                <div className="min-h-[52px] flex items-start justify-center flex-shrink-0 mt-[18px]">
                                                    {event.funfact && (
                                                        <p className="text-[#141413] text-[18px] leading-snug text-center px-1">
                                                            {event.funfact}
                                                        </p>
                                                    )}
                                                </div>
                                            </motion.div>
                                        </div>
                                    );
                                })}

                                {/* Cursor slot at end */}
                                {game.status === 'playing' &&
                                    game.activeEvent &&
                                    game.cursorIndex === game.line.length && (
                                        <ActiveCardSlot activeEvent={game.activeEvent} />
                                    )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Gradient fade indicators */}
                <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#2A2A2A] to-transparent pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#2A2A2A] to-transparent pointer-events-none" />

                {/* Reveal overlay — clickable to skip auto-advance */}
                <AnimatePresence>
                    {isRevealing && lastAction && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            className="absolute inset-0 flex items-center justify-center z-20 cursor-pointer"
                            onClick={skipAutoAdvance}
                        >
                            <div className="text-center">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: [0, 1.2, 1] }}
                                    transition={{ duration: 0.5 }}
                                    className="text-9xl mb-4"
                                >
                                    {lastAction.result === 'success' ? '✅' : '❌'}
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="bg-[#1E1E1E]/90 rounded-2xl p-6 max-w-md mx-4"
                                >
                                    <p className="text-white font-bold text-2xl tabular-nums">
                                        {formatDisplayValue(lastAction.display_value)} {lastAction.unit}
                                    </p>
                                    <p className="text-[#E8E6DC] text-sm mt-2 leading-relaxed">
                                        {lastAction.funfact}
                                    </p>
                                </motion.div>
                            </div>

                            {/* Auto-advance progress bar */}
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#3A3A3A]">
                                <div
                                    className="h-full bg-[#D97757] transition-none"
                                    style={{ width: `${autoAdvanceProgress * 100}%` }}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <style jsx global>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    );
}
