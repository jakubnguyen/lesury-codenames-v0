'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePartyRoom } from '@/hooks/usePartyRoom';
import TimelineHost from '@/components/games/timeline/TimelineHost';
import type { TimelineGameState } from '@lesury/game-logic';
import { generateRoomCode } from '@lesury/game-logic';

function TimelineHostContent() {
    const searchParams = useSearchParams();
    const roomParam = searchParams.get('room');

    const [roomCode] = useState(() => roomParam || generateRoomCode());

    useEffect(() => {
        if (!roomParam && roomCode) {
            window.history.replaceState({}, '', `/games/timeline/host?room=${roomCode}`);
        }
    }, [roomParam, roomCode]);

    const { roomState, gameState, socket } = usePartyRoom<TimelineGameState>(roomCode, {
        asHost: true,
        gameType: 'timeline',
    });

    if (!roomState || !gameState || roomState.gameType !== 'timeline') {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-border border-t-foreground rounded-full" />
            </div>
        );
    }

    return <TimelineHost state={{ room: roomState, game: gameState }} socket={socket} />;
}

export default function TimelineHostPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <TimelineHostContent />
        </Suspense>
    );
}
