'use client';

import Header from '../components/Header';
import GameCard from '../components/GameCard';
import Button from '../components/Button';

export default function GamesPage() {
    return (
        <div className="min-h-screen">
            <Header />

            <section className="max-w-7xl mx-auto px-6 py-12">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">Games Library</h1>
                <p className="text-muted-foreground text-lg">
                    Choose a game to play with friends. More games coming soon!
                </p>
            </section>

            <section className="max-w-7xl mx-auto px-6 pb-16">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <GameCard
                        title="The Line"
                        description="Sort events by weight, speed, population and more. Can you find the right spot on the line?"
                        emoji="📏"
                        players="2-8"
                        duration="15-25 min"
                        href="/games/the-line"
                        index={0}
                    />

                    <GameCard
                        title="Guessio"
                        description="A team-based word guessing game inspired by Activity. Bet points on your skills!"
                        emoji="🎭"
                        players="4-12"
                        duration="20-40 min"
                        href="/games/guessio"
                        index={1}
                    />

                    <GameCard
                        title="Zoom-out"
                        description="A zoomed-in image gradually reveals itself. Race to guess what it is first!"
                        emoji="🔍"
                        players="2-12"
                        duration="10-20 min"
                        href="/games/zoom"
                        index={2}
                    />

                    <GameCard
                        title="OneWord"
                        description="A spoken-clue team game for two shared phones. The spymaster sets the number, the team taps the board."
                        emoji="🧠"
                        players="4-10"
                        duration="10-20 min"
                        href="/games/oneword"
                        index={3}
                    />

                    <GameCard
                        title="Mindshot"
                        description="Move, shoot, survive on a shrinking grid. Plan your moves in secret, then watch the chaos unfold!"
                        emoji="🎯"
                        players="2-4"
                        duration="5-10 min"
                        href="/games/mindshot"
                        index={4}
                    />

                    <GameCard
                        title="Spectrum"
                        description="Find the hidden target on a scale between two opposites. Tune in to your team's thinking!"
                        emoji="⚖️"
                        players="3-8"
                        duration="15-25 min"
                        href="/games/spectrum"
                        comingSoon
                        index={5}
                    />
                </div>
            </section>

            <section className="bg-secondary py-16">
                <div className="max-w-3xl mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold mb-4">Have a game idea?</h2>
                    <p className="text-muted-foreground mb-8">
                        We&apos;re always looking to expand our library. Let us know what games you&apos;d
                        love to play!
                    </p>
                    <Button href="mailto:hello@lesury.com">Suggest a Game</Button>
                </div>
            </section>

            <footer className="border-t border-border py-8">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="text-xl">⊙</span>
                            <span className="font-semibold">lesury</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            © 2026 Lesury. Board games, reimagined.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
