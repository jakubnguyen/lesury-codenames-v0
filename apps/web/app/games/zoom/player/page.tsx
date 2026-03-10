'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePartyRoom } from '@/hooks/usePartyRoom';
import ZoomPlayer from '@/components/games/zoom/ZoomPlayer';
import type { ZoomGameState } from '@lesury/game-logic';

function ZoomPlayerContent() {
    const searchParams = useSearchParams();
    const roomCode = searchParams.get('room');

    // sessionKeyPrefix: 'lobby' — mirrors the key written by the /join flow
    // so the player keeps the same canonical ID after the redirect
    const { roomState, gameState, myPlayerId } = usePartyRoom<ZoomGameState>(roomCode, {
        sessionKeyPrefix: 'lobby',
    });

    if (!roomCode) {
        if (typeof window !== 'undefined') window.location.href = '/join';
        return null;
    }

    if (!roomState || !gameState) {
        return (
            <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full" />
            </div>
        );
    }

    return <ZoomPlayer state={{ room: roomState, game: gameState }} myPlayerId={myPlayerId} />;
}

export default function ZoomPlayerPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#1A1A1A]" />}>
            <ZoomPlayerContent />
        </Suspense>
    );
}
