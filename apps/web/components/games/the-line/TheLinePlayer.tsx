'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { TheLineGameState } from '@lesury/game-logic';
import type { RoomState } from '@lesury/game-logic';
import { formatDisplayValue, AUTO_ADVANCE_DELAY_MS } from '@lesury/game-logic';
import LeadCaptureForm from '@/components/LeadCaptureForm';

interface TheLinePlayerProps {
    state: {
        room: RoomState;
        game: TheLineGameState;
    };
    myPlayerId?: string;
}

export default function TheLinePlayer({ state, myPlayerId = '' }: TheLinePlayerProps) {
    const { room, game: rawGame } = state;
    const [showResult, setShowResult] = useState(false);
    const [lastResult, setLastResult] = useState<'success' | 'fail'>('success');
    const [kicked, setKicked] = useState(false);
    const [countdownProgress, setCountdownProgress] = useState(100);
    const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Game-over latch: snapshot score/rank at the moment of game-over so the
    // screen stays visible (with LeadCaptureForm) even after Play Again resets
    // game.scores back to {}. Cleared only when the player taps "Join Game".
    const [gameOverSnapshot, setGameOverSnapshot] = useState<{
        myScore: number;
        myRank: number;
    } | null>(null);

    // Normalize: ensure all TheLineGameState properties exist with safe defaults
    const game = {
        ...(rawGame || {}),
        line: Array.isArray((rawGame as any)?.line) ? (rawGame as any).line : [],
        scores: (rawGame as any)?.scores || {},
        status: (rawGame as any)?.status || 'setup',
    } as TheLineGameState;

    const playerId = myPlayerId || room.players.find((p: any) => !p.isHost)?.id || '';

    const getSocket = () => (typeof window !== 'undefined' ? (window as any).__partySocket : null);

    // Listen for kicked message
    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;

        const handleMessage = (evt: MessageEvent) => {
            try {
                const data = JSON.parse(evt.data as string);
                if (data.type === 'kicked') setKicked(true);
            } catch { }
        };

        socket.addEventListener('message', handleMessage);
        return () => socket.removeEventListener('message', handleMessage);
    }, []);

    // Capture game-over snapshot once (scores reset to {} on play_again)
    useEffect(() => {
        if (game.status === 'finished' && !gameOverSnapshot) {
            const sorted = Object.entries(game.scores).sort(([, a], [, b]) => b - a);
            const myRank = sorted.findIndex(([pid]) => pid === playerId) + 1;
            setGameOverSnapshot({ myScore: game.scores[playerId] || 0, myRank });
        }
    }, [game.status, game.scores, playerId, gameOverSnapshot]);

    // Show result overlay for spectators
    useEffect(() => {
        if (game.status === 'revealing' && game.last_action) {
            setLastResult(game.last_action.result);
            setShowResult(true);
        } else {
            setShowResult(false);
        }
    }, [game.status, game.last_action]);

    // Countdown progress bar for active player's revealing screen
    useEffect(() => {
        if (game.status === 'revealing' && game.activePlayerId === playerId) {
            setCountdownProgress(100);
            const startTime = Date.now();
            countdownIntervalRef.current = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const remaining = Math.max(0, 100 - (elapsed / AUTO_ADVANCE_DELAY_MS) * 100);
                setCountdownProgress(remaining);
                if (remaining === 0 && countdownIntervalRef.current) {
                    clearInterval(countdownIntervalRef.current);
                    countdownIntervalRef.current = null;
                }
            }, 50);
        } else {
            if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
                countdownIntervalRef.current = null;
            }
        }

        return () => {
            if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
                countdownIntervalRef.current = null;
            }
        };
    }, [game.status, game.activePlayerId, playerId]);

    const isMyTurn = game.activePlayerId === playerId;

    const handleMove = (direction: 'left' | 'right') => {
        const s = getSocket();
        if (!s || !isMyTurn) return;
        s.send(JSON.stringify({ type: 'move_cursor', direction }));
    };

    const handlePlace = () => {
        const s = getSocket();
        if (!s || !isMyTurn) return;
        s.send(JSON.stringify({ type: 'place_card' }));
    };

    // ─── Kicked ───────────────────────────────────────────────────────────────

    if (kicked) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center max-w-sm"
                >
                    <div className="text-6xl mb-4">👋</div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Removed from Game</h2>
                    <p className="text-muted-foreground mb-8">The host removed you from this game.</p>
                    <button
                        onClick={() => (window.location.href = '/')}
                        className="w-full bg-primary text-primary-foreground px-6 py-4 rounded-xl font-bold text-lg hover:bg-[#2A2A2A] transition-colors"
                    >
                        Home
                    </button>
                </motion.div>
            </div>
        );
    }

    // ─── Game Over (latch) ────────────────────────────────────────────────────
    // Must be checked BEFORE the setup branch — when play_again resets
    // game.status to 'setup', this snapshot keeps the screen (and LeadCaptureForm)
    // visible until the player explicitly taps "Join Game →".

    if (gameOverSnapshot) {
        const { myScore, myRank } = gameOverSnapshot;
        const newGameStarting = game.status !== 'finished';

        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-muted rounded-3xl p-8 text-center max-w-md shadow-xl w-full"
                >
                    <div className="text-6xl mb-4">
                        {myRank === 1 ? '🏆' : myRank === 2 ? '🥈' : myRank === 3 ? '🥉' : '🎮'}
                    </div>
                    <h2 className="text-2xl font-bold mb-2 text-foreground">
                        {myRank === 1 ? 'You Win!' : `#${myRank} Place`}
                    </h2>
                    <div className="bg-card rounded-xl p-4 mb-6 shadow-md">
                        <p className="text-sm text-muted-foreground">Your Score</p>
                        <p className="text-4xl font-bold text-accent tabular-nums">{myScore}</p>
                    </div>

                    {/* Lead Generation Form */}
                    <div className="mb-6">
                        <LeadCaptureForm />
                    </div>

                    {newGameStarting ? (
                        <>
                            <motion.p
                                animate={{ opacity: [0.6, 1, 0.6] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="text-accent font-bold text-sm mb-4"
                            >
                                New game starting!
                            </motion.p>
                            <button
                                onClick={() => setGameOverSnapshot(null)}
                                className="w-full bg-accent text-accent-foreground px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity"
                            >
                                Join Game →
                            </button>
                        </>
                    ) : (
                        <>
                            <p className="text-muted-foreground text-sm mb-4">
                                Waiting for host to start a new game...
                            </p>
                            <button
                                onClick={() => (window.location.href = '/')}
                                className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold hover:bg-[#2A2A2A] transition-colors"
                            >
                                Home
                            </button>
                        </>
                    )}
                </motion.div>
            </div>
        );
    }

    // ─── Setup / Waiting ──────────────────────────────────────────────────────

    if (game.status === 'setup') {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
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
                        📏
                    </motion.div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Get Ready!</h2>
                    <p className="text-lg text-muted-foreground">Waiting for host to start...</p>
                </motion.div>
            </div>
        );
    }

    // ─── Waiting for turn ─────────────────────────────────────────────────────

    if (!isMyTurn) {
        const activePlayer = room.players.find((p: any) => p.id === game.activePlayerId);
        const activePlayerName = activePlayer?.name || 'Another player';
        const activePlayerAvatar = activePlayer?.avatar || '⏳';

        return (
            <div className="min-h-screen bg-background flex flex-col">
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
                            {activePlayerAvatar}
                        </motion.div>
                        <p className="text-2xl font-bold mb-2 text-foreground">
                            {activePlayerName} is playing
                        </p>
                        <p className="text-lg text-muted-foreground">Watch the TV!</p>

                        <div className="mt-6 bg-muted rounded-xl p-4 shadow-md">
                            <p className="text-sm text-muted-foreground">Your Score</p>
                            <p className="text-3xl font-bold text-foreground tabular-nums">
                                {game.scores[playerId] || 0}
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* Result overlay for spectators */}
                <AnimatePresence>
                    {showResult && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={`fixed inset-0 flex items-center justify-center z-50 ${lastResult === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'
                                }`}
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: [0, 1.3, 1] }}
                                className="text-9xl"
                            >
                                {lastResult === 'success' ? '✅' : '❌'}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // ─── Active turn — Loading ─────────────────────────────────────────────────

    if (!game.activeEvent) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-xl text-muted-foreground">Loading...</div>
            </div>
        );
    }

    // ─── Active turn — Revealing ───────────────────────────────────────────────

    if (game.status === 'revealing') {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                {/* Result display */}
                <div className="flex-1 flex items-center justify-center p-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: [0, 1.3, 1] }}
                            transition={{ duration: 0.5 }}
                            className="text-8xl mb-4"
                        >
                            {game.last_action?.result === 'success' ? '✅' : '❌'}
                        </motion.div>
                        {game.last_action && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <p className="text-2xl font-bold text-foreground tabular-nums">
                                    {formatDisplayValue(game.last_action.display_value)}{' '}
                                    {game.last_action.unit}
                                </p>
                                <p className="text-muted-foreground text-sm mt-2 max-w-xs mx-auto">
                                    {game.last_action.funfact}
                                </p>
                            </motion.div>
                        )}
                    </motion.div>
                </div>

                {/* Passive countdown */}
                <div className="p-6">
                    <p className="text-center text-muted-foreground text-sm mb-3">Next turn starting...</p>
                    <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                        <motion.div
                            className="h-full bg-accent rounded-full"
                            style={{ width: `${countdownProgress}%` }}
                        />
                    </div>
                </div>
            </div>
        );
    }

    // ─── Active turn — Placing ─────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <div className="fixed top-4 right-4 z-50"><ThemeToggle /></div>
            {/* Event Info — Top 2/3 */}
            <div className="flex-[2] bg-muted p-6 flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center max-w-md"
                >
                    {/* Category badge */}
                    <span className="inline-block text-xs font-bold uppercase px-3 py-1 rounded-full bg-accent/10 text-accent mb-4">
                        {game.selectedCategory}
                    </span>

                    {/* Event Image */}
                    {game.activeEvent.imageUrl && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mb-4"
                        >
                            <Image
                                src={game.activeEvent.imageUrl}
                                alt={game.activeEvent.title}
                                width={120}
                                height={120}
                                className="object-contain mx-auto"
                            />
                        </motion.div>
                    )}

                    {/* Event Title */}
                    <h2 className="text-3xl font-extrabold mb-2 text-foreground">
                        {game.activeEvent.title}
                    </h2>

                    {/* Fun Fact */}
                    {game.activeEvent.funfact && (
                        <p className="text-sm text-muted-foreground italic mb-4 leading-relaxed max-w-xs mx-auto">
                            {game.activeEvent.funfact}
                        </p>
                    )}

                    {/* Instructions */}
                    <p className="text-lg text-muted-foreground">Where does this belong on the line?</p>

                    {/* Position indicator */}
                    <motion.div
                        key={game.cursorIndex}
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        className="mt-6 bg-card rounded-xl p-4 shadow-md"
                    >
                        <p className="text-sm text-muted-foreground mb-1">Position</p>
                        <p className="text-5xl font-bold text-accent tabular-nums">
                            {game.cursorIndex + 1}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            of {game.line.length + 1} slots
                        </p>
                    </motion.div>
                </motion.div>
            </div>

            {/* Controls — Bottom 1/3 */}
            <div className="flex-1 bg-border flex flex-col items-center justify-center p-6 gap-4">
                {/* Arrow buttons */}
                <div className="flex gap-4 w-full max-w-md">
                    <button
                        onClick={() => handleMove('left')}
                        disabled={game.cursorIndex === 0}
                        className="flex-1 bg-card text-foreground py-6 rounded-xl font-bold text-3xl hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 shadow-md"
                    >
                        ←
                    </button>
                    <button
                        onClick={() => handleMove('right')}
                        disabled={game.cursorIndex >= game.line.length}
                        className="flex-1 bg-card text-foreground py-6 rounded-xl font-bold text-3xl hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 shadow-md"
                    >
                        →
                    </button>
                </div>

                {/* Place button */}
                <button
                    onClick={handlePlace}
                    className="w-full max-w-md bg-accent text-accent-foreground px-6 py-5 rounded-xl font-bold text-xl hover:bg-accent-hover transition-colors active:scale-95 shadow-lg"
                >
                    Place Event ✓
                </button>
            </div>
        </div>
    );
}
