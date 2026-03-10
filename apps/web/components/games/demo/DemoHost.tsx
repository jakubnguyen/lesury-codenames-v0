'use client';

import { RoomState, DemoGameState } from '@lesury/game-logic';
import GameLayout from '@/components/layout/GameLayout';
import { ThemeToggle } from '@/components/ThemeToggle';

interface DemoHostProps {
    state: {
        room: RoomState;
        game: DemoGameState;
    };
}

export default function DemoHost({ state }: DemoHostProps) {
    const handleIncrement = () => {
        // Socket is managed by RoomHost parent
        const socket = (window as any).__partySocket;
        if (socket) {
            socket.send(JSON.stringify({ type: 'increment' }));
        }
    };

    const handleDecrement = () => {
        const socket = (window as any).__partySocket;
        if (socket) {
            socket.send(JSON.stringify({ type: 'decrement' }));
        }
    };

    return (
        <GameLayout backUrl="/games/demo" theme="light">
            <div className="fixed top-4 right-4 z-50"><ThemeToggle /></div>
            <div
                className="flex items-center justify-center p-4"
                style={{ minHeight: 'calc(100vh - 60px)' }}
            >
                <div className="bg-card rounded-3xl p-8 shadow-lg border border-border max-w-2xl w-full">
                    <h1 className="text-3xl font-bold text-center mb-6">Demo Game - Host View</h1>

                    {/* Counter Display */}
                    <div className="bg-muted rounded-2xl p-12 mb-6 text-center">
                        <div className="text-8xl font-bold text-foreground mb-4 tabular-nums">
                            {state.game.counter}
                        </div>
                        <p className="text-muted-foreground">Counter Value</p>
                    </div>

                    {/* Controls */}
                    <div className="flex gap-4 mb-6">
                        <button
                            onClick={handleDecrement}
                            className="flex-1 bg-primary hover:bg-[#2a2a28] text-primary-foreground text-4xl font-bold py-6 rounded-2xl transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                            −
                        </button>
                        <button
                            onClick={handleIncrement}
                            className="flex-1 bg-accent hover:bg-accent-hover text-accent-foreground text-4xl font-bold py-6 rounded-2xl transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                            +
                        </button>
                    </div>

                    {/* Player Info */}
                    <div className="bg-muted rounded-xl p-4 text-center">
                        <p className="text-sm text-muted-foreground">
                            <span className="font-semibold text-foreground">
                                {state.room.players.length}
                            </span>{' '}
                            player{state.room.players.length !== 1 ? 's' : ''} connected
                        </p>
                    </div>
                </div>
            </div>
        </GameLayout>
    );
}
