'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

interface ResultOverlayProps {
    show: boolean;
    isCorrect: boolean;
    onComplete?: () => void;
    duration?: number; // milliseconds
}

export default function ResultOverlay({
    show,
    isCorrect,
    onComplete,
    duration = 1500,
}: ResultOverlayProps) {
    useEffect(() => {
        if (show && onComplete) {
            const timer = setTimeout(onComplete, duration);
            return () => clearTimeout(timer);
        }
    }, [show, onComplete, duration]);

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`
                        fixed inset-0 z-50 flex items-center justify-center
                        ${isCorrect ? 'bg-accent-green/30' : 'bg-accent-hover/30'}
                    `}
                >
                    <motion.div
                        initial={{ scale: 0.5 }}
                        animate={{ scale: [0.5, 1, 0.5] }}
                        transition={{ duration: duration / 1000, ease: 'easeInOut' }}
                        className="text-center"
                    >
                        {isCorrect ? (
                            <div className="text-[200px] text-accent-green">✓</div>
                        ) : (
                            <div className="text-[200px] text-accent-hover">✗</div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
