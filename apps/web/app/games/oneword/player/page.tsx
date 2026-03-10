'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePartyRoom } from '@/hooks/usePartyRoom';
import OneWordPlayer from '@/components/games/oneword/OneWordPlayer';
import type { OneWordPublicGameState } from '@lesury/game-logic';

function OneWordPlayerContent() {
  const searchParams = useSearchParams();
  const roomCode = searchParams.get('room');
  if (!roomCode) return <div className="min-h-screen bg-background flex items-center justify-center p-6">Invalid URL. Need ?room=XXXX</div>;
  const { roomState, gameState, socket } = usePartyRoom<OneWordPublicGameState>(roomCode, { deviceType: 'player', playerName: 'Player' });
  if (!roomState || !gameState) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-border border-t-accent rounded-full" /></div>;
  return <OneWordPlayer state={{ room: roomState, game: gameState }} socket={socket} />;
}

export default function OneWordPlayerPage() {
  return <Suspense fallback={<div className="min-h-screen bg-background" />}><OneWordPlayerContent /></Suspense>;
}
