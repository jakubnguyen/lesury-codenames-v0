'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Header from '@/app/components/Header';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

const MicIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>;
const HashIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>;
const HandIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><path d="M18 11.5V9a2 2 0 1 0-4 0V4a2 2 0 1 0-4 0v6a2 2 0 1 0-4 0v1.5"/><path d="M18 11.5a2 2 0 1 1 4 0v2A8.5 8.5 0 0 1 13.5 22H12A8 8 0 0 1 4 14v-3.5a2 2 0 1 1 4 0V12"/></svg>;
const SkipIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>;
const TrophyIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>;
const stepIcons = [MicIcon, HashIcon, HandIcon, SkipIcon, TrophyIcon];
const steps = [
  'The host chooses the language on the TV and starts the game.',
  'The spymaster gives a verbal clue and submits only the number on their phone.',
  'The player phone taps words on the shared 20-word board.',
  'A wrong word or Skip ends the turn immediately and hands play to the other team.',
  'Find all your team words before the other team, and avoid the assassin.',
];

function HeroBoard() {
  return (
    <div className="relative h-28 max-w-sm mx-auto md:mx-0 mb-4">
      <motion.div className="absolute inset-0 grid grid-cols-5 gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div key={i} className="rounded-lg border-2 border-border bg-card h-10" initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.02 * i }} />
        ))}
      </motion.div>
      <motion.div className="absolute -right-4 top-6 w-12 h-12 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center font-black text-2xl shadow-lg" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.55 }}>3</motion.div>
    </div>
  );
}

export default function OneWordLandingPage() {
  const device = useDeviceDetection();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-[1100px] mx-auto px-6 py-12 flex flex-col md:flex-row items-center gap-10 md:gap-16">
        <div className="flex-1 w-full text-center md:text-left">
          <HeroBoard />
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl md:text-5xl font-bold mb-2">OneWord</motion.h1>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-foreground text-lg mb-6">One spymaster. One shared player phone. One spoken clue. Guess the board before the other team does.</motion.p>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col gap-3">
            {device === 'unknown' ? (
              <div className="flex justify-center py-4"><div className="animate-spin w-6 h-6 border-2 border-border border-t-accent rounded-full" /></div>
            ) : device === 'desktop' ? (
              <>
                <Button asChild className="rounded-full px-8 py-4 h-auto text-lg font-bold bg-accent text-accent-foreground hover:bg-accent-hover shadow-lg hover:shadow-xl"><Link href="/games/oneword/host">Host OneWord</Link></Button>
                <Button asChild variant="outline" className="rounded-full px-8 py-4 h-auto text-lg font-bold shadow-md hover:shadow-lg"><Link href="/games/oneword/join">Join a Game</Link></Button>
              </>
            ) : (
              <>
                <Button asChild className="rounded-full px-8 py-4 h-auto text-lg font-bold bg-accent text-accent-foreground hover:bg-accent-hover shadow-lg hover:shadow-xl"><Link href="/games/oneword/join">Join a Game</Link></Button>
                <Button asChild variant="outline" className="rounded-full px-8 py-4 h-auto text-lg font-bold shadow-md hover:shadow-lg"><Link href="/games/oneword/host">Host OneWord</Link></Button>
              </>
            )}
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex-1 w-full">
          <h3 className="text-lg font-bold mb-4">How to Play</h3>
          <div className="bg-card rounded-2xl p-7 shadow-md">
            {steps.map((step, i) => {
              const Icon = stepIcons[i];
              return <div key={i}>{i > 0 && <Separator className="my-4" />}<div className="flex items-center gap-3 text-accent"><Icon /><span className="flex-shrink-0 w-7 h-7 rounded-full bg-accent text-accent-foreground text-[13px] font-bold flex items-center justify-center">{i + 1}</span><span className="text-sm text-foreground leading-snug">{step}</span></div></div>;
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
