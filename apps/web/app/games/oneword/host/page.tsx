'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePartyRoom } from '@/hooks/usePartyRoom';
import OneWordHost from '@/components/games/oneword/OneWordHost';
import type { OneWordPublicGameState } from '@lesury/game-logic';
import { generateRoomCode } from '@lesury/game-logic';

function OneWordHostContent() {
  const searchParams = useSearchParams();
  const roomParam = searchParams.get('room');
  const [roomCode] = useState(() => roomParam || generateRoomCode());

  useEffect(() => {
    if (!roomParam && roomCode) {
      window.history.replaceState({}, '', `/games/oneword/host?room=${roomCode}`);
    }
  }, [roomParam, roomCode]);

  const { roomState, gameState, socket } = usePartyRoom<OneWordPublicGameState>(roomCode, {
    asHost: true,
    gameType: 'oneword',
    deviceType: 'host',
  });

  if (!roomState || !gameState || roomState.gameType !== 'oneword') {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-border border-t-accent rounded-full" /></div>;
  }

  return <OneWordHost state={{ room: roomState, game: gameState }} socket={socket} />;
}

export default function OneWordHostPage() {
  return <Suspense fallback={<div className="min-h-screen bg-background" />}><OneWordHostContent /></Suspense>;
}
