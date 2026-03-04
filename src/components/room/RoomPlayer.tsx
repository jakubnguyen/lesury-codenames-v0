'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import PartySocket from 'partysocket';
import { RoomState, validateRoomCode } from '@lesury/game-logic';
import Button from '@/app/components/Button';

const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST || 'localhost:1999';

interface RoomPlayerProps {
    gameType: string; // Can be 'unknown' if joining without selecting game
    children: (state: { room: RoomState; game: any; myPlayerId: string }) => ReactNode;
    onGameStart?: (roomState: RoomState) => void;
}

export default function RoomPlayer({ gameType, children, onGameStart }: RoomPlayerProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const roomFromUrl = searchParams.get('room');

    const [mode, setMode] = useState<'input' | 'connected'>('input');
    const [roomCode, setRoomCode] = useState('');
    const [inputCode, setInputCode] = useState(roomFromUrl || '');
    const [playerName, setPlayerName] = useState('');
    const [roomState, setRoomState] = useState<RoomState | null>(null);
    const [gameState, setGameState] = useState<any>(null);
    const [socket, setSocket] = useState<PartySocket | null>(null);
    const [myPlayerId, setMyPlayerId] = useState('');
    const [connectionStatus, setConnectionStatus] = useState<string>('');

    // Connect to room when roomCode is set
    useEffect(() => {
        if (!roomCode || !playerName) return;

        const conn = new PartySocket({
            host: PARTYKIT_HOST,
            room: roomCode.toLowerCase(),
        });

        conn.addEventListener('open', () => {
            console.log('Connected to room!');
            setConnectionStatus('connected');
            // Capture our own socket ID — this is what the server uses as player.id
            setMyPlayerId(conn.id);

            // Join as player
            conn.send(JSON.stringify({
                type: 'join',
                playerName: playerName || 'Player'
            }));
        });

        conn.addEventListener('message', (evt) => {
            try {
                const data = JSON.parse(evt.data as string);
                if (data.type === 'sync') {
                    setRoomState(data.room);
                    setGameState(data.game);
                }
            } catch (e) {
                console.error('Failed to parse message:', e);
            }
        });

        conn.addEventListener('close', () => {
            setConnectionStatus('disconnected');
        });

        setSocket(conn);
        setMode('connected');
        // Make socket available globally for child components
        (window as any).__partySocket = conn;

        return () => {
            conn.close();
            delete (window as any).__partySocket;
        };
    }, [roomCode, playerName]);

    // Detect game start and trigger callback
    useEffect(() => {
        if (roomState?.status === 'playing' && onGameStart) {
            // Save our lobby socket ID to sessionStorage so the game page
            // can use the same player identity after the redirect creates a new socket.
            if (myPlayerId && roomState.roomCode) {
                sessionStorage.setItem(`lobbyPlayerId_${roomState.roomCode}`, myPlayerId);
                sessionStorage.setItem(`lobbyPlayerName_${roomState.roomCode}`, playerName);
            }
            onGameStart(roomState);
        }
    }, [roomState?.status, onGameStart, roomState, myPlayerId]);

    const handleJoinManually = () => {
        if (validateRoomCode(inputCode) && playerName.trim()) {
            const upperCode = inputCode.toUpperCase();
            setRoomCode(upperCode);
            // Update URL to include room param
            const newUrl = `/join?room=${upperCode}`;
            window.history.pushState({}, '', newUrl);
        }
    };

    // If game is playing, show game component
    if (roomState?.status === 'playing' && gameState) {
        return <>{children({ room: roomState, game: gameState, myPlayerId })}</>;
    }

    // Input/Scan mode
    if (mode === 'input') {
        return (
            <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-8 shadow-lg border border-[#E8E6DC] max-w-md w-full">
                    <h1 className="text-3xl font-bold text-center mb-6">
                        Join Game
                    </h1>

                    {/* Player Name */}
                    <div className="mb-4">
                        <label className="block text-sm font-semibold mb-2">Your Name</label>
                        <input
                            type="text"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            placeholder="Enter your name"
                            maxLength={20}
                            className="w-full bg-[#F0EFEA] text-[#141413] px-4 py-3 rounded-xl border border-[#E8E6DC] focus:border-[#D97757] focus:outline-none focus:ring-2 focus:ring-[#D97757]/20"
                        />
                    </div>

                    {/* Room Code */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold mb-2">Room Code</label>
                        <input
                            type="text"
                            value={inputCode}
                            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                            placeholder="ABC123"
                            maxLength={6}
                            className="w-full bg-[#F0EFEA] text-[#141413] text-2xl font-bold text-center py-4 rounded-xl border border-[#E8E6DC] focus:border-[#D97757] focus:outline-none focus:ring-2 focus:ring-[#D97757]/20 placeholder-[#B0AEA5]"
                        />
                    </div>

                    <Button
                        onClick={handleJoinManually}
                        className="w-full"
                    >
                        Join Room
                    </Button>
                </div>
            </div>
        );
    }

    // Connected / Waiting mode
    return (
        <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-[#E8E6DC] max-w-md w-full">
                {roomState ? (
                    <>
                        <h1 className="text-3xl font-bold text-center mb-4">
                            Connected!
                        </h1>
                        <p className="text-center text-[#B0AEA5] mb-6">
                            Room: <span className="font-bold text-[#141413]">{roomCode}</span>
                        </p>

                        <div className="bg-[#F0EFEA] rounded-xl p-6 mb-6 text-center">
                            <div className="text-5xl mb-3">⏳</div>
                            <p className="font-semibold">Waiting for host to start...</p>
                            <p className="text-sm text-[#B0AEA5] mt-2">
                                {roomState.players.filter(p => !p.isHost).length} player{roomState.players.filter(p => !p.isHost).length !== 1 ? 's' : ''} connected
                            </p>
                        </div>

                        <p className="text-xs text-[#B0AEA5] text-center">
                            Connection: {connectionStatus}
                        </p>
                    </>
                ) : (
                    <div className="text-center py-12">
                        <div className="animate-spin w-8 h-8 border-2 border-[#E8E6DC] border-t-[#141413] rounded-full mx-auto mb-4" />
                        <p className="text-[#B0AEA5]">Connecting...</p>
                    </div>
                )}
            </div>
        </div>
    );
}
