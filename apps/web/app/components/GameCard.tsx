'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';

export interface GameCardProps {
    title: string;
    description: string;
    emoji: string;
    icon?: string;
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
    icon,
    players,
    duration,
    href,
    comingSoon = false,
    index = 0,
}: GameCardProps) {
    const isAvailable = !comingSoon;

    const Wrapper = comingSoon ? 'div' : Link;
    const wrapperProps = comingSoon
        ? { className: 'block cursor-not-allowed' }
        : { href, className: 'block' };

    return (
        <Wrapper {...(wrapperProps as any)}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`
                    group relative bg-secondary p-6 rounded-2xl shadow-md transition-all duration-200 h-full overflow-hidden
                    ${isAvailable
                        ? 'cursor-pointer hover:shadow-xl hover:scale-[1.02] hover:bg-card hover:ring-2 hover:ring-accent/40'
                        : 'opacity-60 cursor-not-allowed'
                    }
                `}
            >
                {comingSoon && (
                    <Badge variant="secondary" className="absolute top-4 right-4 bg-muted-foreground text-primary-foreground">
                        Coming Soon
                    </Badge>
                )}

                <div className="mb-4">
                    {icon ? (
                        <Image
                            src={icon}
                            alt={title}
                            width={64}
                            height={64}
                            className="w-16 h-16 rounded-xl object-cover"
                        />
                    ) : (
                        <span className="text-5xl">{emoji}</span>
                    )}
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{description}</p>

                {(players || duration) && (
                    <div className="flex gap-4 text-sm text-muted-foreground">
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

                {isAvailable && (
                    <div className="absolute bottom-0 inset-x-0 bg-accent py-2.5 flex items-center justify-center translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                        <span className="text-accent-foreground font-bold text-sm tracking-wide">Play Now →</span>
                    </div>
                )}
            </motion.div>
        </Wrapper>
    );
}
