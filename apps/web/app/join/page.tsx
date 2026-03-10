'use client';

import { Suspense } from 'react';
import RoomPlayer from '@/components/room/RoomPlayer';

function JoinContent() {
    return (
        <RoomPlayer
            gameType="unknown"
            redirectByRoomState={(roomState) =>
                roomState.gameType === 'oneword'
                    ? `/games/oneword/join?room=${roomState.roomCode}`
                    : null
            }
            onGameStart={(roomState) => {
                window.location.href = `/games/${roomState.gameType}/player?room=${roomState.roomCode}`;
            }}
        >
            {() => null}
        </RoomPlayer>
    );
}

export default function JoinPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-background flex items-center justify-center">
                    <div className="animate-spin w-8 h-8 border-2 border-border border-t-foreground rounded-full" />
                </div>
            }
        >
            <JoinContent />
        </Suspense>
    );
}
