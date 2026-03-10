'use client';

import Header from '@/app/components/Header';
import Button from '@/app/components/Button';
import { Card, CardContent } from '@/components/ui/card';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

export default function DemoLandingPage() {
    const device = useDeviceDetection();

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <div className="max-w-4xl mx-auto px-6 py-16">
                <div className="text-center mb-12">
                    <div className="text-7xl mb-4">🎮</div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Demo Game</h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        A simple counter sync demo to test real-time connections across devices.
                    </p>
                </div>

                {device === 'desktop' ? (
                    <Card className="rounded-2xl mb-8 text-center">
                        <CardContent className="p-8">
                            <div className="text-5xl mb-4">🖥️</div>
                            <h2 className="text-2xl font-bold mb-3">Host on PC/TV</h2>
                            <p className="text-muted-foreground mb-6">
                                Start a game session and show a QR code for others to join.
                            </p>
                            <Button href="/host?game=demo" className="w-full max-w-md mx-auto">
                                Host Demo Game
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
                            <span>Host creates a room and displays a QR code</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="font-bold">2.</span>
                            <span>Players scan the code or enter the room code manually</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="font-bold">3.</span>
                            <span>Host starts the game when everyone is ready</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="font-bold">4.</span>
                            <span>All devices sync in real-time using PartyKit</span>
                        </li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
