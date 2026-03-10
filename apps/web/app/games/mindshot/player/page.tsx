'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePartyRoom } from '@/hooks/usePartyRoom';
import MindshotPlayer from '@/components/games/mindshot/MindshotPlayer';
import type { MindshotGameState } from '@lesury/game-logic';

function MindshotPlayerContent() {
    const searchParams = useSearchParams();
    const roomCode = searchParams.get('room');

    const { roomState, gameState, myPlayerId } = usePartyRoom<MindshotGameState>(roomCode, {
        sessionKeyPrefix: 'lobby',
    });

    if (!roomCode) {
        if (typeof window !== 'undefined') window.location.href = '/join';
        return null;
    }

    if (!roomState || !gameState) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-border border-t-foreground rounded-full" />
            </div>
        );
    }

    return (
        <MindshotPlayer
            state={{ room: roomState, game: gameState }}
            myPlayerId={myPlayerId}
        />
    );
}

export default function MindshotPlayerPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <MindshotPlayerContent />
        </Suspense>
    );
}
