import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
    return (
        <header className="w-full py-4 px-6">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <Image
                        src="/logo.png"
                        alt="Lesury"
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover"
                    />
                    <span className="text-2xl font-extrabold text-[#141413]">
                        lesury
                    </span>
                </Link>

                {/* Navigation */}
                <Link
                    href="/games"
                    className="bg-[#141413] text-[#FAF9F5] px-6 py-2 rounded-full font-semibold hover:bg-opacity-90 transition-all duration-200 text-sm"
                >
                    Browse Games
                </Link>
            </div>
        </header>
    );
}
