'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from '@/components/ThemeToggle';

export function GameHeader() {
    return (
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-5 z-10">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Image
                    src="/logo.png"
                    alt="Lesury"
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full object-cover"
                />
                <span className="text-lg font-bold text-foreground">lesury</span>
            </Link>
            <ThemeToggle />
        </div>
    );
}
