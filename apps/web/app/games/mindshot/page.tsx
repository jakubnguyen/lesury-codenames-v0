'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Header from '@/app/components/Header';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

const MoveIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
        <polyline points="5 9 2 12 5 15" /><polyline points="9 5 12 2 15 5" />
        <polyline points="15 19 12 22 9 19" /><polyline points="19 9 22 12 19 15" />
        <line x1="2" y1="12" x2="22" y2="12" /><line x1="12" y1="2" x2="12" y2="22" />
    </svg>
);

const CrosshairIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
        <circle cx="12" cy="12" r="10" /><line x1="22" y1="12" x2="18" y2="12" />
        <line x1="6" y1="12" x2="2" y2="12" /><line x1="12" y1="6" x2="12" y2="2" />
        <line x1="12" y1="22" x2="12" y2="18" />
    </svg>
);

const ZapIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
);

const ShieldIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);

const TrophyIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
);

const stepIcons = [MoveIcon, CrosshairIcon, ZapIcon, ShieldIcon, TrophyIcon];

const steps = [
    'The host picks arena size and round timer, then starts the game.',
    'Each round, secretly choose 2 moves and 1 shot direction on your phone.',
    'Watch the action unfold on the TV \u2014 moves, shots, and zone damage resolve automatically.',
    'Avoid the shrinking red danger zone \u2014 it costs 1 HP per round!',
    'Last player with HP remaining wins the match.',
];

function GridHero() {
    const CELL = 28;
    const GAP = 2;
    const SIZE = 6;
    const W = SIZE * (CELL + GAP);
    const H = SIZE * (CELL + GAP);

    const dangerCells = [
        [0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5],
        [1, 0], [1, 5], [2, 0], [2, 5], [3, 0], [3, 5],
        [4, 0], [4, 5], [5, 0], [5, 1], [5, 2], [5, 3], [5, 4], [5, 5],
    ];
    const warningCells = [[1, 1], [1, 4], [4, 1], [4, 4]];
    const players = [
        { row: 2, col: 2, color: '#3B82F6' },
        { row: 3, col: 3, color: '#22C55E' },
        { row: 2, col: 4, color: '#A855F7' },
    ];

    const isDanger = (r: number, c: number) => dangerCells.some(([dr, dc]) => dr === r && dc === c);
    const isWarning = (r: number, c: number) => warningCells.some(([wr, wc]) => wr === r && wc === c);

    return (
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
            {Array.from({ length: SIZE }, (_, r) =>
                Array.from({ length: SIZE }, (_, c) => {
                    const x = c * (CELL + GAP);
                    const y = r * (CELL + GAP);
                    const fill = isDanger(r, c)
                        ? '#E63946'
                        : isWarning(r, c)
                          ? '#F4A261'
                          : '#F0EFEA';
                    return (
                        <motion.rect
                            key={`${r}-${c}`}
                            x={x} y={y} width={CELL} height={CELL} rx={4}
                            fill={fill}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: isDanger(r, c) ? 0.85 : 1, scale: 1 }}
                            transition={{ delay: (r + c) * 0.03, duration: 0.3 }}
                            style={{ transformOrigin: `${x + CELL / 2}px ${y + CELL / 2}px` }}
                        />
                    );
                })
            )}
            {players.map((p, i) => {
                const cx = p.col * (CELL + GAP) + CELL / 2;
                const cy = p.row * (CELL + GAP) + CELL / 2;
                return (
                    <motion.circle
                        key={i}
                        cx={cx} cy={cy} r={10}
                        fill={p.color}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + i * 0.1, duration: 0.3, ease: 'easeOut' }}
                        style={{ transformOrigin: `${cx}px ${cy}px` }}
                    />
                );
            })}
        </svg>
    );
}

export default function MindshotLandingPage() {
    const device = useDeviceDetection();

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <div className="max-w-[1100px] mx-auto px-6 py-12 flex flex-col md:flex-row items-center gap-10 md:gap-16">
                <div className="flex-1 w-full text-center md:text-left">
                    <div className="flex justify-center md:justify-start mb-4">
                        <GridHero />
                    </div>

                    <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl md:text-5xl font-bold mb-2">
                        Mindshot
                    </motion.h1>

                    <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-foreground text-lg mb-6">
                        Move, shoot, survive. Last player standing wins on a shrinking battlefield.
                    </motion.p>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col gap-3">
                        {device === 'unknown' ? (
                            <div className="flex justify-center py-4">
                                <div className="animate-spin w-6 h-6 border-2 border-border border-t-accent rounded-full" />
                            </div>
                        ) : device === 'desktop' ? (
                            <>
                                <Button asChild className="rounded-full px-8 py-4 h-auto text-lg font-bold bg-accent text-accent-foreground hover:bg-accent-hover shadow-lg hover:shadow-xl">
                                    <Link href="/games/mindshot/host">Host Mindshot</Link>
                                </Button>
                                <Button asChild variant="outline" className="rounded-full px-8 py-4 h-auto text-lg font-bold shadow-md hover:shadow-lg">
                                    <Link href="/join">Join a Game</Link>
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button asChild className="rounded-full px-8 py-4 h-auto text-lg font-bold bg-accent text-accent-foreground hover:bg-accent-hover shadow-lg hover:shadow-xl">
                                    <Link href="/join">Join a Game</Link>
                                </Button>
                                <Button asChild variant="outline" className="rounded-full px-8 py-4 h-auto text-lg font-bold shadow-md hover:shadow-lg">
                                    <Link href="/games/mindshot/host">Host Mindshot</Link>
                                </Button>
                            </>
                        )}
                    </motion.div>
                </div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex-1 w-full">
                    <h3 className="text-lg font-bold mb-4">How to Play</h3>
                    <div className="bg-card rounded-2xl p-7 shadow-md">
                        {steps.map((step, i) => {
                            const Icon = stepIcons[i];
                            return (
                                <div key={i}>
                                    {i > 0 && <Separator className="my-4" />}
                                    <div className="flex items-center gap-3 text-accent">
                                        <Icon />
                                        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-accent text-accent-foreground text-[13px] font-bold flex items-center justify-center">
                                            {i + 1}
                                        </span>
                                        <span className="text-sm text-foreground leading-snug">{step}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
