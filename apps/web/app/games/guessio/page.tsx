'use client';

import Header from '@/app/components/Header';
import Button from '@/app/components/Button';
import { Card, CardContent } from '@/components/ui/card';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

export default function GuessioLandingPage() {
    const device = useDeviceDetection();

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <div className="max-w-4xl mx-auto px-6 py-16">
                <div className="text-center mb-12">
                    <div className="text-7xl mb-4">🎭</div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Guessio</h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        A team-based word guessing game inspired by Activity.
                    </p>
                </div>

                {device === 'desktop' ? (
                    <Card className="rounded-2xl mb-8 text-center">
                        <CardContent className="p-8">
                            <div className="text-5xl mb-4">🖥️</div>
                            <h2 className="text-2xl font-bold mb-3">Host on PC/TV</h2>
                            <p className="text-muted-foreground mb-6">
                                Start a game session, show the board, and display a QR code for others to join.
                            </p>
                            <Button href="/games/guessio/host" className="w-full max-w-md mx-auto">
                                Host Guessio
                            </Button>
                        </CardContent>
                    </Card>
                ) : device === 'mobile' ? (
                    <Card className="rounded-2xl mb-8 text-center">
                        <CardContent className="p-8">
                            <div className="text-5xl mb-4">📱</div>
                            <h2 className="text-2xl font-bold mb-3">Join on Mobile</h2>
                            <p className="text-muted-foreground mb-6">
                                Scan a QR code or enter a room code to join the game.
                            </p>
                            <Button href="/join" className="w-full">
                                Join Game
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="rounded-2xl mb-8 text-center">
                        <CardContent className="p-12">
                            <div className="animate-spin w-8 h-8 border-2 border-border border-t-foreground rounded-full mx-auto mb-4" />
                            <p className="text-muted-foreground">Detecting device...</p>
                        </CardContent>
                    </Card>
                )}

                <div className="bg-secondary rounded-2xl p-8">
                    <h3 className="text-xl font-bold mb-4">How It Works</h3>
                    <ol className="space-y-3 text-foreground">
                        <li className="flex gap-3">
                            <span className="font-bold">1.</span>
                            <span>Host creates a room. Minimum 4 players join, forming two teams.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="font-bold">2.</span>
                            <span>Active player chooses a word and sets a bet of 1-5 points.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="font-bold">3.</span>
                            <span>Teams try to guess the word through description, drawing, or pantomime before time runs out!</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="font-bold">4.</span>
                            <span>Win points matching your bet, or lose them if you fail.</span>
                        </li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
