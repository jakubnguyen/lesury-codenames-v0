'use client';

import { motion } from 'framer-motion';

export default function AnimatedHero() {
    return (
        <div className="relative w-full max-w-md mx-auto">
            {/* Main TV/Monitor */}
            <div className="bg-[#141413] rounded-3xl p-4 shadow-2xl">
                <div className="bg-[#FAF9F5] rounded-2xl p-8 aspect-video flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-5xl mb-2">🎮</div>
                        <div className="text-sm font-semibold text-[#141413]">Game Screen</div>
                    </div>
                </div>
            </div>

            {/* Floating Phone 1 (Left) */}
            <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-4 -left-8 bg-[#141413] rounded-2xl p-2 shadow-xl"
            >
                <div className="bg-[#FAF9F5] rounded-xl w-16 h-24 flex items-center justify-center">
                    <span className="text-2xl">📱</span>
                </div>
            </motion.div>

            {/* Floating Phone 2 (Right) */}
            <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2.3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute -bottom-2 -right-6 bg-[#141413] rounded-2xl p-2 shadow-xl"
            >
                <div className="bg-[#FAF9F5] rounded-xl w-16 h-24 flex items-center justify-center">
                    <span className="text-2xl">📱</span>
                </div>
            </motion.div>

            {/* Connection Dots (Left side) */}
            <div className="absolute top-1/2 -left-16 flex gap-1">
                {[...Array(4)].map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                        className="w-2 h-2 bg-[#D97757] rounded-full"
                    />
                ))}
            </div>

            {/* Connection Dots (Right side) */}
            <div className="absolute top-1/2 -right-16 flex gap-1">
                {[...Array(4)].map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 + 0.3 }}
                        className="w-2 h-2 bg-[#D97757] rounded-full"
                    />
                ))}
            </div>
        </div>
    );
}
