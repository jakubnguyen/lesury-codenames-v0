'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import Header from './components/Header';
import Button from './components/Button';
import GameCard from './components/GameCard';
import AnimatedHero from './components/AnimatedHero';
import { Card, CardContent } from '@/components/ui/card';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

export default function Home() {
    const device = useDeviceDetection();

    return (
        <div className="min-h-screen">
            <Header />

            <section className="max-w-7xl mx-auto px-8 py-16 md:py-24">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
                            Turn any screen into a{' '}
                            <span className="text-accent">game night</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-muted-foreground mb-8">
                            Play board games together using your phones as controllers. No apps to
                            install, just scan and play.
                        </p>
                        <motion.div
                            className="flex flex-wrap gap-4"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.2 }}
                        >
                            {device === 'mobile' ? (
                                <Button href="/join">Join Game</Button>
                            ) : (
                                <Button href="/games">Explore Games</Button>
                            )}
                            <Button href="/games/the-line" variant="secondary">
                                Try The Line Free
                            </Button>
                        </motion.div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="flex justify-center"
                    >
                        <AnimatedHero />
                    </motion.div>
                </div>
            </section>

            <section className="bg-secondary py-16">
                <div className="max-w-7xl mx-auto px-6">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
                        How It Works
                    </h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <Card className="rounded-2xl text-center hover:shadow-xl transition-shadow">
                            <CardContent className="p-8">
                                <div className="text-5xl mb-4">📺</div>
                                <h3 className="text-xl font-bold mb-3">Open on TV</h3>
                                <p className="text-muted-foreground">
                                    Launch any game on your big screen or computer.
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="rounded-2xl text-center hover:shadow-xl transition-shadow">
                            <CardContent className="p-8">
                                <div className="text-5xl mb-4">📱</div>
                                <h3 className="text-xl font-bold mb-3">Scan QR Code</h3>
                                <p className="text-muted-foreground">
                                    Players scan with their phones to join instantly.
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="rounded-2xl text-center hover:shadow-xl transition-shadow">
                            <CardContent className="p-8">
                                <div className="text-5xl mb-4">🎉</div>
                                <h3 className="text-xl font-bold mb-3">Play Together</h3>
                                <p className="text-muted-foreground">
                                    Use your phone as a personal controller.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            <footer className="border-t border-border py-8">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center justify-between">
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-muted-foreground hover:opacity-80 transition-opacity"
                        >
                            <Image
                                src="/logo.png"
                                alt="Lesury"
                                width={24}
                                height={24}
                                className="w-6 h-6 rounded-full object-cover"
                            />
                            <span className="font-semibold">lesury</span>
                        </Link>
                        <div className="text-sm text-muted-foreground">
                            © 2026 Lesury. Board games, reimagined.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
