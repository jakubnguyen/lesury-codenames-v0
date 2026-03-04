'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePartyRoom } from '@/hooks/usePartyRoom';
import CodenamesSpymaster from '@/components/games/codenames/CodenamesSpymaster';
import type { CodenamesGameState } from '@lesury/game-logic';

function CodenamesSpymasterContent() {
    const searchParams = useSearchParams();
    const roomCode = searchParams.get('room');
    const team = searchParams.get('team') as 'red' | 'blue' | null;

    if (!roomCode || !team || (team !== 'red' && team !== 'blue')) {
        return (
            <div className="min-h-screen bg-[#141413] flex items-center justify-center p-6">
                <p className="text-white text-center">
                    Invalid URL. Need ?room=XXXX&team=red or &team=blue
                </p>
            </div>
        );
    }

    const deviceType = team === 'red' ? 'red_spymaster' : 'blue_spymaster';
    const playerName = team === 'red' ? 'Red Spymaster' : 'Blue Spymaster';

    // Spymasters receive full CodenamesGameState (with card types) from server
    // FIX: destructure socket and pass it down so CodenamesSpymaster doesn't
    //      rely solely on window.__partySocket for clue submission.
    const { roomState, gameState, socket } = usePartyRoom<CodenamesGameState>(roomCode, {
        deviceType,
        playerName,
    });

    if (!roomState || !gameState) {
        return (
            <div className="min-h-screen bg-[#141413] flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <CodenamesSpymaster
            state={{ room: roomState, game: gameState }}
            team={team}
            socket={socket}   // ← FIX: pass socket directly
        />
    );
}

export default function CodenamesSpymasterPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#141413]" />}>
            <CodenamesSpymasterContent />
        </Suspense>
    );
}
