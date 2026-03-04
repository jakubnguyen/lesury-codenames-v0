'use client';

import { ReactNode } from 'react';

interface GameLayoutProps {
    children: ReactNode;
    /**
     * URL to navigate back to (e.g., '/games/timeline')
     */
    backUrl: string;
    /**
     * Label for the back button
     */
    backLabel?: string;
    /**
     * Background color theme: 'light' or 'dark'
     */
    theme?: 'light' | 'dark';
    /**
     * Whether to show the back button
     */
    showBackButton?: boolean;
}

export default function GameLayout({
    children,
    backUrl,
    backLabel = '← Back',
    theme = 'light',
    showBackButton = true,
}: GameLayoutProps) {
    const bgColor = theme === 'dark' ? 'bg-[#2A2A2A]' : 'bg-[#FAF9F5]';
    const textColor = theme === 'dark' ? 'text-[#B0AEA5] hover:text-white' : 'text-[#B0AEA5] hover:text-[#141413]';

    return (
        <div className={`min-h-screen ${bgColor}`}>
            {showBackButton && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
                    <button
                        onClick={() => window.location.href = backUrl}
                        className={`${textColor} flex items-center gap-2 transition-colors text-sm sm:text-base`}
                    >
                        {backLabel}
                    </button>
                </div>
            )}
            {children}
        </div>
    );
}
