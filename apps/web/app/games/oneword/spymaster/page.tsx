'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePartyRoom } from '@/hooks/usePartyRoom';
import OneWordSpymaster from '@/components/games/oneword/OneWordSpymaster';
import type { OneWordGameState } from '@lesury/game-logic';

function OneWordSpymasterContent() {
  const searchParams = useSearchParams();
  const roomCode = searchParams.get('room');
  if (!roomCode) return <div className="min-h-screen bg-background flex items-center justify-center p-6">Invalid URL. Need ?room=XXXX</div>;
  const { roomState, gameState, socket } = usePartyRoom<OneWordGameState>(roomCode, { deviceType: 'spymaster', playerName: 'Spymaster' });
  if (!roomState || !gameState) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-border border-t-accent rounded-full" /></div>;
  return <OneWordSpymaster state={{ room: roomState, game: gameState }} socket={socket} />;
}

export default function OneWordSpymasterPage() {
  return <Suspense fallback={<div className="min-h-screen bg-background" />}><OneWordSpymasterContent /></Suspense>;
}
