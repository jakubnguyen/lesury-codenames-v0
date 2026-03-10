'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { GameHeader } from '@/components/games/GameHeader';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from 'next-themes';
import QRCode from 'qrcode';
import { generateRoomUrl } from '@lesury/game-logic';
import type { RoomState, MindshotGameState, ArenaSize, Phase, Direction, Position, RoundEvent } from '@lesury/game-logic';
import { PLAYER_COLOR_HEX } from '@lesury/game-logic';
import Grid, { type ProjectileData } from './Grid';
import PlayerHUD from './PlayerHUD';
import GameOver from './GameOver';
import { trackGameCompleted } from '@/lib/analytics';

const DIRECTION_DELTAS: Record<Direction, { dr: number; dc: number }> = {
    up: { dr: -1, dc: 0 },
    down: { dr: 1, dc: 0 },
    left: { dr: 0, dc: -1 },
    right: { dr: 0, dc: 1 },
};

// Phase auto-advance delays (ms)
const PHASE_DELAYS: Partial<Record<Phase, number>> = {
    'resolution-move1': 1500,
    'resolution-move2': 1500,
    'resolution-shoot': 2500,
    'resolution-zone': 2000,
    'round-summary': 3000,
};

const PHASE_LABELS: Partial<Record<Phase, string>> = {
    'planning': 'Planning Phase — Pick your moves!',
    'resolution-move1': 'Move 1',
    'resolution-move2': 'Move 2',
    'resolution-shoot': 'Shoot',
    'resolution-zone': 'Danger Zone',
    'round-summary': 'Round Summary',
};

function traceToEdge(from: Position, delta: { dr: number; dc: number }, boardSize: number): Position {
    let r = from.row;
    let c = from.col;
    while (true) {
        const nr = r + delta.dr;
        const nc = c + delta.dc;
        if (nr < 0 || nr >= boardSize || nc < 0 || nc >= boardSize) break;
        r = nr;
        c = nc;
    }
    return { row: r, col: c };
}

interface MindshotHostProps {
    state: {
        room: RoomState;
        game: MindshotGameState;
    };
    socket?: any;
}

export default function MindshotHost({ state, socket: propSocket }: MindshotHostProps) {
    const { room, game } = state;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const planningTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const { resolvedTheme } = useTheme();

    // Settings state
    const [arenaSize, setArenaSize] = useState<ArenaSize>('medium');
    const [planningDuration, setPlanningDuration] = useState<15 | 20 | 30>(20);
    const [countdown, setCountdown] = useState(20);

    // Projectile animation state
    const [activeProjectiles, setActiveProjectiles] = useState<ProjectileData[]>([]);
    const [hitCells, setHitCells] = useState<Position[]>([]);
    const shootTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const getSocket = () => propSocket ?? (typeof window !== 'undefined' ? (window as any).__partySocket : null);

    // Track game completion
    useEffect(() => {
        if (game.phase === 'game-over') {
            trackGameCompleted('Mindshot', 0);
        }
    }, [game.phase]);

    // Auto-advance through resolution phases
    useEffect(() => {
        const phase = game.phase;
        let delay = PHASE_DELAYS[phase];
        if (!delay) return;

        // For shoot phase, scale delay based on number of actual shots
        if (phase === 'resolution-shoot') {
            const currentStep = game.resolutionSteps[game.currentStep];
            const shotCount = currentStep?.events.filter(
                (e) => e.type === 'shoot' && e.direction !== 'skip'
            ).length ?? 0;
            delay = Math.max(delay, shotCount * 600 + 500);
        }

        advanceTimerRef.current = setTimeout(() => {
            getSocket()?.send(JSON.stringify({ type: 'advance_phase' }));
        }, delay);

        return () => {
            if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
        };
    }, [game.phase, game.currentStep]);

    // Planning timer countdown
    useEffect(() => {
        if (game.phase !== 'planning') {
            if (planningTimerRef.current) clearInterval(planningTimerRef.current);
            return;
        }

        setCountdown(game.planningDuration);
        const startTime = Date.now();

        planningTimerRef.current = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const remaining = Math.max(0, game.planningDuration - elapsed);
            setCountdown(remaining);

            if (remaining <= 0) {
                if (planningTimerRef.current) clearInterval(planningTimerRef.current);
                getSocket()?.send(JSON.stringify({ type: 'end_planning' }));
            }
        }, 250);

        return () => {
            if (planningTimerRef.current) clearInterval(planningTimerRef.current);
        };
    }, [game.phase, game.round]);

    // Projectile animation during shoot phase
    useEffect(() => {
        if (game.phase !== 'resolution-shoot') {
            setActiveProjectiles([]);
            setHitCells([]);
            return;
        }

        // Extract shoot events from the current resolution step
        const currentStep = game.resolutionSteps[game.currentStep];
        if (!currentStep) return;

        const shootEvents = currentStep.events.filter(
            (e): e is Extract<RoundEvent, { type: 'shoot' }> =>
                e.type === 'shoot' && e.direction !== 'skip'
        );

        if (shootEvents.length === 0) return;

        // Compute projectile data for each shot
        const projectileQueue: { proj: ProjectileData; hitPos: Position | null }[] = [];

        for (const evt of shootEvents) {
            const shooter = game.players[evt.playerId];
            if (!shooter) continue;

            const dir = evt.direction as Direction;
            const delta = DIRECTION_DELTAS[dir];
            const from = shooter.position;

            // Compute end position: hit target or grid edge
            let to: Position;
            let hitPos: Position | null = null;

            if (evt.hit) {
                const target = game.players[evt.hit];
                if (target) {
                    to = target.position;
                    hitPos = target.position;
                }  else {
                    to = traceToEdge(from, delta, game.arena.boardSize);
                }
            } else {
                to = traceToEdge(from, delta, game.arena.boardSize);
            }

            projectileQueue.push({
                proj: {
                    id: `shot-${evt.playerId}`,
                    from,
                    to,
                    color: PLAYER_COLOR_HEX[shooter.color],
                    hit: !!evt.hit,
                },
                hitPos,
            });
        }

        // Animate shots sequentially
        const SHOT_DURATION = 500; // ms per shot animation
        let idx = 0;

        function showNextShot() {
            if (idx >= projectileQueue.length) {
                setActiveProjectiles([]);
                setHitCells([]);
                return;
            }

            const { proj, hitPos } = projectileQueue[idx];
            setActiveProjectiles([proj]);
            setHitCells([]);

            // After projectile travels, show hit flash
            shootTimerRef.current = setTimeout(() => {
                if (hitPos) {
                    setHitCells([hitPos]);
                }
                // Clear projectile and move to next
                shootTimerRef.current = setTimeout(() => {
                    setActiveProjectiles([]);
                    setHitCells([]);
                    idx++;
                    showNextShot();
                }, 200);
            }, 350);
        }

        showNextShot();

        return () => {
            if (shootTimerRef.current) clearTimeout(shootTimerRef.current);
        };
    }, [game.phase, game.currentStep]);

    // QR code for lobby
    useEffect(() => {
        if (game.phase !== 'lobby' || !canvasRef.current) return;
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const url = generateRoomUrl('mindshot', room.roomCode, baseUrl);

        const qrColors = resolvedTheme === 'dark'
            ? { dark: '#F0EFEA', light: '#2E2E2C' }
            : { dark: '#191917', light: '#FFFFFF' };

        QRCode.toCanvas(
            canvasRef.current,
            url,
            { width: 250, margin: 2, color: qrColors },
            (err) => { if (err) console.error('QR generation failed:', err); }
        );
    }, [game.phase, room.roomCode, resolvedTheme]);

    // Count ready players
    const alivePlayers = Object.values(game.players).filter((p) => p.status === 'alive');
    const readyCount = alivePlayers.filter((p) => p.lockedIn).length;

    const handleStartGame = () => {
        getSocket()?.send(JSON.stringify({
            type: 'start_game',
            arenaSize,
            planningDuration,
        }));
    };

    const handlePlayAgain = () => {
        getSocket()?.send(JSON.stringify({ type: 'play_again' }));
    };

    // ── Lobby ────────────────────────────────────────────────────────────────
    if (game.phase === 'lobby') {
        const nonHostPlayers = room.players.filter((p: any) => !p.isHost && p.name !== 'Host');

        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 gap-4 relative">
                <GameHeader />

                <h1 className="text-3xl font-bold text-foreground text-center">Mindshot</h1>

                <div className="flex gap-8 max-w-5xl w-full">
                    {/* LEFT: QR + Room Code + Players */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex-1 bg-card rounded-xl p-8 shadow-2xl flex flex-col"
                    >
                        <p className="text-muted-foreground text-center text-base mb-4">
                            Scan to join
                        </p>
                        <div className="flex justify-center mb-6">
                            <canvas ref={canvasRef} width={250} height={250} className="rounded-md" />
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
                                <p className="text-muted-foreground text-sm">Waiting for players to join…</p>
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

                        {/* Arena Size */}
                        <div className="mb-6">
                            <label className="block text-sm font-bold text-foreground mb-2">
                                Arena Size
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {([
                                    { value: 'small' as const, label: 'Small 8\u00D78' },
                                    { value: 'medium' as const, label: 'Medium 10\u00D710' },
                                    { value: 'large' as const, label: 'Large 12\u00D712' },
                                ]).map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setArenaSize(opt.value)}
                                        className={`px-4 py-3 rounded-md font-bold text-sm transition-all ${
                                            arenaSize === opt.value
                                                ? 'bg-accent text-accent-foreground shadow-md'
                                                : 'bg-background text-foreground border border-border hover:bg-secondary'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Planning Timer */}
                        <div className="mb-8">
                            <label className="block text-sm font-bold text-foreground mb-2">
                                Planning Timer
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {([15, 20, 30] as const).map((dur) => (
                                    <button
                                        key={dur}
                                        onClick={() => setPlanningDuration(dur)}
                                        className={`px-4 py-3 rounded-md font-bold text-sm transition-all ${
                                            planningDuration === dur
                                                ? 'bg-accent text-accent-foreground shadow-md'
                                                : 'bg-background text-foreground border border-border hover:bg-secondary'
                                        }`}
                                    >
                                        {dur}s
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1" />

                        <button
                            type="button"
                            onClick={handleStartGame}
                            className={`w-full px-6 py-4 rounded-md font-bold text-lg transition-opacity cursor-pointer ${
                                nonHostPlayers.length >= 2
                                    ? 'bg-accent text-accent-foreground hover:opacity-90'
                                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                            }`}
                        >
                            {nonHostPlayers.length >= 2
                                ? `Start Game (${nonHostPlayers.length} player${nonHostPlayers.length !== 1 ? 's' : ''})`
                                : 'Start Game'}
                        </button>
                    </motion.div>
                </div>
            </div>
        );
    }

    // ── Game Over ─────────────────────────────────────────────────────────────
    if (game.phase === 'game-over') {
        return <GameOver state={state} onPlayAgain={handlePlayAgain} />;
    }

    // ── Gameplay (planning / resolution / summary) ───────────────────────────
    const phaseLabel = PHASE_LABELS[game.phase] ?? '';

    return (
        <div className="min-h-screen bg-[#2A2A2A] flex flex-col items-center justify-center select-none overflow-hidden">
            {/* Header bar */}
            <div className="w-full flex items-center justify-between px-8 py-4 absolute top-0 left-0 right-0 z-10">
                <div className="text-white/60 text-sm font-mono uppercase tracking-widest">
                    BATTLE ROYALE
                </div>
                {game.round > 0 && (
                    <div className="text-white/60 text-sm font-mono">
                        Round {game.round}
                    </div>
                )}
                <div className="text-white/40 text-sm font-mono">
                    {room.roomCode}
                </div>
                <ThemeToggle />
            </div>

            {/* Phase banner */}
            <div className="absolute top-16 left-0 right-0 flex justify-center pointer-events-none z-10">
                {game.phase === 'planning' && (
                    <div className="flex items-center gap-4">
                        <div className="bg-accent text-accent-foreground px-6 py-2 rounded-xl font-bold text-lg shadow-lg">
                            {phaseLabel} — {readyCount}/{alivePlayers.length} ready
                        </div>
                        <div
                            className={`bg-[#333] px-4 py-2 rounded-xl font-bold text-2xl tabular-nums shadow-lg ${
                                countdown <= 5 ? 'text-red-400 animate-pulse' : 'text-white'
                            }`}
                        >
                            {countdown}
                        </div>
                    </div>
                )}
                {game.phase === 'resolution-shoot' && activeProjectiles.length > 0 && (
                    <div className="bg-[#2A2A2A]/80 border border-white/20 text-white px-6 py-2 rounded-xl font-semibold text-lg backdrop-blur-sm shadow-xl flex items-center gap-3">
                        <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: activeProjectiles[0].color }}
                        />
                        <span>{activeProjectiles[0].hit ? 'Hit!' : 'Shoot'}</span>
                    </div>
                )}
                {game.phase.startsWith('resolution-') && (game.phase !== 'resolution-shoot' || activeProjectiles.length === 0) && (
                    <div className="bg-[#2A2A2A]/80 border border-white/20 text-white px-6 py-2 rounded-xl font-semibold text-lg backdrop-blur-sm shadow-xl">
                        {phaseLabel}
                    </div>
                )}
                {game.phase === 'round-summary' && (
                    <div className="bg-accent/90 text-accent-foreground px-6 py-2 rounded-xl font-bold text-lg shadow-lg">
                        {game.roundEvents
                            .filter((e) => e.type === 'elimination')
                            .map((e) => {
                                if (e.type !== 'elimination') return null;
                                const name = room.players.find((p) => p.id === e.playerId)?.name ?? e.playerId;
                                return `${name} ELIMINATED!`;
                            })
                            .filter(Boolean)
                            .join(' \u2022 ') || 'Round Complete'}
                    </div>
                )}
            </div>

            {/* Grid */}
            <div className="flex-1 flex items-center justify-center w-full pt-24 pb-20">
                <div style={{ filter: 'drop-shadow(0 4px 24px rgba(0,0,0,0.4))' }}>
                    <Grid
                        grid={game.grid}
                        players={game.players}
                        boardSize={game.arena.boardSize}
                        projectiles={activeProjectiles}
                        hitCells={hitCells}
                    />
                </div>
            </div>

            {/* Player HUD */}
            <div className="absolute bottom-0 left-0 right-0 pb-6 z-10">
                <PlayerHUD
                    players={game.players}
                    roomPlayers={room.players}
                    showReady={game.phase === 'planning'}
                />
            </div>
        </div>
    );
}
