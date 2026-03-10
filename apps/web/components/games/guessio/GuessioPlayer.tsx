'use client';

import { RoomState, GuessioGameState } from '@lesury/game-logic';
import GameLayout from '@/components/layout/GameLayout';
import { ThemeToggle } from '@/components/ThemeToggle';

interface GuessioPlayerProps {
    state: {
        room: RoomState;
        game: GuessioGameState;
    };
}

export default function GuessioPlayer({ state }: GuessioPlayerProps) {
    const { room, game } = state;

    // The player id inside game state should match the room canonical player id
    const currentPlayerId = room.players.find(p => p.id === (window as any)?.__partySocket?.id)?.id || 'unknown'; // Note: session ID could be used instead

    // In actual implementation, we'll need true auth/session ID matching here
    const handleSelectWord = (word: string, bet: number) => {
        const socket = (window as any).__partySocket;
        if (socket) {
            socket.send(JSON.stringify({
                type: 'select_word_and_bet',
                word,
                bet,
                timestamp: Date.now()
            }));
        }
    };

    const handleReportResult = (result: 'success' | 'failure') => {
        const socket = (window as any).__partySocket;
        if (socket) {
            socket.send(JSON.stringify({
                type: 'report_result',
                result
            }));
        }
    };

    if (room.status === 'waiting') {
        return (
            <GameLayout backUrl="/join" theme="dark">
                <div className="fixed top-4 right-4 z-50"><ThemeToggle /></div>
                <div className="flex items-center justify-center min-h-screen text-white p-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold mb-4">Waiting for Host...</h2>
                        <p className="text-xl">You are connected to room {room.roomCode}</p>
                    </div>
                </div>
            </GameLayout>
        );
    }

    if (!game) return null;

    return (
        <GameLayout backUrl="/join" theme="dark">
            <div className="fixed top-4 right-4 z-50"><ThemeToggle /></div>
            <div className="flex flex-col items-center p-6 min-h-screen text-white">
                <h1 className="text-3xl font-bold mb-6">Guessio</h1>

                <div className="bg-white/10 p-6 rounded-2xl w-full max-w-md border border-white/20 mb-6">
                    <h2 className="text-xl border-b border-white/20 pb-2 mb-4">Current Turn</h2>
                    <p>Status: <span className="font-bold capitalize text-accent">{game.status}</span></p>
                    <p>Category: <span className="font-bold capitalize">{game.activeCategory}</span></p>
                </div>

                {/* Only shown when it's choosing status */}
                {game.status === 'choosing' && (
                    <div className="w-full max-w-md space-y-4">
                        <h3 className="text-xl font-bold mb-2">Options</h3>
                        <div className="flex flex-col gap-4">
                            {game.currentOptionsForType?.map((word, idx) => (
                                <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col items-center">
                                    <span className="text-2xl font-bold mb-4">{word}</span>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((bet) => (
                                            <button
                                                key={bet}
                                                onClick={() => handleSelectWord(word, bet)}
                                                className="bg-accent hover:bg-accent-hover active:scale-95 transition-all text-accent-foreground font-bold w-12 h-12 rounded-full"
                                            >
                                                {bet}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Status when reporting resolution */}
                {game.status === 'recording_resolution' && (
                    <div className="w-full max-w-md mt-4">
                        <div className="bg-primary text-primary-foreground border border-white/20 p-6 rounded-2xl text-center">
                            <h3 className="text-2xl mb-4">Timer is running!</h3>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => handleReportResult('success')}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl"
                                >
                                    Success
                                </button>
                                <button
                                    onClick={() => handleReportResult('failure')}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl"
                                >
                                    Failure
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </GameLayout>
    );
}
