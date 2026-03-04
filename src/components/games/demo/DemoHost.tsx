'use client';

import { RoomState, DemoGameState } from '@lesury/game-logic';
import PartySocket from 'partysocket';
import GameLayout from '@/components/layout/GameLayout';

interface DemoHostProps {
    state: {
        room: RoomState;
        game: DemoGameState;
    };
    socket?: PartySocket;
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
            <div className="flex items-center justify-center p-4" style={{ minHeight: 'calc(100vh - 60px)' }}>
                <div className="bg-white rounded-3xl p-8 shadow-lg border border-[#E8E6DC] max-w-2xl w-full">
                    <h1 className="text-3xl font-bold text-center mb-6">
                        Demo Game - Host View
                    </h1>

                    {/* Counter Display */}
                    <div className="bg-[#F0EFEA] rounded-2xl p-12 mb-6 text-center">
                        <div className="text-8xl font-bold text-[#141413] mb-4 tabular-nums">
                            {state.game.counter}
                        </div>
                        <p className="text-[#B0AEA5]">Counter Value</p>
                    </div>

                    {/* Controls */}
                    <div className="flex gap-4 mb-6">
                        <button
                            onClick={handleDecrement}
                            className="flex-1 bg-[#141413] hover:bg-[#2a2a28] text-white text-4xl font-bold py-6 rounded-2xl transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                            −
                        </button>
                        <button
                            onClick={handleIncrement}
                            className="flex-1 bg-[#D97757] hover:bg-[#CC785C] text-white text-4xl font-bold py-6 rounded-2xl transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                            +
                        </button>
                    </div>

                    {/* Player Info */}
                    <div className="bg-[#F0EFEA] rounded-xl p-4 text-center">
                        <p className="text-sm text-[#B0AEA5]">
                            <span className="font-semibold text-[#141413]">
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
