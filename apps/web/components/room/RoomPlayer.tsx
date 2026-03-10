'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import PartySocket from 'partysocket';
import { RoomState, validateRoomCode } from '@lesury/game-logic';
import Button from '@/app/components/Button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { trackPlayerJoined, trackJoinError } from '@/lib/analytics';

const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST || 'localhost:1999';

interface RoomPlayerProps {
    gameType: string;
    children: (state: { room: RoomState; game: any; myPlayerId: string }) => ReactNode;
    onGameStart?: (roomState: RoomState) => void;
    redirectByRoomState?: (roomState: RoomState) => string | null;
}

export default function RoomPlayer({
    gameType,
    children,
    onGameStart,
    redirectByRoomState,
}: RoomPlayerProps) {
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

    const redirectTarget = roomState && redirectByRoomState ? redirectByRoomState(roomState) : null;

    useEffect(() => {
        if (!roomCode || !playerName) return;

        const conn = new PartySocket({
            host: PARTYKIT_HOST,
            room: roomCode.toLowerCase(),
        });

        conn.addEventListener('open', () => {
            console.log('Connected to room!');
            setConnectionStatus('connected');
            setMyPlayerId(conn.id);

            trackPlayerJoined(roomCode, playerName || 'Player');

            conn.send(
                JSON.stringify({
                    type: 'join',
                    playerName: playerName || 'Player',
                })
            );
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
            trackJoinError(roomCode, 'socket_closed');
        });

        conn.addEventListener('error', () => {
            trackJoinError(roomCode, 'socket_error');
        });

        setSocket(conn);
        setMode('connected');
        (window as any).__partySocket = conn;

        return () => {
            conn.close();
            delete (window as any).__partySocket;
        };
    }, [roomCode, playerName]);

    useEffect(() => {
        if (!redirectTarget && roomState?.status === 'playing' && onGameStart) {
            if (myPlayerId && roomState.roomCode) {
                sessionStorage.setItem(`lobbyPlayerId_${roomState.roomCode}`, myPlayerId);
                sessionStorage.setItem(`lobbyPlayerName_${roomState.roomCode}`, playerName);
            }
            onGameStart(roomState);
        }
    }, [roomState?.status, onGameStart, roomState, myPlayerId, playerName, redirectTarget]);

    useEffect(() => {
        if (redirectTarget) {
            window.location.href = redirectTarget;
        }
    }, [redirectTarget]);

    const handleJoinManually = () => {
        if (validateRoomCode(inputCode) && playerName.trim()) {
            const upperCode = inputCode.toUpperCase();
            setRoomCode(upperCode);
            const newUrl = `/join?room=${upperCode}`;
            window.history.pushState({}, '', newUrl);
        } else {
            trackJoinError(inputCode, 'invalid_code_or_name');
        }
    };

    if (roomState?.status === 'playing' && gameState && roomState) {
        return <>{children({ room: roomState, game: gameState, myPlayerId })}</>;
    }

    if (redirectTarget) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="rounded-3xl max-w-md w-full">
                    <CardContent className="p-8 text-center">
                        <div className="animate-spin w-8 h-8 border-2 border-border border-t-foreground rounded-full mx-auto mb-4" />
                        <h1 className="text-2xl font-bold mb-2">Redirecting...</h1>
                        <p className="text-muted-foreground">
                            This room uses a dedicated join flow.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (mode === 'input') {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="rounded-3xl max-w-md w-full">
                    <CardContent className="p-8">
                        <h1 className="text-3xl font-bold text-center mb-6">Join Game</h1>

                        <div className="mb-4">
                            <Label htmlFor="playerName" className="text-sm font-semibold mb-2">Your Name</Label>
                            <Input
                                id="playerName"
                                type="text"
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                                placeholder="Enter your name"
                                maxLength={20}
                                className="bg-secondary border-border focus-visible:ring-accent rounded-xl py-3"
                            />
                        </div>

                        <div className="mb-6">
                            <Label htmlFor="roomCode" className="text-sm font-semibold mb-2">Room Code</Label>
                            <Input
                                id="roomCode"
                                type="text"
                                value={inputCode}
                                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                                placeholder="ABC123"
                                maxLength={6}
                                className="bg-secondary text-2xl font-bold text-center py-4 rounded-xl border-border focus-visible:ring-accent placeholder:text-muted-foreground h-auto"
                            />
                        </div>

                        <Button onClick={handleJoinManually} className="w-full">
                            Join Room
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="rounded-3xl max-w-md w-full">
                <CardContent className="p-8">
                    {roomState ? (
                        <>
                            <h1 className="text-3xl font-bold text-center mb-4">Connected!</h1>
                            <p className="text-center text-muted-foreground mb-6">
                                Room: <span className="font-bold text-foreground">{roomCode}</span>
                            </p>

                            <div className="bg-secondary rounded-xl p-6 mb-6 text-center">
                                <div className="text-5xl mb-3">⏳</div>
                                <p className="font-semibold">Waiting for host to start...</p>
                                <p className="text-sm text-muted-foreground mt-2">
                                    {roomState.players.filter((p) => !p.isHost).length} player
                                    {roomState.players.filter((p) => !p.isHost).length !== 1 ? 's' : ''}{' '}
                                    connected
                                </p>
                            </div>

                            <p className="text-xs text-muted-foreground text-center">
                                Connection: {connectionStatus}
                            </p>
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <div className="animate-spin w-8 h-8 border-2 border-border border-t-foreground rounded-full mx-auto mb-4" />
                            <p className="text-muted-foreground">Connecting...</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
