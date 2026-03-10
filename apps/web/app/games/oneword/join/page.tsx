'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/app/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { validateRoomCode } from '@lesury/game-logic';

function OneWordJoinContent() {
  const searchParams = useSearchParams();
  const roomParam = (searchParams.get('room') || '').toUpperCase();
  const [inputCode, setInputCode] = useState(roomParam);

  useEffect(() => {
    if (roomParam) {
      setInputCode(roomParam);
    }
  }, [roomParam]);

  const roomCode = useMemo(() => {
    const normalized = inputCode.toUpperCase();
    return validateRoomCode(normalized) ? normalized : '';
  }, [inputCode]);

  const handleRoleJoin = (role: 'spymaster' | 'player') => {
    if (!roomCode) return;
    window.location.href = `/games/oneword/${role}?room=${roomCode}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-3">Join OneWord</h1>
          <p className="text-muted-foreground text-lg">
            Enter a room code, then choose whether this phone is the spymaster or the shared player controller.
          </p>
        </div>

        <Card className="rounded-3xl max-w-xl mx-auto mb-8">
          <CardContent className="p-8">
            <Label htmlFor="onewordRoomCode" className="text-sm font-semibold mb-2">
              Room Code
            </Label>
            <Input
              id="onewordRoomCode"
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              className="bg-secondary text-2xl font-bold text-center py-4 rounded-xl border-border focus-visible:ring-accent placeholder:text-muted-foreground h-auto"
            />
            <p className="text-sm text-muted-foreground text-center mt-3">
              {roomCode
                ? `Joining room ${roomCode}`
                : 'Scan the TV QR code or type the room code shown on screen.'}
            </p>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-3xl border border-border bg-card p-8 shadow-md">
            <div className="text-4xl mb-4">🕵️</div>
            <h2 className="text-2xl font-bold mb-3">Spymaster Phone</h2>
            <p className="text-muted-foreground mb-6">
              Secret board. Give the clue verbally, then submit the number with the large plus and minus controls.
            </p>
            <Button
              type="button"
              disabled={!roomCode}
              onClick={() => handleRoleJoin('spymaster')}
              className="w-full rounded-full h-auto py-4 text-lg font-bold"
            >
              Join as Spymaster
            </Button>
          </div>

          <div className="rounded-3xl border border-border bg-card p-8 shadow-md">
            <div className="text-4xl mb-4">👆</div>
            <h2 className="text-2xl font-bold mb-3">Player Phone</h2>
            <p className="text-muted-foreground mb-6">
              Shared public board. Tap words for the active team and use Skip Turn when the team wants to stop.
            </p>
            <Button
              type="button"
              variant="outline"
              disabled={!roomCode}
              onClick={() => handleRoleJoin('player')}
              className="w-full rounded-full h-auto py-4 text-lg font-bold"
            >
              Join as Player
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OneWordJoinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <OneWordJoinContent />
    </Suspense>
  );
}
