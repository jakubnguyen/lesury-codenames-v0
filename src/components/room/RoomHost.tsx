'use client';

import { useEffect, useState, useRef, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import PartySocket from 'partysocket';
import QRCode from 'qrcode';
import { RoomState, generateRoomCode, generateRoomUrl } from '@lesury/game-logic';
import Button from '@/app/components/Button';

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
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Create room and connect on mount
    useEffect(() => {
        const code = generateRoomCode();
        setRoomCode(code);

        // Connect to PartyKit
        const conn = new PartySocket({
            host: PARTYKIT_HOST,
            room: code.toLowerCase(),
        });

        conn.addEventListener('open', () => {
            console.log('Connected to PartyKit as host!');
            setConnectionStatus('connected');

            // Join as host and specify game type
            conn.send(JSON.stringify({
                type: 'join',
                playerName: 'Host',
                gameType: gameType
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
        // Make socket available globally for child components
        (window as any).__partySocket = conn;

        return () => {
            conn.close();
            delete (window as any).__partySocket;
        };
    }, []);

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

    // Generate QR code
    useEffect(() => {
        if (!roomCode) {
            console.log('QR: No room code yet');
            return;
        }

        if (!canvasRef.current) {
            console.log('QR: Canvas ref not ready');
            // Retry after a short delay to wait for canvas to mount
            const timer = setTimeout(() => {
                if (canvasRef.current && roomCode) {
                    generateQR();
                }
            }, 100);
            return () => clearTimeout(timer);
        }

        generateQR();
    }, [roomCode, gameType, roomState]); // Add roomState to re-trigger when canvas appears

    const handleStart = () => {
        if (socket && roomState) {
            socket.send(JSON.stringify({ type: 'start' }));
            // Call callback if provided (for redirects)
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

    // Show loading until connected with room  state
    if (!roomState || !gameState) {
        return (
            <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center">
                <div className="bg-white rounded-3xl p-8 shadow-lg border border-[#E8E6DC] max-w-2xl w-full">
                    <div className="text-center">
                        <div className="animate-spin w-8 h-8 border-2 border-[#E8E6DC] border-t-[#141413] rounded-full mx-auto mb-4" />
                        <p className="text-[#B0AEA5]">Setting up room...</p>
                    </div>
                </div>
            </div>
        );
    }

    // If game is playing, show game component
    if (roomState.status === 'playing') {
        return <>{children({ room: roomState, game: gameState })}</>;
    }

    // Waiting room (show QR, player list, start button)
    return (
        <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                {/* Back Button */}
                <button
                    onClick={() => window.location.href = `/games/${gameType}`}
                    className="text-[#B0AEA5] hover:text-[#141413] flex items-center gap-2 mb-4 transition-colors"
                >
                    ← Back
                </button>

                <div className="bg-white rounded-3xl p-8 shadow-lg border border-[#E8E6DC]">
                    <h1 className="text-3xl font-bold text-center mb-6">
                        Waiting for Players
                    </h1>

                    {/* QR Code */}
                    <div className="bg-[#F0EFEA] rounded-2xl p-6 mb-6">
                        <p className="text-sm text-[#B0AEA5] text-center mb-4">
                            Scan to join on mobile
                        </p>
                        <div className="flex justify-center">
                            <canvas ref={canvasRef} width={300} height={300} className="rounded-xl" />
                        </div>
                    </div>

                    {/* Room Code */}
                    <div className="bg-[#F0EFEA] rounded-xl p-4 mb-6">
                        <p className="text-xs text-[#B0AEA5] text-center mb-2">
                            Or enter this code manually
                        </p>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 bg-white rounded-lg py-3 px-4 text-center border border-[#E8E6DC]">
                                <span className="text-2xl font-bold tracking-wider">
                                    {roomCode}
                                </span>
                            </div>
                            <button
                                onClick={copyRoomCode}
                                className="bg-[#D97757] hover:bg-[#CC785C] text-white px-4 py-3 rounded-lg"
                            >
                                📋
                            </button>
                        </div>
                    </div>

                    {/* Player List */}
                    <div className="bg-[#F0EFEA] rounded-xl p-4 mb-6">
                        <h3 className="font-semibold mb-3">
                            Connected Players ({roomState.players.filter(p => !p.isHost).length})
                        </h3>
                        {roomState.players.filter(p => !p.isHost).length === 0 ? (
                            <p className="text-sm text-[#B0AEA5] text-center py-4">
                                Waiting for players to join...
                            </p>
                        ) : (
                            <ul className="space-y-2">
                                {roomState.players.filter(p => !p.isHost).map((player) => (
                                    <li
                                        key={player.id}
                                        className="flex items-center gap-2 bg-white rounded-lg px-3 py-2"
                                    >
                                        <span className="text-xl">{player.avatar || '👤'}</span>
                                        <span className="font-medium">{player.name}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Start Button */}
                    <Button
                        onClick={handleStart}
                        className="w-full"
                    // disabled={roomState.players.length < 2}
                    >
                        Start Game
                    </Button>

                    <p className="text-xs text-[#B0AEA5] text-center mt-4">
                        Connection: {connectionStatus}
                    </p>
                </div>
            </div>
        </div>
    );
}
