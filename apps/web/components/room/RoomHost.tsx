'use client';

import { useEffect, useState, useRef, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import PartySocket from 'partysocket';
import QRCode from 'qrcode';
import { RoomState, generateRoomCode, generateRoomUrl } from '@lesury/game-logic';
import Button from '@/app/components/Button';
import { Button as ShadcnButton } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { trackRoomCreated } from '@/lib/analytics';

const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST || 'localhost:1999';

interface RoomHostProps {
    gameType: string;
    children: (state: { room: RoomState; game: any }) => ReactNode;
    onGameStart?: (roomState: RoomState) => void;
}

export default function RoomHost({ gameType, children, onGameStart }: RoomHostProps) {
    const router = useRouter();
    const [roomCode, setRoomCode] = useState<string>('');
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    const [roomState, setRoomState] = useState<RoomState | null>(null);
    const [gameState, setGameState] = useState<any>(null);
    const [socket, setSocket] = useState<PartySocket | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<
        'connecting' | 'connected' | 'disconnected'
    >('connecting');
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const code = generateRoomCode();
        setRoomCode(code);

        trackRoomCreated(code);

        const conn = new PartySocket({
            host: PARTYKIT_HOST,
            room: code.toLowerCase(),
        });

        conn.addEventListener('open', () => {
            console.log('Connected to PartyKit as host!');
            setConnectionStatus('connected');

            conn.send(
                JSON.stringify({
                    type: 'join',
                    playerName: 'Host',
                    gameType: gameType,
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
        });

        setSocket(conn);
        (window as any).__partySocket = conn;

        return () => {
            conn.close();
            delete (window as any).__partySocket;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameType]);

    const generateQR = () => {
        if (!canvasRef.current || !roomCode) return;

        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const url = generateRoomUrl(gameType, roomCode, baseUrl);

        console.log('QR: Generating code for URL:', url);

        QRCode.toCanvas(
            canvasRef.current,
            url,
            {
                width: 300,
                margin: 2,
                color: {
                    dark: '#141413',
                    light: '#FAF9F5',
                },
            },
            (error) => {
                if (error) {
                    console.error('QR code generation failed:', error);
                } else {
                    console.log('QR code generated successfully');
                }
            }
        );

        setQrCodeUrl(url);
    };

    const isLobbyVisible = !!roomState && roomState.status !== 'playing';

    useEffect(() => {
        if (!roomCode || !isLobbyVisible) return;

        if (!canvasRef.current) {
            const timer = setTimeout(() => {
                if (canvasRef.current && roomCode) {
                    generateQR();
                }
            }, 100);
            return () => clearTimeout(timer);
        }

        generateQR();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomCode, gameType, isLobbyVisible]);

    const handleStart = () => {
        if (socket && roomState) {
            socket.send(JSON.stringify({ type: 'start' }));
            if (onGameStart) {
                onGameStart(roomState);
            }
        }
    };

    const copyRoomCode = () => {
        navigator.clipboard.writeText(roomCode);
    };

    const copyRoomLink = () => {
        if (qrCodeUrl) {
            navigator.clipboard.writeText(qrCodeUrl);
        }
    };

    if (!roomState || !gameState) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Card className="rounded-3xl max-w-2xl w-full">
                    <CardContent className="p-8 text-center">
                        <div className="animate-spin w-8 h-8 border-2 border-border border-t-foreground rounded-full mx-auto mb-4" />
                        <p className="text-muted-foreground">Setting up room...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (roomState.status === 'playing') {
        return <>{children({ room: roomState, game: gameState })}</>;
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                <ShadcnButton
                    variant="ghost"
                    onClick={() => router.push(`/games/${gameType}`)}
                    className="text-muted-foreground hover:text-foreground mb-4"
                >
                    ← Back
                </ShadcnButton>

                <Card className="rounded-3xl">
                    <CardContent className="p-8">
                        <h1 className="text-3xl font-bold text-center mb-6">Waiting for Players</h1>

                        {/* QR Code */}
                        <div className="bg-secondary rounded-2xl p-6 mb-6">
                            <p className="text-sm text-muted-foreground text-center mb-4">
                                Scan to join on mobile
                            </p>
                            <div className="flex justify-center">
                                <canvas
                                    ref={canvasRef}
                                    width={300}
                                    height={300}
                                    className="rounded-xl"
                                />
                            </div>
                        </div>

                        {/* Room Code */}
                        <div className="bg-secondary rounded-xl p-4 mb-6">
                            <p className="text-xs text-muted-foreground text-center mb-2">
                                Or enter this code manually
                            </p>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 bg-card rounded-lg py-3 px-4 text-center border border-border">
                                    <span className="text-2xl font-bold tracking-wider">
                                        {roomCode}
                                    </span>
                                </div>
                                <ShadcnButton
                                    onClick={copyRoomCode}
                                    className="bg-accent hover:bg-accent-hover text-accent-foreground px-4 py-3"
                                >
                                    📋
                                </ShadcnButton>
                            </div>
                        </div>

                        {/* Player List */}
                        <div className="bg-secondary rounded-xl p-4 mb-6">
                            <h3 className="font-semibold mb-3">
                                Connected Players ({roomState.players.filter((p) => !p.isHost).length})
                            </h3>
                            {roomState.players.filter((p) => !p.isHost).length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    Waiting for players to join...
                                </p>
                            ) : (
                                <ul className="space-y-2">
                                    {roomState.players
                                        .filter((p) => !p.isHost)
                                        .map((player) => (
                                            <li
                                                key={player.id}
                                                className="flex items-center gap-2 bg-card rounded-lg px-3 py-2"
                                            >
                                                <span className="text-xl">{player.avatar || '👤'}</span>
                                                <span className="font-medium">{player.name}</span>
                                            </li>
                                        ))}
                                </ul>
                            )}
                        </div>

                        <Button onClick={handleStart} className="w-full">
                            Start Game
                        </Button>

                        <p className="text-xs text-muted-foreground text-center mt-4">
                            Connection: {connectionStatus}
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
