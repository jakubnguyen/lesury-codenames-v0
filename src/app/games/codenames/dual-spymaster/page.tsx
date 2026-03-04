'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePartyRoom } from '@/hooks/usePartyRoom';
import CodenamesDualSpymaster from '@/components/games/codenames/CodenamesDualSpymaster';
import type { CodenamesGameState } from '@lesury/game-logic';

function CodenamesDualSpymasterContent() {
    const searchParams = useSearchParams();
    const roomCode = searchParams.get('room');

    if (!roomCode) {
        return (
            <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center p-6">
                <p className="text-[#141413] text-center">Invalid URL. Need ?room=XXXX</p>
            </div>
        );
    }

    // dual_spymaster gets full state (card types visible) but cannot submit clues
    const { roomState, gameState, socket } = usePartyRoom<CodenamesGameState>(roomCode, {
        deviceType: 'dual_spymaster',
        playerName: 'Spymaster',
    });

    if (!roomState || !gameState) {
        return (
            <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-[#E8E6DC] border-t-[#141413] rounded-full" />
            </div>
        );
    }

    return <CodenamesDualSpymaster state={{ room: roomState, game: gameState }} socket={socket} />;
}

export default function CodenamesDualSpymasterPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#FAF9F5]" />}>
            <CodenamesDualSpymasterContent />
        </Suspense>
    );
}
