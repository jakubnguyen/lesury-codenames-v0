'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePartyRoom } from '@/hooks/usePartyRoom';
import TimelinePlayer from '@/components/games/timeline/TimelinePlayer';
import type { TimelineGameState } from '@lesury/game-logic';

function TimelinePlayerContent() {
    const searchParams = useSearchParams();
    const roomCode = searchParams.get('room');

    const { roomState, gameState, myPlayerId } = usePartyRoom<TimelineGameState>(roomCode, {
        sessionKeyPrefix: 'lobby',
    });

    if (!roomCode) {
        if (typeof window !== 'undefined') window.location.href = '/join';
        return null;
    }

    if (!roomState || !gameState) {
        return (
            <div className="min-h-screen bg-[#2A2A2A] flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-[#E8E6DC] border-t-white rounded-full" />
            </div>
        );
    }

    return <TimelinePlayer state={{ room: roomState, game: gameState }} myPlayerId={myPlayerId} />;
}

export default function TimelinePlayerPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#2A2A2A]" />}>
            <TimelinePlayerContent />
        </Suspense>
    );
}
