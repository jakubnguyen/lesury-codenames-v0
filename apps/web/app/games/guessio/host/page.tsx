'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePartyRoom } from '@/hooks/usePartyRoom';
import GuessioHost from '@/components/games/guessio/GuessioHost';
import type { GuessioGameState } from '@lesury/game-logic';
import { generateRoomCode } from '@lesury/game-logic';

function GuessioHostContent() {
    const searchParams = useSearchParams();
    const roomParam = searchParams.get('room');

    const [roomCode] = useState(() => roomParam || generateRoomCode());

    useEffect(() => {
        if (!roomParam && roomCode) {
            window.history.replaceState({}, '', `/games/guessio/host?room=${roomCode}`);
        }
    }, [roomParam, roomCode]);

    const { roomState, gameState, socket } = usePartyRoom<GuessioGameState>(roomCode, {
        asHost: true,
        gameType: 'guessio',
    });

    if (!roomState || !gameState) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-border border-t-foreground rounded-full" />
            </div>
        );
    }

    return <GuessioHost state={{ room: roomState, game: gameState }} socket={socket} />;
}

export default function GuessioHostPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <GuessioHostContent />
        </Suspense>
    );
}
