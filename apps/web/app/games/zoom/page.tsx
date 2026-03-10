'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Header from '@/app/components/Header';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

const TvIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
        <rect width="20" height="15" x="2" y="7" rx="2" ry="2" /><polyline points="17 2 12 7 7 2" />
    </svg>
);

const UsersIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

const ZoomInIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        <line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
    </svg>
);

const CircleCheckIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
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

const stepIcons = [TvIcon, UsersIcon, ZoomInIcon, CircleCheckIcon, TrophyIcon];

const steps = [
    'Host opens the game on a TV or large screen — a room code and QR code appear automatically.',
    'Players scan the QR code or enter the room code on their phones to join instantly.',
    'A zoomed-in image appears on screen and slowly reveals itself over 90 seconds.',
    'Type your guess on your phone — the faster you get it right, the more points you earn!',
    'After each round results are shown. Most points after all rounds wins!',
];

export default function ZoomLandingPage() {
    const device = useDeviceDetection();

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <div className="max-w-[1100px] mx-auto px-6 py-12 flex flex-col md:flex-row items-center gap-10 md:gap-16">
                <div className="flex-1 w-full text-center md:text-left">
                    <div className="relative h-24 max-w-xs mx-auto md:mx-0 mb-4 flex items-center justify-center md:justify-start">
                        <motion.div
                            className="w-20 h-20 rounded-full bg-secondary border-2 border-border flex items-center justify-center text-4xl shadow-sm"
                            initial={{ scale: 4, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.9, ease: 'easeOut' }}
                        >
                            🔍
                        </motion.div>
                    </div>

                    <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl md:text-5xl font-bold mb-2">
                        Zoom-Out
                    </motion.h1>

                    <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-foreground text-lg mb-6">
                        A zoomed-in image gradually reveals itself. Race to guess what it is first!
                    </motion.p>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col gap-3">
                        {device === 'unknown' ? (
                            <div className="flex justify-center md:justify-start py-4">
                                <div className="animate-spin w-6 h-6 border-2 border-border border-t-accent rounded-full" />
                            </div>
                        ) : device === 'desktop' ? (
                            <>
                                <Button asChild className="rounded-full px-8 py-4 h-auto text-lg font-bold bg-accent text-accent-foreground hover:bg-accent-hover shadow-lg hover:shadow-xl">
                                    <Link href="/games/zoom/host">Host Zoom-Out</Link>
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
                                    <Link href="/games/zoom/host">Host Zoom-Out</Link>
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
