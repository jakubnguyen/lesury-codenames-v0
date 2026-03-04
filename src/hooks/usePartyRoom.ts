'use client';

import { useEffect, useState } from 'react';
import PartySocket from 'partysocket';
import type { RoomState } from '@lesury/game-logic';

const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST || 'localhost:1999';

export interface UsePartyRoomOptions {
    /** If true, joins as a host (no playerName sent, no sessionId). */
    asHost?: boolean;
    /** Game type to send with the host join message. */
    gameType?: string;
    /** Player name sent with the join message (required for players). */
    playerName?: string;
    /**
     * sessionStorage key prefix for persisting player identity across redirects.
     * If provided, the hook will read/write `lobbyPlayerId_<ROOM>` and
     * `lobbyPlayerName_<ROOM>` from sessionStorage.
     */
    sessionKeyPrefix?: string;
}

export interface UsePartyRoomResult<TGame> {
    roomState: RoomState | null;
    gameState: TGame | null;
    myPlayerId: string;
    connectionStatus: 'connecting' | 'connected' | 'disconnected';
    socket: PartySocket | null;
}

/**
 * Shared hook that handles all PartySocket boilerplate for both
 * host and player pages. Replaces ~60 lines duplicated in every page.
 */
export function usePartyRoom<TGame>(
    roomCode: string | null,
    options: UsePartyRoomOptions = {}
): UsePartyRoomResult<TGame> {
    const { asHost = false, gameType, playerName, sessionKeyPrefix } = options;

    const [roomState, setRoomState] = useState<RoomState | null>(null);
    const [gameState, setGameState] = useState<TGame | null>(null);
    const [myPlayerId, setMyPlayerId] = useState('');
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
    const [socket, setSocket] = useState<PartySocket | null>(null);

    useEffect(() => {
        if (!roomCode) return;

        const conn = new PartySocket({
            host: PARTYKIT_HOST,
            room: roomCode.toLowerCase(),
        });

        conn.addEventListener('open', () => {
            setConnectionStatus('connected');

            if (asHost) {
                // The host page must send a join with gameType.
                // When all connections drop during lobby→game redirect,
                // the PartyKit room resets to gameType='demo'. Without this,
                // start_game messages are silently dropped.
                conn.send(JSON.stringify({
                    type: 'join',
                    playerName: 'Host',
                    ...(gameType ? { gameType } : {}),
                }));
                setMyPlayerId(conn.id);
            } else {
                // Resolve identity: prefer saved sessionId from lobby redirect
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
                if (data.type === 'sync') {
                    setRoomState(data.room);
                    setGameState(data.game);
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
        // roomCode is the only stable dep; options are read once on connect
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomCode]);

    return { roomState, gameState, myPlayerId, connectionStatus, socket };
}
