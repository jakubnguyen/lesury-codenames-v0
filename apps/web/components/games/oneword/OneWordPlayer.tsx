'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { PartySocket } from 'partysocket';
import type { RoomState, OneWordPublicCard, OneWordPublicGameState } from '@lesury/game-logic';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import LeadCaptureForm from '@/components/LeadCaptureForm';

interface Props {
  state: { room: RoomState; game: OneWordPublicGameState };
  socket: PartySocket | null;
}

function Card({ card, onTap, active }: { card: OneWordPublicCard; onTap: () => void; active: boolean }) {
  const base = 'rounded-[1.35rem] border min-h-[82px] flex items-center justify-center px-3 py-3 text-center text-[13px] leading-tight font-bold tracking-[0.14em] uppercase transition-all shadow-sm';

  if (!card.revealed) {
    return (
      <button
        type="button"
        onClick={active ? onTap : undefined}
        disabled={!active}
        className={`${base} ${
          active
            ? 'bg-card border-border text-foreground hover:-translate-y-0.5 hover:shadow-md'
            : 'bg-card/70 border-border text-foreground opacity-60'
        }`}
      >
        {card.word}
      </button>
    );
  }

  if (card.type === 'red') {
    return <div className={`${base} bg-accent border-accent text-accent-foreground line-through opacity-85`}>{card.word}</div>;
  }

  if (card.type === 'blue') {
    return <div className={`${base} bg-[var(--accent-blue)] border-[var(--accent-blue)] text-white line-through opacity-85`}>{card.word}</div>;
  }

  if (card.type === 'assassin') {
    return <div className={`${base} bg-primary border-primary text-primary-foreground line-through opacity-85`}>{card.word}</div>;
  }

  return <div className={`${base} bg-secondary border-border text-muted-foreground line-through opacity-85`}>{card.word}</div>;
}

interface GameOverSnapshot {
  winner: OneWordPublicGameState['winner'];
  winReason: OneWordPublicGameState['winReason'];
}

export default function OneWordPlayer({ state, socket }: Props) {
  const { room, game } = state;
  const [gameOverSnapshot, setGameOverSnapshot] = useState<GameOverSnapshot | null>(null);
  const liveGameOverSnapshot = game.phase === 'game_over'
    ? {
        winner: game.winner,
        winReason: game.winReason,
      }
    : null;

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
            <p className="text-sm text-muted-foreground">Round Summary</p>
            <p className="text-lg font-bold text-accent">{subtitle}</p>
          </div>

          <div className="mb-6">
            <LeadCaptureForm />
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
          <div className="text-6xl mb-4">👆</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Player Phone Ready</h2>
          <p className="text-muted-foreground mb-4">
            This is the shared player controller. Wait for the host to start the game.
          </p>
          <p className="text-sm text-muted-foreground">
            Room {room.roomCode}
          </p>
        </motion.div>
      </div>
    );
  }

  const activeTeam = game.phase.startsWith('red') ? 'red' : game.phase.startsWith('blue') ? 'blue' : null;
  const isGuessing = game.phase === 'red_guessing' || game.phase === 'blue_guessing';
  const accentClass = activeTeam === 'red' ? 'text-accent' : 'text-[var(--accent-blue)]';
  const panelClass = activeTeam === 'red' ? 'border-accent bg-accent/10' : 'border-[var(--accent-blue)] bg-[color:rgba(106,155,204,0.10)]';

  return (
    <div className="min-h-screen bg-background text-foreground p-6 relative overflow-hidden">
      <div className="fixed top-4 right-4 z-50"><ThemeToggle /></div>
      <div className="absolute -top-20 -left-10 w-48 h-48 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
      <div className="absolute top-32 -right-12 w-56 h-56 rounded-full bg-[color:rgba(106,155,204,0.10)] blur-3xl pointer-events-none" />

      <div className="max-w-lg mx-auto pt-12 relative">
        <div className={`rounded-[2rem] border ${panelClass} text-center p-6 mb-5 shadow-lg backdrop-blur-sm`}>
          <div className="text-xs font-bold tracking-[0.22em] text-muted-foreground">PLAYER PHONE</div>
          <div className={`text-3xl font-black mt-3 ${accentClass}`}>{activeTeam?.toUpperCase()} {isGuessing ? 'guessing' : 'briefing'}</div>
          <div className="text-sm text-muted-foreground mt-3 max-w-sm mx-auto">
            {isGuessing ? `${game.guessesRemaining} guesses remaining` : 'Listen to the verbal clue, then wait for the spymaster to submit the number.'}
          </div>
        </div>

        <div className="bg-card/95 border border-border rounded-[2rem] p-4 shadow-xl">
          <div className="grid grid-cols-4 gap-3">
            {game.cards.map((card, idx) => (
              <Card
                key={idx}
                card={card}
                active={isGuessing && !card.revealed}
                onTap={() => socket?.send(JSON.stringify({ type: 'guess_word', cardIndex: idx }))}
              />
            ))}
          </div>
        </div>

        {isGuessing && (
          <Button
            type="button"
            variant="outline"
            onClick={() => socket?.send(JSON.stringify({ type: 'skip_turn' }))}
            className="w-full mt-5 rounded-full h-auto py-4 text-base font-bold shadow-sm bg-background/80"
          >
            Skip Turn
          </Button>
        )}
      </div>
    </div>
  );
}
