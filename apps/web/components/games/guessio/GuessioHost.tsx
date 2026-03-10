'use client';

import { useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { GameHeader } from '@/components/games/GameHeader';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from 'next-themes';
import QRCode from 'qrcode';
import { RoomState, GuessioGameState, generateRoomUrl } from '@lesury/game-logic';

interface GuessioHostProps {
    state: {
        room: RoomState;
        game: GuessioGameState;
    };
    socket?: any;
}

export default function GuessioHost({ state, socket: propSocket }: GuessioHostProps) {
    const { room, game } = state;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { resolvedTheme } = useTheme();

    const getSocket = useCallback(
        () => propSocket ?? (typeof window !== 'undefined' ? (window as any).__partySocket : null),
        [propSocket]
    );

    useEffect(() => {
        if (room.status !== 'waiting' || !canvasRef.current) return;
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const url = generateRoomUrl('guessio', room.roomCode, baseUrl);

        const qrColors = resolvedTheme === 'dark'
            ? { dark: '#F0EFEA', light: '#2E2E2C' }
            : { dark: '#191917', light: '#FFFFFF' };

        QRCode.toCanvas(
            canvasRef.current,
            url,
            { width: 250, margin: 2, color: qrColors },
            (err) => { if (err) console.error('QR generation failed:', err); }
        );
    }, [room.status, room.roomCode, resolvedTheme]);

    const handleStartGame = () => {
        const s = getSocket();
        if (!s) return;
        s.send(JSON.stringify({ type: 'start_game', teamIds: ['teamA', 'teamB'] }));
    };

    const handleNextTurn = () => {
        const s = getSocket();
        if (s) s.send(JSON.stringify({ type: 'next_turn' }));
    };

    // ── Lobby ────────────────────────────────────────────────────────────────
    if (room.status === 'waiting') {
        const nonHostPlayers = room.players.filter((p: any) => !p.isHost && p.name !== 'Host');

        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 gap-4 relative">
                <GameHeader />

                <h1 className="text-3xl font-bold text-foreground text-center">Guessio</h1>

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

                        <div className="mb-8">
                            <p className="text-sm font-bold text-foreground mb-2">Teams</p>
                            <p className="text-muted-foreground text-sm">
                                Players will be automatically split into 2 teams.
                                Minimum 4 players required.
                            </p>
                        </div>

                        <div className="flex-1" />

                        <button
                            type="button"
                            onClick={handleStartGame}
                            className={`w-full px-6 py-4 rounded-md font-bold text-lg transition-opacity cursor-pointer ${
                                nonHostPlayers.length >= 4
                                    ? 'bg-accent text-accent-foreground hover:opacity-90'
                                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                            }`}
                        >
                            {nonHostPlayers.length >= 4
                                ? `Start Game (${nonHostPlayers.length} player${nonHostPlayers.length !== 1 ? 's' : ''})`
                                : 'Start Game'}
                        </button>
                    </motion.div>
                </div>
            </div>
        );
    }

    // ── Gameplay ──────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col items-center justify-center p-8 bg-background min-h-screen">
            <div className="fixed top-4 right-4 z-50"><ThemeToggle /></div>
            <div className="bg-card rounded-3xl p-8 shadow-lg border border-border max-w-4xl w-full">
                <h1 className="text-4xl font-bold text-center mb-8">Guessio - Host</h1>

                {game && (
                    <div>
                        {/* Scoreboard */}
                        <div className="flex justify-between mb-8">
                            {Object.keys(game.scores || {}).map((teamId) => (
                                <div key={teamId} className="bg-muted rounded-2xl p-6 text-center flex-1 mx-2">
                                    <h3 className="text-xl font-bold mb-2">{teamId}</h3>
                                    <div className="text-6xl font-bold tabular-nums">
                                        {game.scores[teamId]}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Game State Info */}
                        <div className="bg-muted rounded-2xl p-6 mb-8 text-center">
                            <h3 className="text-2xl font-bold capitalize mb-2 border-b pb-2">Status: {game.status}</h3>
                            <p className="text-lg">Active Player: {game.players?.[game.activePlayerId]?.name || game.activePlayerId}</p>
                            <p className="text-lg">Category: <span className="font-bold capitalize">{game.activeCategory}</span></p>

                            {game.status === 'recording_resolution' && (
                                <div className="mt-4 p-4 bg-muted rounded-xl">
                                    <p className="text-xl">Word: <strong>{game.chosenWord}</strong></p>
                                    <p className="text-xl">Bet: <strong>{game.chosenBet} points</strong></p>
                                    <p className="text-2xl font-bold mt-2 animate-pulse text-red-500">Timer Running: 60s</p>
                                </div>
                            )}

                            {game.status === 'scoring' && (
                                <div className="mt-4">
                                    <p className="text-2xl font-bold mb-4">Result: {game.roundResult}</p>
                                    <button
                                        onClick={handleNextTurn}
                                        className="bg-primary hover:bg-[#2a2a28] text-primary-foreground text-xl font-bold py-4 px-8 rounded-2xl"
                                    >
                                        Next Turn
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Board Visualization */}
                        <div className="text-left">
                            <h4 className="text-xl font-bold mb-2">The Board (First 10 steps)</h4>
                            <div className="flex gap-2 overflow-x-auto pb-4">
                                {game.board?.slice(0, 10).map((cat, idx) => (
                                    <div key={idx} className="bg-secondary min-w-[100px] p-2 rounded text-center text-sm capitalize">
                                        {idx}: {cat}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
