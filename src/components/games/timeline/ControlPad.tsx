'use client';

import { motion } from 'framer-motion';

interface ControlPadProps {
    onMoveLeft: () => void;
    onMoveRight: () => void;
    onPlace: () => void;
    disabled?: boolean;
}

export default function ControlPad({
    onMoveLeft,
    onMoveRight,
    onPlace,
    disabled = false,
}: ControlPadProps) {
    const buttonBase = `
        flex items-center justify-center font-bold
        transition-all duration-200 active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
    `;

    const arrowButton = `
        ${buttonBase}
        w-20 h-20 rounded-2xl
        ${disabled ? 'bg-[#E8E6DC] text-[#B0AEA5]' : 'bg-[#141413] text-[#FAF9F5] shadow-lg'}
    `;

    const placeButton = `
        ${buttonBase}
        w-24 h-24 rounded-full
        ${disabled ? 'bg-[#E8E6DC] text-[#B0AEA5]' : 'bg-[#D97757] text-[#FAF9F5] shadow-xl'}
    `;

    return (
        <div className="flex items-center justify-center gap-4 p-6">
            {/* Left Arrow */}
            <motion.button
                whileTap={!disabled ? { scale: 0.9 } : {}}
                onClick={onMoveLeft}
                disabled={disabled}
                className={arrowButton}
                aria-label="Move left"
            >
                <span className="text-3xl">‹</span>
            </motion.button>

            {/* Place Button (center, larger, round) */}
            <motion.button
                whileTap={!disabled ? { scale: 0.95 } : {}}
                onClick={onPlace}
                disabled={disabled}
                className={placeButton}
                aria-label="Place card"
            >
                <span className="text-4xl">✓</span>
            </motion.button>

            {/* Right Arrow */}
            <motion.button
                whileTap={!disabled ? { scale: 0.9 } : {}}
                onClick={onMoveRight}
                disabled={disabled}
                className={arrowButton}
                aria-label="Move right"
            >
                <span className="text-3xl">›</span>
            </motion.button>
        </div>
    );
}
