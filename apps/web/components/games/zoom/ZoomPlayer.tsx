'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { RoomState, ZoomGameState } from '@lesury/game-logic';

const PLAYER_COLORS = ['#D97757', '#6A9BCC', '#788C5D', '#E8C547', '#C86DD7', '#4ECDC4'];

interface ZoomPlayerProps {
    state: {
        room: RoomState;
        game: ZoomGameState;
    };
    myPlayerId: string;
}

export default function ZoomPlayer({ state, myPlayerId }: ZoomPlayerProps) {
    const { room, game } = state;
    const [guess, setGuess] = useState('');
    const [isShaking, setIsShaking] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const myPlayer = game.players[myPlayerId];
    // Zoom doesn't strictly use colorIndex for logic, but we can assign one based on position for flair
    const myIndex = Object.keys(game.players).indexOf(myPlayerId);
    const myColor = PLAYER_COLORS[myIndex % PLAYER_COLORS.length] ?? '#D97757';

    const getSocket = () => (typeof window !== 'undefined' ? (window as any).__partySocket : null);

    // Auto focus input when round starts
    useEffect(() => {
        if (game.phase === 'playing' && !myPlayer?.guessedCorrectly) {
            // Small delay to ensure render
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [game.phase, game.round, myPlayer?.guessedCorrectly]);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!guess.trim() || game.phase !== 'playing' || myPlayer?.guessedCorrectly) return;

        getSocket()?.send(JSON.stringify({ type: 'guess', word: guess }));

        // We clear the guess and shake the input locally. If it was correct, 
        // the server state will update `guessedCorrectly` to true almost instantly.
        setIsShaking(true);
        setGuess('');
        setTimeout(() => setIsShaking(false), 500);

        // Refocus so they can keep typing immediately
        inputRef.current?.focus();
    };

    const handlePlayAgain = () => {
        getSocket()?.send(JSON.stringify({ type: 'play_again' }));
    };

    // ── Lobby View ──────────────────────────────────────────────────────────
    if (game.phase === 'lobby') {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
                <div className="fixed top-4 right-4 z-50"><ThemeToggle /></div>
                <div className="text-6xl mb-6">🔍</div>
                <h1 className="text-3xl font-black text-foreground mb-4">Zoom-Out</h1>
                <p className="text-muted-foreground">Look at the TV. The game will start soon.</p>
                <div className="mt-8 px-6 py-3 bg-card border border-border shadow-sm rounded-full font-bold">
                    {room.players.find((p) => p.id === myPlayerId)?.name ?? 'You'}
                </div>
            </div>
        );
    }

    // ── Playing (Zen Mode if Guessed) ───────────────────────────────────────
    if (game.phase === 'playing' || game.phase === 'reveal' || game.phase === 'round_leaderboard') {
        const isCorrect = myPlayer?.guessedCorrectly;

        if (isCorrect || game.phase !== 'playing') {
            // Zen Mode / Waiting Room
            const currentLevel = game.levels[game.round - 1];

            return (
                <div className="min-h-screen bg-[#1A1A1A] flex flex-col items-center justify-center p-8 text-white relative overflow-hidden transition-colors duration-1000">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="z-10 bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl w-full max-w-md text-center shadow-2xl"
                    >
                        <div className="text-6xl mb-6">✨</div>
                        <h2 className="text-3xl font-black mb-2 tracking-tight">
                            {isCorrect ? 'Got it!' : 'Time\'s up!'}
                        </h2>

                        {isCorrect && (
                            <div className="text-5xl font-black text-green-400 my-8 tabular-nums">
                                +{myPlayer.pointsThisRound} <span className="text-xl text-white/50">b</span>
                            </div>
                        )}

                        {(game.phase === 'reveal' || game.phase === 'round_leaderboard') && currentLevel && (
                            <div className="mt-8 pt-8 border-t border-white/10 text-left">
                                <p className="text-white/40 uppercase tracking-widest text-xs font-bold mb-3">The answer was</p>
                                <div className="text-3xl font-black text-white tracking-tight mb-6 capitalize">
                                    {currentLevel.answers[0]}
                                </div>
                                <p className="text-white/40 uppercase tracking-widest text-xs font-bold mb-2">Did you know...</p>
                                <p className="text-white/80 leading-relaxed font-medium">
                                    {currentLevel.funFact}
                                </p>
                            </div>
                        )}

                        {game.phase === 'playing' && (
                            <p className="text-white/40 mt-8 font-medium">
                                Waiting for other players...
                            </p>
                        )}
                    </motion.div>

                    {/* Soft background glow */}
                    <div className="absolute inset-0 bg-green-500/10 blur-[100px] pointer-events-none" />
                </div>
            );
        }

        // Active Guessing UI
        return (
            <div className="min-h-screen bg-background flex flex-col p-6 relative">
                <div className="fixed top-4 right-4 z-50"><ThemeToggle /></div>
                <div className="flex justify-between items-center mb-12 mt-4 px-2">
                    <span className="text-muted-foreground font-bold uppercase tracking-widest text-sm">Round {game.round}</span>
                    <span className="font-bold text-foreground">{myPlayer?.score} pts</span>
                </div>

                <div className="flex-1 flex flex-col justify-center items-center gap-8 max-w-md w-full mx-auto">
                    <div className="text-foreground text-2xl font-black tracking-tight text-center">
                        What&apos;s in the image?
                    </div>

                    <form onSubmit={handleSubmit} className="w-full relative">
                        <motion.div
                            animate={isShaking ? { x: [-10, 10, -10, 10, 0] } : {}}
                            transition={{ duration: 0.4 }}
                        >
                            <input
                                ref={inputRef}
                                type="text"
                                value={guess}
                                onChange={(e) => setGuess(e.target.value)}
                                placeholder="Type your guess..."
                                className="w-full bg-card border-2 border-border text-2xl font-bold rounded-2xl p-6 shadow-sm focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/20 transition-all text-center"
                                autoFocus
                                autoComplete="off"
                                autoCorrect="off"
                                spellCheck="false"
                            />
                        </motion.div>

                        <button
                            type="submit"
                            disabled={!guess.trim()}
                            className="w-full mt-6 bg-accent text-accent-foreground py-5 rounded-2xl font-black text-xl hover:bg-accent-hover disabled:bg-border disabled:text-muted-foreground transition-colors shadow-lg active:scale-95"
                        >
                            Guess
                        </button>
                    </form>

                    {/* Future: Quick completion/autocomplete pills could go here */}
                    <p className="text-muted-foreground text-sm text-center font-medium px-4 mt-8">
                        You can guess as many times as you like — no penalty!
                    </p>
                </div>
            </div>
        );
    }

    // ── Game Over View ──────────────────────────────────────────────────────
    if (game.phase === 'game_over') {
        const isWinner = game.winnerId === myPlayerId;
        return (
            <div className="min-h-screen bg-[#1A1A1A] flex flex-col items-center justify-center gap-6 p-6 text-white text-center">
                <div className="text-8xl mb-4">{isWinner ? '👑' : '👏'}</div>
                <h2 className="text-4xl font-black tracking-tight mb-2">
                    {isWinner ? 'Victory!' : 'Game Over'}
                </h2>
                <div className="text-3xl font-bold text-white/50 mb-12">
                    {myPlayer?.score} pts
                </div>

                <button
                    onClick={handlePlayAgain}
                    className="bg-card text-card-foreground px-10 py-5 rounded-2xl font-bold text-xl hover:scale-105 transition-transform shadow-xl w-full max-w-sm"
                >
                    Back to Lobby
                </button>
            </div>
        );
    }

    return null;
}
