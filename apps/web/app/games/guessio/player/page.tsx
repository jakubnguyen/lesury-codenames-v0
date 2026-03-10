'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePartyRoom } from '@/hooks/usePartyRoom';
import GuessioPlayer from '@/components/games/guessio/GuessioPlayer';
import type { GuessioGameState } from '@lesury/game-logic';

function GuessioPlayerContent() {
    const searchParams = useSearchParams();
    const roomCode = searchParams.get('room');
    const sessionId = searchParams.get('session');

    // Make sure we have a session to connect as player
    const { roomState, gameState } = usePartyRoom<GuessioGameState>(roomCode, {
        asHost: false,
    });

    if (!roomCode || !sessionId) {
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

    return <GuessioPlayer state={{ room: roomState, game: gameState }} />;
}

export default function GuessioPlayerPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#1A1A1A]" />}>
            <GuessioPlayerContent />
        </Suspense>
    );
}
