'use client';

import type { Direction } from '@lesury/game-logic';

interface DPadProps {
    onDirection: (dir: Direction) => void;
    onCenter: () => void;
    centerLabel: string;
    disabled?: boolean;
    accentColor?: string;
    selectedDirection?: Direction | 'stay' | 'skip' | null;
}

const DIR_ARROWS: Record<Direction, string> = {
    up: '\u2191',
    down: '\u2193',
    left: '\u2190',
    right: '\u2192',
};

export default function DPad({
    onDirection,
    onCenter,
    centerLabel,
    disabled,
    accentColor = '#D97757',
    selectedDirection,
}: DPadProps) {
    const btnBase =
        'w-16 h-16 rounded-2xl font-bold text-2xl flex items-center justify-center transition-all active:scale-95 select-none';

    function btnStyle(dir: Direction | 'stay' | 'skip') {
        const isSelected = selectedDirection === dir;
        return {
            backgroundColor: isSelected ? accentColor : '#F0EFEA',
            color: isSelected ? 'white' : '#141413',
            opacity: disabled ? 0.5 : 1,
            cursor: disabled ? 'not-allowed' as const : 'pointer' as const,
            boxShadow: isSelected ? `0 4px 12px ${accentColor}40` : 'none',
        };
    }

    return (
        <div className="grid grid-cols-3 gap-2 w-max">
            {/* Row 1: empty - Up - empty */}
            <div />
            <button
                className={btnBase}
                style={btnStyle('up')}
                onClick={() => !disabled && onDirection('up')}
                disabled={disabled}
            >
                {DIR_ARROWS.up}
            </button>
            <div />

            {/* Row 2: Left - Center - Right */}
            <button
                className={btnBase}
                style={btnStyle('left')}
                onClick={() => !disabled && onDirection('left')}
                disabled={disabled}
            >
                {DIR_ARROWS.left}
            </button>
            <button
                className={`${btnBase} text-sm`}
                style={btnStyle(centerLabel === 'STAY' ? 'stay' : 'skip')}
                onClick={() => !disabled && onCenter()}
                disabled={disabled}
            >
                {centerLabel}
            </button>
            <button
                className={btnBase}
                style={btnStyle('right')}
                onClick={() => !disabled && onDirection('right')}
                disabled={disabled}
            >
                {DIR_ARROWS.right}
            </button>

            {/* Row 3: empty - Down - empty */}
            <div />
            <button
                className={btnBase}
                style={btnStyle('down')}
                onClick={() => !disabled && onDirection('down')}
                disabled={disabled}
            >
                {DIR_ARROWS.down}
            </button>
            <div />
        </div>
    );
}
