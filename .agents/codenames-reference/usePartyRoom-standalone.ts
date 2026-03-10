'use client';

import { useEffect, useState } from 'react';
import PartySocket from 'partysocket';
import type { RoomState } from '@lesury/game-logic';

const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST || 'localhost:1999';

export interface UsePartyRoomOptions {
    deviceType?: string;
    asHost?: boolean;
    gameType?: string;
    playerName?: string;
    sessionKeyPrefix?: string;
}

export interface UsePartyRoomResult<TGame> {
    roomState: RoomState | null;
    gameState: TGame | null;
    myPlayerId: string;
    connectionStatus: 'connecting' | 'connected' | 'disconnected';
    socket: PartySocket | null;
}

export function usePartyRoom<TGame>(
    roomCode: string | null,
    options: UsePartyRoomOptions = {}
): UsePartyRoomResult<TGame> {
    const { asHost = false, deviceType, gameType, playerName, sessionKeyPrefix } = options;

    const [roomState, setRoomState] = useState<RoomState | null>(null);
    const [gameState, setGameState] = useState<TGame | null>(null);
    const [myPlayerId, setMyPlayerId] = useState('');
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
    const [socket, setSocket] = useState<PartySocket | null>(null);

    useEffect(() => {
        if (!roomCode) return;

        // Pass deviceType and playerName as URL query params so the server
        // can identify the connection type in onConnect()
        const query: Record<string, string> = {};
        if (deviceType) query.deviceType = deviceType;
        if (playerName) query.playerName = playerName;

        const conn = new PartySocket({
            host: PARTYKIT_HOST,
            room: roomCode.toLowerCase(),
            query,
        });

        conn.addEventListener('open', () => {
            setConnectionStatus('connected');

            if (asHost) {
                conn.send(JSON.stringify({
                    type: 'join',
                    playerName: 'Host',
                    ...(gameType ? { gameType } : {}),
                }));
                setMyPlayerId(conn.id);
            } else {
                const roomKey = roomCode.toUpperCase();
                const sessionId = sessionKeyPrefix
                    ? sessionStorage.getItem(`${sessionKeyPrefix}PlayerId_${roomKey}`) ?? undefined
                    : undefined;
                const resolvedName = sessionKeyPrefix
                    ? sessionStorage.getItem(`${sessionKeyPrefix}PlayerName_${roomKey}`) || playerName || 'Player'
                    : playerName || 'Player';

                setMyPlayerId(sessionId || conn.id);

                conn.send(JSON.stringify({
                    type: 'join',
                    playerName: resolvedName,
                    ...(sessionId ? { sessionId } : {}),
                }));
            }
        });

        conn.addEventListener('message', (evt) => {
            try {
                const data = JSON.parse(evt.data as string);
                // Accept both 'sync' (main platform) and 'state' (codenames server)
                if (data.type === 'sync' || data.type === 'state') {
                    setRoomState(data.room ?? {});
                    if (data.game !== undefined) setGameState(data.game);
                }
            } catch (e) {
                console.error('[usePartyRoom] Failed to parse message:', e);
            }
        });

        conn.addEventListener('close', () => setConnectionStatus('disconnected'));

        setSocket(conn);
        (window as any).__partySocket = conn;

        return () => {
            conn.close();
            delete (window as any).__partySocket;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomCode]);

    return { roomState, gameState, myPlayerId, connectionStatus, socket };
}
