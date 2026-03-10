'use client';

import { motion } from 'framer-motion';
import type { Direction } from '@lesury/game-logic';

type SlotValue = Direction | 'stay' | 'skip' | null;

interface CommandQueueProps {
    move1: SlotValue;
    move2: SlotValue;
    shoot: SlotValue;
    activeSlot: 0 | 1 | 2;
    onSlotTap: (index: 0 | 1 | 2) => void;
    disabled?: boolean;
    accentColor?: string;
}

const DIR_ARROWS: Record<string, string> = {
    up: '\u2191',
    down: '\u2193',
    left: '\u2190',
    right: '\u2192',
    stay: 'STAY',
    skip: 'SKIP',
};

interface SlotProps {
    label: string;
    icon: string;
    value: SlotValue;
    isActive: boolean;
    onTap: () => void;
    disabled?: boolean;
    accentColor: string;
}

function Slot({ label, icon, value, isActive, onTap, disabled, accentColor }: SlotProps) {
    const displayValue = value ? DIR_ARROWS[value] ?? value : '?';

    return (
        <button
            onClick={() => !disabled && onTap()}
            disabled={disabled}
            className="flex flex-col items-center gap-1 select-none"
        >
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                {icon} {label}
            </span>
            <motion.div
                className="w-16 h-16 rounded-xl flex items-center justify-center font-bold text-lg transition-colors"
                style={{
                    backgroundColor: value
                        ? accentColor
                        : isActive
                          ? '#E8E6DC'
                          : '#F0EFEA',
                    color: value ? 'white' : '#B0AEA5',
                    borderWidth: 2,
                    borderColor: isActive ? accentColor : 'transparent',
                    opacity: disabled ? 0.5 : 1,
                }}
                animate={
                    isActive && !value
                        ? { scale: [1, 1.04, 1] }
                        : { scale: 1 }
                }
                transition={
                    isActive && !value
                        ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
                        : {}
                }
            >
                {displayValue}
            </motion.div>
        </button>
    );
}

export default function CommandQueue({
    move1,
    move2,
    shoot,
    activeSlot,
    onSlotTap,
    disabled,
    accentColor = '#D97757',
}: CommandQueueProps) {
    return (
        <div className="flex gap-3 justify-center">
            <Slot
                label="Move 1"
                icon="🏃"
                value={move1}
                isActive={activeSlot === 0}
                onTap={() => onSlotTap(0)}
                disabled={disabled}
                accentColor={accentColor}
            />
            <Slot
                label="Move 2"
                icon="🏃"
                value={move2}
                isActive={activeSlot === 1}
                onTap={() => onSlotTap(1)}
                disabled={disabled}
                accentColor={accentColor}
            />
            <Slot
                label="Shoot"
                icon="🎯"
                value={shoot}
                isActive={activeSlot === 2}
                onTap={() => onSlotTap(2)}
                disabled={disabled}
                accentColor={accentColor}
            />
        </div>
    );
}
