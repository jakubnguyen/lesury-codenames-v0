'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePartyRoom } from '@/hooks/usePartyRoom';
import TimelineHost from '@/components/games/timeline/TimelineHost';
import type { TimelineGameState } from '@lesury/game-logic';

function TimelineHostContent() {
    const searchParams = useSearchParams();
    const roomCode = searchParams.get('room');

    const { roomState, gameState } = usePartyRoom<TimelineGameState>(roomCode, {
        asHost: true,
        gameType: 'timeline',
    });

    if (!roomCode) {
        if (typeof window !== 'undefined') window.location.href = '/games/timeline';
        return null;
    }

    if (!roomState || !gameState) {
        return (
            <div className="min-h-screen bg-[#2A2A2A] flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-[#E8E6DC] border-t-white rounded-full" />
            </div>
        );
    }

    return <TimelineHost state={{ room: roomState, game: gameState }} />;
}

export default function TimelineHostPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#2A2A2A]" />}>
            <TimelineHostContent />
        </Suspense>
    );
}
