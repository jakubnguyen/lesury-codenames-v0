'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import QRCode from 'qrcode';
import { GameHeader } from '@/components/games/GameHeader';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { trackGameCompleted } from '@/lib/analytics';
import type {
  RoomState,
  OneWordLanguage,
  OneWordPublicCard,
  OneWordPublicGameState,
} from '@lesury/game-logic';
import type { PartySocket } from 'partysocket';
import { useTheme } from 'next-themes';

interface Props {
  state: { room: RoomState; game: OneWordPublicGameState };
  socket: PartySocket | null;
}

function Card({ card }: { card: OneWordPublicCard }) {
  const base = 'rounded-[1.35rem] border min-h-24 flex items-center justify-center px-3 text-center text-sm md:text-lg font-bold tracking-[0.16em] uppercase shadow-sm';
  if (!card.revealed) return <div className={`${base} bg-card border-border text-foreground`}>{card.word}</div>;
  if (card.type === 'red') return <div className={`${base} bg-accent text-accent-foreground border-accent opacity-85 line-through`}>{card.word}</div>;
  if (card.type === 'blue') return <div className={`${base} bg-[var(--accent-blue)] text-white border-[var(--accent-blue)] opacity-85 line-through`}>{card.word}</div>;
  if (card.type === 'assassin') return <div className={`${base} bg-primary text-primary-foreground border-primary opacity-85 line-through`}>{card.word}</div>;
  return <div className={`${base} bg-secondary text-muted-foreground border-border opacity-85 line-through`}>{card.word}</div>;
}

export default function OneWordHost({ state, socket }: Props) {
  const { room, game } = state;
  const { resolvedTheme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [language, setLanguage] = useState<OneWordLanguage>(game.language);
  const connected = new Set(game.connectedDevices ?? []);
  const canStart = connected.has('spymaster') && connected.has('player');
  const activeTeam = game.phase.startsWith('red') ? 'red' : game.phase.startsWith('blue') ? 'blue' : null;

  useEffect(() => {
    if (game.phase === 'lobby') {
      setLanguage(game.language);
    }
  }, [game.language, game.phase]);

  useEffect(() => {
    if (game.phase !== 'lobby' || !room.roomCode || !canvasRef.current) return;
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${baseUrl}/games/oneword/join?room=${room.roomCode}`;
    const qrColors = resolvedTheme === 'dark'
      ? { dark: '#F0EFEA', light: '#2E2E2C' }
      : { dark: '#191917', light: '#FFFFFF' };
    QRCode.toCanvas(canvasRef.current, url, { width: 250, margin: 2, color: qrColors });
  }, [game.phase, room.roomCode, resolvedTheme]);

  useEffect(() => {
    if (game.phase === 'game_over') {
      trackGameCompleted('OneWord', 0);
    }
  }, [game.phase]);

  if (game.phase === 'lobby') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 gap-4 relative">
        <GameHeader />
        <h1 className="text-3xl font-bold text-foreground text-center">OneWord</h1>
        <div className="flex gap-8 max-w-5xl w-full">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 bg-card rounded-3xl p-8 shadow-2xl flex flex-col border border-border">
            <p className="text-muted-foreground text-center text-base mb-4">Scan to join</p>
            <div className="flex justify-center mb-6"><canvas ref={canvasRef} width={250} height={250} className="rounded-md" /></div>
            <div className="bg-background rounded-2xl p-4 mb-6 text-center border border-border">
              <p className="text-xs text-muted-foreground mb-1">Room Code</p>
              <p className="text-4xl font-bold tracking-widest text-foreground tabular-nums">{room.roomCode}</p>
            </div>
            <p className="text-xs text-muted-foreground text-center mb-6">
              The QR opens a role picker for the spymaster phone or the shared player phone.
            </p>
            <div className="flex-1 space-y-2">
              <p className="text-sm font-bold text-foreground mb-2">Devices</p>
              {[
                { id: 'spymaster', label: 'Spymaster phone' },
                { id: 'player', label: 'Player phone' },
              ].map((device) => (
                <div key={device.id} className="bg-background px-4 py-3 rounded-2xl text-sm font-bold text-foreground flex items-center gap-2 border border-border">
                  <span className={`w-3 h-3 rounded-full ${connected.has(device.id) ? 'bg-[var(--accent-green)]' : 'bg-border'}`} />
                  <span className="flex-1">{device.label}</span>
                  <span className="text-muted-foreground">{connected.has(device.id) ? 'Connected' : 'Waiting'}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 bg-card rounded-3xl p-8 shadow-2xl flex flex-col border border-border">
            <p className="text-muted-foreground text-center text-base mb-8">Set up game</p>
            <div className="mb-8">
              <p className="text-sm font-bold text-foreground mb-2">Language</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'en', label: 'English' },
                  { id: 'cz', label: 'Čeština' },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setLanguage(option.id as OneWordLanguage)}
                    className={language === option.id ? 'bg-accent text-accent-foreground shadow-md px-4 py-3 rounded-2xl font-bold text-sm' : 'bg-background text-foreground border border-border hover:bg-secondary px-4 py-3 rounded-2xl font-bold text-sm transition-all'}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-8 rounded-2xl border border-border bg-background p-4">
              <p className="text-sm font-bold text-foreground mb-2">Game format</p>
              <p className="text-muted-foreground text-sm">20 words. Red starts. One spymaster phone and one shared player phone.</p>
            </div>
            <div className="flex-1" />
            <Button
              type="button"
              disabled={!canStart}
              onClick={() => socket?.send(JSON.stringify({ type: 'start_game', language }))}
              className="w-full h-auto py-4 rounded-full text-lg font-bold"
            >
              {canStart ? 'Start Game (2 devices)' : 'Start Game'}
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (game.phase === 'game_over') {
    const winnerColor = game.winner === 'red' ? 'text-accent' : 'text-[var(--accent-blue)]';
    const winnerLabel = game.winner === 'red' ? 'Red Team Wins!' : 'Blue Team Wins!';
    const subtitle = game.winReason === 'assassin' ? 'The assassin ended the round.' : 'All agents were found.';

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
        <div className="fixed top-4 right-4 z-50"><ThemeToggle /></div>
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-accent/10 via-transparent to-transparent pointer-events-none" />

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-[2rem] border border-border shadow-2xl p-8 md:p-12 text-center max-w-6xl w-full relative">
          <div className="text-7xl mb-4">{game.winReason === 'assassin' ? '☠️' : '🏆'}</div>
          <h2 className={`text-4xl font-bold mb-2 ${winnerColor}`}>{winnerLabel}</h2>
          <p className="text-muted-foreground mb-8">{subtitle}</p>
          <div className="grid sm:grid-cols-2 gap-3 mb-8 text-left">
            <div className="rounded-2xl border border-accent bg-accent/10 p-4">
              <p className="text-xs font-bold tracking-[0.2em] text-accent mb-2">RED TEAM</p>
              <p className="text-2xl font-black text-accent">{game.redRemaining}</p>
              <p className="text-sm text-muted-foreground mt-1">agents left</p>
            </div>
            <div className="rounded-2xl border border-[var(--accent-blue)] bg-[color:rgba(106,155,204,0.10)] p-4">
              <p className="text-xs font-bold tracking-[0.2em] text-[var(--accent-blue)] mb-2">BLUE TEAM</p>
              <p className="text-2xl font-black text-[var(--accent-blue)]">{game.blueRemaining}</p>
              <p className="text-sm text-muted-foreground mt-1">agents left</p>
            </div>
          </div>
          <p className="text-sm font-bold text-foreground mb-4">Final Board</p>
          <div className="bg-background/80 border border-border rounded-[2rem] p-5 mb-8">
            <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
              {game.cards.map((card, idx) => <Card key={idx} card={card} />)}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button className="flex-1 h-auto py-4 rounded-xl text-lg font-bold shadow-lg" onClick={() => socket?.send(JSON.stringify({ type: 'play_again' }))}>Play Again</Button>
            <Button asChild variant="secondary" className="flex-1 h-auto py-4 rounded-xl text-lg font-bold shadow-lg"><a href="/games/oneword">Home</a></Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6 relative overflow-hidden">
      <div className="fixed top-4 right-4 z-50"><ThemeToggle /></div>
      <div className="absolute -top-20 left-10 w-64 h-64 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
      <div className="absolute top-24 right-0 w-72 h-72 rounded-full bg-[color:rgba(106,155,204,0.10)] blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto pt-12 relative">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">OneWord</h1>
          <div className="text-sm text-muted-foreground">{game.language.toUpperCase()}</div>
        </div>
        <div className="grid grid-cols-[160px_1fr_160px] items-center gap-6 mb-8">
          <div className={`rounded-[2rem] border p-6 text-center shadow-lg ${activeTeam === 'red' ? 'border-accent bg-accent/10' : 'border-border bg-card'}`}><div className="text-5xl font-black text-accent">{game.redRemaining}</div><div className="text-sm font-bold tracking-[0.3em] text-accent mt-2">RED</div></div>
          <div className={`rounded-[2rem] border p-7 text-center shadow-lg ${activeTeam === 'red' ? 'border-accent bg-accent/10' : activeTeam === 'blue' ? 'border-[var(--accent-blue)] bg-[color:rgba(106,155,204,0.10)]' : 'border-border bg-card'}`}><div className="text-2xl font-black">{game.phase === 'red_briefing' ? 'Red briefing' : game.phase === 'blue_briefing' ? 'Blue briefing' : game.phase === 'red_guessing' ? 'Red guessing' : 'Blue guessing'}</div><div className="text-muted-foreground mt-3">{game.phase.endsWith('guessing') ? `${game.guessesRemaining} guess${game.guessesRemaining === 1 ? '' : 'es'} remaining` : 'Spymaster gives the clue verbally and submits the number.'}</div>{game.lastAction && <div className="text-sm text-muted-foreground mt-3">{game.lastAction}</div>}</div>
          <div className={`rounded-[2rem] border p-6 text-center shadow-lg ${activeTeam === 'blue' ? 'border-[var(--accent-blue)] bg-[color:rgba(106,155,204,0.10)]' : 'border-border bg-card'}`}><div className="text-5xl font-black text-[var(--accent-blue)]">{game.blueRemaining}</div><div className="text-sm font-bold tracking-[0.3em] text-[var(--accent-blue)] mt-2">BLUE</div></div>
        </div>
        <div className="bg-card/95 border border-border rounded-[2rem] p-6 shadow-2xl">
          <div className="grid grid-cols-4 md:grid-cols-5 gap-4">
            {game.cards.map((card, idx) => <Card key={idx} card={card} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
