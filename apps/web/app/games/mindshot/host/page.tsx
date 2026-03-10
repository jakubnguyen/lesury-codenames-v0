'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePartyRoom } from '@/hooks/usePartyRoom';
import MindshotHost from '@/components/games/mindshot/MindshotHost';
import type { MindshotGameState } from '@lesury/game-logic';
import { generateRoomCode } from '@lesury/game-logic';

function MindshotHostContent() {
    const searchParams = useSearchParams();
    const roomParam = searchParams.get('room');

    const [roomCode] = useState(() => roomParam || generateRoomCode());

    useEffect(() => {
        if (!roomParam && roomCode) {
            window.history.replaceState({}, '', `/games/mindshot/host?room=${roomCode}`);
        }
    }, [roomParam, roomCode]);

    const { roomState, gameState, socket } = usePartyRoom<MindshotGameState>(roomCode, {
        asHost: true,
        gameType: 'mindshot',
    });

    if (!roomState || !gameState || roomState.gameType !== 'mindshot') {
        return (
            <div className="min-h-screen bg-[#2A2A2A] flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full" />
            </div>
        );
    }

    return <MindshotHost state={{ room: roomState, game: gameState }} socket={socket} />;
}

export default function MindshotHostPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#2A2A2A]" />}>
            <MindshotHostContent />
        </Suspense>
    );
}
