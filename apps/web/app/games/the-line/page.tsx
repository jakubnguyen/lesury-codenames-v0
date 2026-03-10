'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Header from '@/app/components/Header';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

const SlidersIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
        <line x1="21" x2="14" y1="4" y2="4" /><line x1="10" x2="3" y1="4" y2="4" />
        <line x1="21" x2="12" y1="12" y2="12" /><line x1="8" x2="3" y1="12" y2="12" />
        <line x1="21" x2="16" y1="20" y2="20" /><line x1="12" x2="3" y1="20" y2="20" />
        <circle cx="12" cy="4" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="14" cy="20" r="2" />
    </svg>
);

const LayersIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
        <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
        <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" />
        <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" />
    </svg>
);

const ArrowLeftRightIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
        <polyline points="8 3 4 7 8 11" /><line x1="4" y1="7" x2="20" y2="7" />
        <polyline points="16 21 20 17 16 13" /><line x1="20" y1="17" x2="4" y2="17" />
    </svg>
);

const CircleCheckIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
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

const stepIcons = [SlidersIcon, LayersIcon, ArrowLeftRightIcon, CircleCheckIcon, TrophyIcon];

const steps = [
    'The host chooses a category (Weight, Speed, etc.) and number of rounds',
    'Each player gets an event card — you see the title but not the value',
    'Use the arrow buttons to find the right spot on the line',
    'Press PLACE to confirm — correct placement earns a point!',
    'Wrong or right, the card stays on the line. Most points wins!',
];

export default function TheLineLandingPage() {
    const device = useDeviceDetection();

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <div className="max-w-[1100px] mx-auto px-6 py-12 flex flex-col md:flex-row items-center gap-10 md:gap-16">
                <div className="flex-1 w-full text-center md:text-left">
                    <div className="relative h-24 max-w-xs mx-auto md:mx-0 mb-4">
                        <motion.div
                            className="absolute top-1/2 left-0 right-0 h-0.5 bg-border"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            style={{ originX: 0 }}
                        />
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                className="absolute top-1/2 w-10 h-14 rounded-lg bg-secondary border-2 border-border shadow-sm flex items-start justify-center pt-2"
                                style={{ left: `${20 + i * 30}%` }}
                                initial={{ y: -40, opacity: 0 }}
                                animate={{ y: '-50%', opacity: 1 }}
                                transition={{ delay: 0.6 + i * 0.15, duration: 0.4, ease: 'easeOut' }}
                            >
                                <div className="h-1 w-5 rounded-full bg-accent" style={{ opacity: 0.6 + i * 0.2 }} />
                            </motion.div>
                        ))}
                    </div>

                    <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl md:text-5xl font-bold mb-2">
                        The Line
                    </motion.h1>

                    <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-foreground text-lg mb-6">
                        Place events in order by weight, speed, population, and more. Can you find the right spot on the line?
                    </motion.p>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col gap-3">
                        {device === 'unknown' ? (
                            <div className="flex justify-center py-4">
                                <div className="animate-spin w-6 h-6 border-2 border-border border-t-accent rounded-full" />
                            </div>
                        ) : device === 'desktop' ? (
                            <>
                                <Button asChild className="rounded-full px-8 py-4 h-auto text-lg font-bold bg-accent text-accent-foreground hover:bg-accent-hover shadow-lg hover:shadow-xl">
                                    <Link href="/games/the-line/host">Host The Line</Link>
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
                                    <Link href="/games/the-line/host">Host The Line</Link>
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
