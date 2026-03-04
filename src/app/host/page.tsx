'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import RoomHost from '@/components/room/RoomHost';

function HostPageContent() {
    const searchParams = useSearchParams();
    const gameType = searchParams.get('game') || 'demo';

    return (
        <RoomHost
            gameType={gameType}
            onGameStart={(roomState) => {
                // Redirect to actual game host view
                window.location.href = `/games/${gameType}/host?room=${roomState.roomCode}`;
            }}
        >
            {() => null}
        </RoomHost>
    );
}

export default function HostPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center">Loading...</div>}>
            <HostPageContent />
        </Suspense>
    );
}
