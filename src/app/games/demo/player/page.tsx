'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePartyRoom } from '@/hooks/usePartyRoom';
import DemoPlayer from '@/components/games/demo/DemoPlayer';
import type { DemoGameState } from '@lesury/game-logic';

function DemoPlayerContent() {
    const searchParams = useSearchParams();
    const roomCode = searchParams.get('room');

    const { roomState, gameState } = usePartyRoom<DemoGameState>(roomCode, {
        playerName: 'Player',
    });

    if (!roomCode) {
        if (typeof window !== 'undefined') window.location.href = '/join';
        return null;
    }

    if (!roomState || !gameState) {
        return (
            <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-[#E8E6DC] border-t-[#141413] rounded-full" />
            </div>
        );
    }

    return <DemoPlayer state={{ room: roomState, game: gameState }} />;
}

export default function DemoPlayerPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#FAF9F5]" />}>
            <DemoPlayerContent />
        </Suspense>
    );
}
