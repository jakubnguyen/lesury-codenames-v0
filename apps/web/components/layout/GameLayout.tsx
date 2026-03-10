'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface GameLayoutProps {
    children: ReactNode;
    backUrl: string;
    backLabel?: string;
    theme?: 'light' | 'dark';
    showBackButton?: boolean;
}

export default function GameLayout({
    children,
    backUrl,
    backLabel = '← Back',
    theme = 'light',
    showBackButton = true,
}: GameLayoutProps) {
    const router = useRouter();
    const bgColor = theme === 'dark' ? 'bg-secondary' : 'bg-background';

    return (
        <div className={`min-h-screen ${bgColor}`}>
            {showBackButton && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
                    <Button
                        variant="ghost"
                        onClick={() => router.push(backUrl)}
                        className={`${
                            theme === 'dark'
                                ? 'text-muted-foreground hover:text-white'
                                : 'text-muted-foreground hover:text-foreground'
                        } text-sm sm:text-base`}
                    >
                        {backLabel}
                    </Button>
                </div>
            )}
            {children}
        </div>
    );
}
