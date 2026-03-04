'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export interface GameCardProps {
    title: string;
    description: string;
    emoji: string;
    players?: string;
    duration?: string;
    href: string;
    comingSoon?: boolean;
    index?: number;
}

export default function GameCard({
    title,
    description,
    emoji,
    players,
    duration,
    href,
    comingSoon = false,
    index = 0,
}: GameCardProps) {
    const isAvailable = !comingSoon;

    return (
        <Link
            href={comingSoon ? '#' : href}
            className={`block ${comingSoon ? 'cursor-not-allowed' : ''}`}
        >
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`
                    relative bg-[#F0EFEA] p-6 rounded-2xl shadow-md transition-all duration-200 h-full
                    ${isAvailable
                        ? 'cursor-pointer hover:shadow-xl hover:scale-[1.02] hover:bg-white'
                        : 'opacity-60 cursor-not-allowed'
                    }
                `}
            >
                {comingSoon && (
                    <div className="absolute top-4 right-4 bg-[#B0AEA5] text-[#FAF9F5] text-xs font-semibold px-2 py-1 rounded-full">
                        Coming Soon
                    </div>
                )}

                <div className="text-5xl mb-4">{emoji}</div>
                <h3 className="text-xl font-bold text-[#141413] mb-2">
                    {title}
                </h3>
                <p className="text-[#B0AEA5] text-sm mb-4 line-clamp-2">
                    {description}
                </p>

                {(players || duration) && (
                    <div className="flex gap-4 text-sm text-[#B0AEA5]">
                        {players && (
                            <div className="flex items-center gap-1">
                                <span>👥</span>
                                <span>{players}</span>
                            </div>
                        )}
                        {duration && (
                            <div className="flex items-center gap-1">
                                <span>⏱️</span>
                                <span>{duration}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Hover Overlay - CSS only for smooth animation */}
                {isAvailable && (
                    <div className="absolute inset-0 bg-[#141413] bg-opacity-90 rounded-2xl flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                        <span className="text-[#FAF9F5] font-bold text-lg">
                            Play Now →
                        </span>
                    </div>
                )}
            </motion.div>
        </Link>
    );
}
