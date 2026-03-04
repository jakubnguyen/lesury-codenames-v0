'use client';

import { TimelineEvent, PlacedEvent } from '@lesury/game-logic';
import { CATEGORY_STYLES, formatYear, getCategoryIcon, getCategoryColor, getCategoryLabel } from '@lesury/game-logic';

interface EventCardProps {
    event: TimelineEvent | PlacedEvent;
    showYear?: boolean;
    isActive?: boolean;
    result?: 'correct' | 'incorrect' | null;
    size?: 'small' | 'normal';
}

export default function EventCard({
    event,
    showYear = true,
    isActive = false,
    result = null,
    size = 'normal',
}: EventCardProps) {
    // Size variants
    const sizeClasses = {
        small: 'w-32 h-44',
        normal: 'w-40 h-56',
    };

    const imageHeightClasses = {
        small: 'h-20',
        normal: 'h-28',
    };

    // Border color based on state
    let borderColor = 'border-[#E8E6DC]'; // lightGray
    if (result === 'correct') borderColor = 'border-[#788C5D]'; // sage
    if (result === 'incorrect') borderColor = 'border-[#CC785C]'; // antiqueBrass
    if (isActive) borderColor = 'border-[#D97757]'; // terracotta

    // Background color based on state
    let bgColor = 'bg-[#F0EFEA]'; // cararra
    if (result === 'correct') bgColor = 'bg-[#788C5D]/10';
    if (result === 'incorrect') bgColor = 'bg-[#CC785C]/10';

    const categoryColor = getCategoryColor(event.category);

    return (
        <div
            className={`
                ${sizeClasses[size]} ${bgColor} ${borderColor}
                rounded-2xl border-2 shadow-md transition-all duration-200
                flex flex-col overflow-hidden
            `}
        >
            {/* Event Image */}
            <div className={`${imageHeightClasses[size]} bg-[#E8E6DC]/50 relative flex items-center justify-center`}>
                {event.imageUrl && event.imageUrl !== 'placeholder' ? (
                    <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            // Fallback to category emoji if image fails
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                ) : (
                    <div className="text-5xl">{getCategoryIcon(event.category)}</div>
                )}
            </div>

            {/* Event Info */}
            <div className="p-2 flex flex-col justify-between flex-1">
                {/* Title */}
                <p className="text-xs font-semibold text-[#141413] line-clamp-3 mb-1">
                    {event.title}
                </p>

                {/* Category and Year */}
                <div className="flex items-center justify-between">
                    {/* Category Badge */}
                    <span
                        className="text-[10px] font-medium uppercase px-1.5 py-0.5 rounded"
                        style={{
                            backgroundColor: `${categoryColor}20`,
                            color: categoryColor,
                        }}
                    >
                        {getCategoryLabel(event.category)}
                    </span>

                    {/* Year */}
                    {showYear && (
                        <span className="text-sm font-bold text-[#141413] tabular-nums">
                            {formatYear(event)}
                        </span>
                    )}
                    {!showYear && (
                        <span className="text-sm font-bold text-[#B0AEA5]">???</span>
                    )}
                </div>
            </div>
        </div>
    );
}
