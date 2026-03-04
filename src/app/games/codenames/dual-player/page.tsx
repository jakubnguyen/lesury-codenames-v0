'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePartyRoom } from '@/hooks/usePartyRoom';
import CodenamesDualPlayer from '@/components/games/codenames/CodenamesDualPlayer';
import type { CodenamesGameStatePublic } from '@lesury/game-logic';

function CodenamesDualPlayerContent() {
    const searchParams = useSearchParams();
    const roomCode = searchParams.get('room');

    if (!roomCode) {
        return (
            <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center p-6">
                <p className="text-[#141413] text-center">Invalid URL. Need ?room=XXXX</p>
            </div>
        );
    }

    // dual_player gets public state and can guess/endTurn for whichever team is active
    const { roomState, gameState, socket } = usePartyRoom<CodenamesGameStatePublic>(roomCode, {
        deviceType: 'dual_player',
        playerName: 'Player',
    });

    if (!roomState || !gameState) {
        return (
            <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-[#E8E6DC] border-t-[#141413] rounded-full" />
            </div>
        );
    }

    return <CodenamesDualPlayer state={{ room: roomState, game: gameState }} socket={socket} />;
}

export default function CodenamesDualPlayerPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#FAF9F5]" />}>
            <CodenamesDualPlayerContent />
        </Suspense>
    );
}
