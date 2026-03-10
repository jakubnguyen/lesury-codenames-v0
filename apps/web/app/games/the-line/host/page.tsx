'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePartyRoom } from '@/hooks/usePartyRoom';
import TheLineHost from '@/components/games/the-line/TheLineHost';
import type { TheLineGameState } from '@lesury/game-logic';
import { generateRoomCode } from '@lesury/game-logic';

function TheLineHostContent() {
    const searchParams = useSearchParams();
    const roomParam = searchParams.get('room');

    // Self-create a room if no ?room param (direct navigation from landing page)
    const [roomCode] = useState(() => roomParam || generateRoomCode());

    // Update URL to include room code for sharing/refreshing
    useEffect(() => {
        if (!roomParam && roomCode) {
            window.history.replaceState({}, '', `/games/the-line/host?room=${roomCode}`);
        }
    }, [roomParam, roomCode]);

    const { roomState, gameState, socket } = usePartyRoom<TheLineGameState>(roomCode, {
        asHost: true,
        gameType: 'the-line',
    });

    if (!roomState || !gameState || roomState.gameType !== 'the-line') {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-border border-t-foreground rounded-full" />
            </div>
        );
    }

    return <TheLineHost state={{ room: roomState, game: gameState }} socket={socket} />;
}

export default function TheLineHostPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <TheLineHostContent />
        </Suspense>
    );
}
