'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameHeader } from '@/components/games/GameHeader';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from 'next-themes';
import QRCode from 'qrcode';
import type { TimelineGameState, PlacedEvent, GameMode } from '@lesury/game-logic';
import { formatYear, getCategoryIcon, generateRoomUrl } from '@lesury/game-logic';
import type { RoomState } from '@lesury/game-logic';
import GameLayout from '@/components/layout/GameLayout';
import EventCard from './EventCard';

interface TimelineHostProps {
    state: {
        room: RoomState;
        game: TimelineGameState;
    };
    socket?: any;
}

export default function TimelineHost({ state, socket: propSocket }: TimelineHostProps) {
    const { room, game } = state;
    const timelineRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { resolvedTheme } = useTheme();
    const [selectedMode, setSelectedMode] = useState<GameMode>('coop');

    const getSocket = useCallback(
        () => propSocket ?? (typeof window !== 'undefined' ? (window as any).__partySocket : null),
        [propSocket]
    );

    const playerName = (id: string) =>
        room.players.find((p: { id: string; name: string }) => p.id === id)?.name ?? id;

    // QR code generation for lobby
    useEffect(() => {
        if (game.status !== 'waiting' || !canvasRef.current) return;
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const url = generateRoomUrl('timeline', room.roomCode, baseUrl);

        const qrColors = resolvedTheme === 'dark'
            ? { dark: '#F0EFEA', light: '#2E2E2C' }
            : { dark: '#191917', light: '#FFFFFF' };

        QRCode.toCanvas(
            canvasRef.current,
            url,
            { width: 250, margin: 2, color: qrColors },
            (err) => { if (err) console.error('QR generation failed:', err); }
        );
    }, [game.status, room.roomCode, resolvedTheme]);

    // Auto-scroll to keep active slot centered
    useEffect(() => {
        if (game.status === 'placing' && timelineRef.current) {
            const container = timelineRef.current;
            const cardWidth = 160;
            const slotWidth = 160;
            const gap = 12;

            const scrollPosition = game.proposedPosition * (cardWidth + gap + slotWidth);
            const containerCenter = container.offsetWidth / 2;
            const scrollTo = scrollPosition - containerCenter + cardWidth / 2;

            container.scrollTo({
                left: Math.max(0, scrollTo),
                behavior: 'smooth',
            });
        }
    }, [game.proposedPosition, game.status]);

    // ── Lobby ────────────────────────────────────────────────────────────────
    if (game.status === 'waiting') {
        const nonHostPlayers = room.players.filter((p: any) => !p.isHost && p.name !== 'Host');

        const handleStartGame = () => {
            const s = getSocket();
            if (!s) return;
            s.send(JSON.stringify({
                type: 'startGame',
                mode: selectedMode,
                cardsGoal: 20,
            }));
        };

        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 gap-4 relative">
                <GameHeader />

                <h1 className="text-3xl font-bold text-foreground text-center">Timeline</h1>

                <div className="flex gap-8 max-w-5xl w-full">
                    {/* LEFT: QR Code + Room Code + Players */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex-1 bg-card rounded-xl p-8 shadow-2xl flex flex-col"
                    >
                        <p className="text-muted-foreground text-center text-base mb-4">
                            Scan to join
                        </p>
                        <div className="flex justify-center mb-6">
                            <canvas
                                ref={canvasRef}
                                width={250}
                                height={250}
                                className="rounded-md"
                            />
                        </div>

                        <div className="bg-background rounded-md p-4 mb-6 text-center border border-border">
                            <p className="text-xs text-muted-foreground mb-1">Room Code</p>
                            <p className="text-4xl font-bold tracking-widest text-foreground tabular-nums">
                                {room.roomCode}
                            </p>
                        </div>

                        <div className="flex-1">
                            <p className="text-sm font-bold text-foreground mb-2">
                                Players ({nonHostPlayers.length})
                            </p>
                            {nonHostPlayers.length === 0 ? (
                                <p className="text-muted-foreground text-sm">
                                    Waiting for players to join…
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {nonHostPlayers.map((p: any) => (
                                        <div
                                            key={p.id}
                                            className="bg-background px-3 py-2 rounded-md text-sm font-bold text-foreground flex items-center gap-2 border border-border"
                                        >
                                            <span className="text-lg">{p.avatar || '👤'}</span>
                                            <span className="flex-1">{p.name}</span>
                                            <button
                                                onClick={() => {
                                                    if (confirm(`Remove ${p.name} from the game?`)) {
                                                        getSocket()?.send(
                                                            JSON.stringify({ type: 'kick', playerId: p.id })
                                                        );
                                                    }
                                                }}
                                                className="text-muted-foreground hover:text-destructive transition-colors text-lg px-1"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* RIGHT: Settings + Start */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex-1 bg-card rounded-xl p-8 shadow-2xl flex flex-col"
                    >
                        <p className="text-muted-foreground text-center text-base mb-8">Set up game</p>

                        {/* Mode selector */}
                        <div className="mb-8">
                            <label className="block text-sm font-bold text-foreground mb-2">
                                Game Mode
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {([
                                    { value: 'coop' as const, label: 'Co-op' },
                                    { value: 'competitive' as const, label: 'Competitive' },
                                ]).map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setSelectedMode(opt.value)}
                                        className={`px-4 py-3 rounded-md font-bold text-sm transition-all ${
                                            selectedMode === opt.value
                                                ? 'bg-accent text-accent-foreground shadow-md'
                                                : 'bg-background text-foreground border border-border hover:bg-secondary'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1" />

                        <button
                            type="button"
                            onClick={handleStartGame}
                            className={`w-full px-6 py-4 rounded-md font-bold text-lg transition-opacity cursor-pointer ${
                                nonHostPlayers.length > 0
                                    ? 'bg-accent text-accent-foreground hover:opacity-90'
                                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                            }`}
                        >
                            {nonHostPlayers.length > 0
                                ? `Start Game (${nonHostPlayers.length} player${nonHostPlayers.length !== 1 ? 's' : ''})`
                                : 'Start Game'}
                        </button>
                    </motion.div>
                </div>
            </div>
        );
    }

    // ── Game Over Screen ─────────────────────────────────────────────────────
    if (game.status === 'gameOver') {
        const winner =
            game.winner === 'team'
                ? 'Team Victory!'
                : game.winner
                  ? `${game.winner} Wins!`
                  : 'Game Over';

        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-card rounded-3xl p-12 text-center max-w-2xl shadow-xl"
                >
                    <div className="text-7xl mb-6">🏆</div>
                    <h1 className="text-4xl font-bold mb-4 text-foreground">{winner}</h1>

                    {game.mode === 'coop' && (
                        <p className="text-xl text-muted-foreground mb-6">
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
                                        className="flex justify-between items-center p-3 bg-muted rounded-xl"
                                    >
                                        <span className="font-bold">
                                            #{idx + 1} {playerId}
                                        </span>
                                        <span className="font-bold text-accent">
                                            {score} pts
                                        </span>
                                    </div>
                                ))}
                        </div>
                    )}

                    <button
                        onClick={() => (window.location.href = '/games/timeline')}
                        className="bg-accent text-accent-foreground px-8 py-4 rounded-xl text-lg font-bold hover:bg-accent-hover transition-colors shadow-lg"
                    >
                        Play Again
                    </button>
                </motion.div>
            </div>
        );
    }

    // ── Gameplay ──────────────────────────────────────────────────────────────
    return (
        <GameLayout backUrl="/games/timeline" theme="light">
            <div className="min-h-screen bg-background flex flex-col">
                {/* Header Bar */}
                <div className="bg-muted border-b border-border py-4 px-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-foreground">Timeline</h1>

                        {/* Player Scores / Status */}
                        <div className="flex gap-3 items-center">
                            {game.mode === 'coop' ? (
                                <div className="flex items-center gap-4">
                                    <div className="text-2xl">
                                        {'❤️'.repeat(game.lives)}
                                        {'🤍'.repeat(Math.max(0, 3 - game.lives))}
                                    </div>
                                    <div className="text-lg font-bold text-foreground">
                                        {game.cardsPlaced} / {game.cardsGoal} cards
                                    </div>
                                </div>
                            ) : (
                                Object.entries(game.playerScores).map(([playerId, score]) => (
                                    <div
                                        key={playerId}
                                        className={`px-4 py-2 rounded-full font-bold transition-all ${
                                            playerId === game.activePlayerId
                                                ? 'bg-accent text-accent-foreground shadow-md'
                                                : 'bg-card text-foreground'
                                        }`}
                                    >
                                        {playerName(playerId)}: {score}
                                    </div>
                                ))
                            )}
                            <ThemeToggle />
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
                            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2" />

                            {/* Cards and slots */}
                            <div className="relative z-10 flex items-center gap-3">
                                <AnimatePresence mode="popLayout">
                                    {game.placedEvents.map((event, index) => {
                                        const showActiveHere =
                                            game.status === 'placing' &&
                                            game.activeEvent &&
                                            game.proposedPosition === index;

                                        return (
                                            <div
                                                key={`slot-${index}`}
                                                className="flex items-center gap-3"
                                            >
                                                {/* Placement slot before this card */}
                                                {showActiveHere && game.activeEvent && (
                                                    <motion.div
                                                        initial={{ width: 8, opacity: 0 }}
                                                        animate={{ width: 160, opacity: 1 }}
                                                        exit={{ width: 8, opacity: 0 }}
                                                        className="h-64 bg-accent/20 border-2 border-dashed border-accent rounded-2xl flex items-center justify-center"
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
                                                    <div className="w-2 h-12 bg-border/50 rounded-full" />
                                                )}

                                                {/* Placed card */}
                                                <motion.div
                                                    layout
                                                    transition={{
                                                        type: 'spring',
                                                        stiffness: 300,
                                                        damping: 25,
                                                    }}
                                                >
                                                    <EventCard
                                                        event={event}
                                                        showYear={true}
                                                        result={
                                                            game.status === 'revealing' &&
                                                            event.id === game.activeEvent?.id
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
                                                <div className="w-2 h-12 bg-border/50 rounded-full" />
                                                <motion.div
                                                    initial={{ width: 8, opacity: 0 }}
                                                    animate={{ width: 160, opacity: 1 }}
                                                    exit={{ width: 8, opacity: 0 }}
                                                    className="h-64 bg-accent/20 border-2 border-dashed border-accent rounded-2xl flex items-center justify-center"
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
                        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent pointer-events-none" />
                        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent pointer-events-none" />
                    </div>
                </div>

                {/* Footer Bar */}
                <div className="bg-muted border-t border-border py-4 px-6">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        {/* Current card preview */}
                        <div className="flex items-center gap-4">
                            {game.activeEvent && (
                                <>
                                    <div className="text-3xl">
                                        {getCategoryIcon(game.activeEvent.category)}
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Current Card</p>
                                        <p className="font-bold text-foreground">
                                            {game.activeEvent.title}
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Current turn */}
                        <div className="text-right">
                            <p className="text-sm text-muted-foreground">Current Turn</p>
                            <p className="font-bold text-accent text-lg">
                                {game.activePlayerId
                                    ? playerName(game.activePlayerId)
                                    : 'Waiting...'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

        </GameLayout>
    );
}
