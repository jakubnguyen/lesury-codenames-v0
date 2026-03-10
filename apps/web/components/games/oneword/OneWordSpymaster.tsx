'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { PartySocket } from 'partysocket';
import type { RoomState, OneWordCard, OneWordGameState } from '@lesury/game-logic';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';

interface Props {
  state: { room: RoomState; game: OneWordGameState };
  socket: PartySocket | null;
}

function SpyCard({ card }: { card: OneWordCard }) {
  const base = 'rounded-[1.25rem] border min-h-[74px] flex items-center justify-center px-3 py-3 text-center text-[13px] leading-tight font-bold tracking-[0.14em] uppercase shadow-sm';
  const revealed = card.revealed ? ' line-through opacity-60' : '';

  if (card.type === 'red') return <div className={`${base} bg-accent/10 border-accent text-accent${revealed}`}>{card.word}</div>;
  if (card.type === 'blue') return <div className={`${base} bg-[color:rgba(106,155,204,0.10)] border-[var(--accent-blue)] text-[var(--accent-blue)]${revealed}`}>{card.word}</div>;
  if (card.type === 'assassin') return <div className={`${base} bg-primary/10 border-primary text-primary${revealed}`}>☠ {card.word}</div>;
  return <div className={`${base} bg-secondary border-border text-muted-foreground${revealed}`}>{card.word}</div>;
}

interface GameOverSnapshot {
  winner: OneWordGameState['winner'];
  winReason: OneWordGameState['winReason'];
}

export default function OneWordSpymaster({ state, socket }: Props) {
  const { room, game } = state;
  const [number, setNumber] = useState(2);
  const [gameOverSnapshot, setGameOverSnapshot] = useState<GameOverSnapshot | null>(null);
  const liveGameOverSnapshot = game.phase === 'game_over'
    ? {
        winner: game.winner,
        winReason: game.winReason,
      }
    : null;

  const activeTeam = game.phase.startsWith('red') ? 'red' : game.phase.startsWith('blue') ? 'blue' : null;
  const isBriefing = game.phase === 'red_briefing' || game.phase === 'blue_briefing';
  const maxNumber = Math.max(1, game.cards.length);
  const accentClass = activeTeam === 'red' ? 'text-accent' : 'text-[var(--accent-blue)]';
  const accentBg = activeTeam === 'red' ? 'bg-accent/10 border-accent' : 'bg-[color:rgba(106,155,204,0.10)] border-[var(--accent-blue)]';

  const adjust = (delta: number) => setNumber((prev) => Math.max(1, Math.min(maxNumber, prev + delta)));

  useEffect(() => {
    setNumber((prev) => Math.max(1, Math.min(maxNumber, prev)));
  }, [maxNumber]);

  useEffect(() => {
    if (liveGameOverSnapshot && !gameOverSnapshot) {
      setGameOverSnapshot(liveGameOverSnapshot);
    }
  }, [gameOverSnapshot, liveGameOverSnapshot]);

  const resultSnapshot = gameOverSnapshot ?? liveGameOverSnapshot;

  if (resultSnapshot) {
    const newGameStarting = game.phase !== 'game_over';
    const winnerLabel = resultSnapshot.winner
      ? `${resultSnapshot.winner === 'red' ? 'Red' : 'Blue'} Team Wins!`
      : 'Game Over';
    const subtitle = resultSnapshot.winReason === 'assassin'
      ? 'The assassin was revealed.'
      : 'All agents were found.';

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
        <div className="fixed top-4 right-4 z-50"><ThemeToggle /></div>
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-accent/10 via-transparent to-transparent pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card rounded-[2rem] border border-border p-8 text-center max-w-md shadow-2xl w-full relative"
        >
          <div className="text-6xl mb-4">
            {resultSnapshot.winReason === 'assassin' ? '☠️' : '🏆'}
          </div>
          <h2 className="text-2xl font-bold mb-2 text-foreground">{winnerLabel}</h2>
          <div className="bg-background rounded-2xl border border-border p-4 mb-6 shadow-sm">
            <p className="text-sm text-muted-foreground">Spymaster Summary</p>
            <p className="text-lg font-bold text-accent">{subtitle}</p>
          </div>

          {newGameStarting ? (
            <>
              <motion.p
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-accent font-bold text-sm mb-4"
              >
                New game ready!
              </motion.p>
              <Button
                type="button"
                onClick={() => setGameOverSnapshot(null)}
                className="w-full rounded-xl h-auto py-3 font-bold"
              >
                Continue
              </Button>
            </>
          ) : (
            <>
              <p className="text-muted-foreground text-sm mb-4">
                Waiting for the host to start a new game...
              </p>
              <Button
                asChild
                className="w-full rounded-xl h-auto py-3 font-bold bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <a href="/">Home</a>
              </Button>
            </>
          )}
        </motion.div>
      </div>
    );
  }

  if (game.phase === 'lobby') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
        <div className="fixed top-4 right-4 z-50"><ThemeToggle /></div>
        <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-accent/10 via-transparent to-transparent pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card rounded-[2rem] border border-border p-8 text-center max-w-md shadow-2xl w-full relative"
        >
          <div className="text-6xl mb-4">🕵️</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Spymaster Phone Ready</h2>
          <p className="text-muted-foreground mb-4">
            This phone sees the secret board. Wait for the host to start the game.
          </p>
          <p className="text-sm text-muted-foreground">
            Room {room.roomCode}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6 relative overflow-hidden">
      <div className="fixed top-4 right-4 z-50"><ThemeToggle /></div>
      <div className="absolute -top-20 -left-10 w-48 h-48 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
      <div className="absolute top-32 -right-12 w-56 h-56 rounded-full bg-[color:rgba(106,155,204,0.10)] blur-3xl pointer-events-none" />

      <div className="max-w-lg mx-auto pt-12 relative">
        <div className={`rounded-[2rem] border ${accentBg} text-center p-6 mb-5 shadow-lg backdrop-blur-sm`}>
          <div className="text-xs font-bold tracking-[0.22em] text-muted-foreground">SPYMASTER PHONE</div>
          <div className={`text-3xl font-black mt-3 ${accentClass}`}>{activeTeam?.toUpperCase()} {isBriefing ? 'briefing' : 'waiting'}</div>
          <div className="text-sm text-muted-foreground mt-3">{game.language.toUpperCase()} · Red {game.redRemaining} / Blue {game.blueRemaining}</div>
        </div>

        <div className="bg-card/95 border border-border rounded-[2rem] p-4 shadow-xl mb-5">
          <div className="grid grid-cols-4 gap-3">
            {game.cards.map((card, idx) => <SpyCard key={idx} card={card} />)}
          </div>
        </div>

        <div className="bg-card rounded-[2rem] border border-border shadow-xl p-6 text-center">
          {isBriefing ? (
            <>
              <p className="text-sm text-muted-foreground mb-5">Give the clue verbally, then submit the number.</p>
              <div className="flex items-center justify-center gap-4 mb-6">
                <button type="button" onClick={() => adjust(-1)} className="w-16 h-16 rounded-[1.35rem] border border-border bg-secondary text-4xl font-bold shadow-sm hover:bg-muted transition-colors">-</button>
                <div className={`w-28 h-28 rounded-[2rem] border ${accentBg} flex items-center justify-center text-6xl font-black ${accentClass} shadow-inner`}>{Math.min(number, maxNumber)}</div>
                <button type="button" onClick={() => adjust(1)} className="w-16 h-16 rounded-[1.35rem] border border-border bg-secondary text-4xl font-bold shadow-sm hover:bg-muted transition-colors">+</button>
              </div>
              <Button
                type="button"
                onClick={() => socket?.send(JSON.stringify({ type: 'submit_number', number: Math.min(number, maxNumber) }))}
                className="w-full rounded-full h-auto py-4 text-lg font-bold"
              >
                Submit {Math.min(number, maxNumber)}
              </Button>
            </>
          ) : (
            <>
              <div className="text-sm text-muted-foreground">Player device is guessing.</div>
              <div className={`text-5xl font-black mt-4 ${accentClass}`}>{game.guessesRemaining}</div>
              <div className="text-xs text-muted-foreground mt-2 tracking-[0.18em] uppercase">guesses remaining</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
