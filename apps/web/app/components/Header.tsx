'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Header() {
    return (
        <header className="w-full py-4 px-6">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <Link
                    href="/"
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                    <Image
                        src="/logo.png"
                        alt="Lesury"
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover"
                    />
                    <span className="text-2xl font-extrabold text-foreground">lesury</span>
                </Link>

                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <Button asChild className="rounded-full">
                        <Link href="/games">Browse Games</Link>
                    </Button>
                </div>
            </div>
        </header>
    );
}

