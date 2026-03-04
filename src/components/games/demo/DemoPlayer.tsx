'use client';

import { RoomState, DemoGameState } from '@lesury/game-logic';
import GameLayout from '@/components/layout/GameLayout';

interface DemoPlayerProps {
    state: {
        room: RoomState;
        game: DemoGameState;
    };
}

export default function DemoPlayer({ state }: DemoPlayerProps) {
    const handleIncrement = () => {
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
        <GameLayout backUrl="/games/demo" theme="light" backLabel="← Back">
            <div className="flex items-center justify-center p-4" style={{ minHeight: 'calc(100vh - 60px)' }}>
                <div className="bg-white rounded-3xl p-8 shadow-lg border border-[#E8E6DC] max-w-md w-full">
                    <h1 className="text-2xl font-bold text-center mb-6">
                        Demo Game - Player
                    </h1>

                    {/* Counter Display */}
                    <div className="bg-[#F0EFEA] rounded-2xl p-8 mb-6 text-center">
                        <div className="text-7xl font-bold text-[#141413] mb-2 tabular-nums">
                            {state.game.counter}
                        </div>
                        <p className="text-sm text-[#B0AEA5]">Current Count</p>
                    </div>

                    {/* Mobile-friendly controls */}
                    <div className="space-y-4">
                        <button
                            onClick={handleIncrement}
                            className="w-full bg-[#D97757] hover:bg-[#CC785C] active:bg-[#B86947] text-white text-3xl font-bold py-8 rounded-2xl transition-colors touch-manipulation"
                        >
                            + Increase
                        </button>
                        <button
                            onClick={handleDecrement}
                            className="w-full bg-[#141413] hover:bg-[#2a2a28] active:bg-[#3a3a38] text-white text-3xl font-bold py-8 rounded-2xl transition-colors touch-manipulation"
                        >
                            − Decrease
                        </button>
                    </div>

                    <p className="text-xs text-[#B0AEA5] text-center mt-6">
                        {state.room.players.length} player{state.room.players.length !== 1 ? 's' : ''} in room
                    </p>
                </div>
            </div>
        </GameLayout>
    );
}
