'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePartyRoom } from '@/hooks/usePartyRoom';
import ZoomHost from '@/components/games/zoom/ZoomHost';
import type { ZoomGameState } from '@lesury/game-logic';
import { generateRoomCode } from '@lesury/game-logic';

function ZoomHostContent() {
    const searchParams = useSearchParams();
    const roomParam = searchParams.get('room');

    // Self-create a room if no ?room param (direct navigation from landing page)
    const [roomCode] = useState(() => roomParam || generateRoomCode());

    // Update URL to include room code for sharing/refreshing
    useEffect(() => {
        if (!roomParam && roomCode) {
            window.history.replaceState({}, '', `/games/zoom/host?room=${roomCode}`);
        }
    }, [roomParam, roomCode]);

    const { roomState, gameState, socket } = usePartyRoom<ZoomGameState>(roomCode, {
        asHost: true,
        gameType: 'zoom',
    });

    if (!roomState || !gameState || roomState.gameType !== 'zoom') {
        return (
            <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full" />
            </div>
        );
    }

    return <ZoomHost state={{ room: roomState, game: gameState }} socket={socket} />;
}

export default function ZoomHostPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#1A1A1A]" />}>
            <ZoomHostContent />
        </Suspense>
    );
}
