/**
 * Timeline Game Utilities - MVP Version
 */

import type { TimelineEvent, PlacedEvent, EventCategory } from './types';

/**
 * Category visual styling (icons and colors)
 */
export const CATEGORY_STYLES = {
    Science: { icon: '🔬', color: '#6A9BCC' },  // mutedBlue
    Tragedy: { icon: '💔', color: '#CC785C' },  // antiqueBrass
    War: { icon: '⚔️', color: '#CC785C' },     // antiqueBrass
    Economy: { icon: '📈', color: '#788C5D' },  // sage
    Tech: { icon: '💻', color: '#6A9BCC' },     // mutedBlue
    Space: { icon: '🚀', color: '#D97757' },    // terracotta
    Politics: { icon: '🏛️', color: '#788C5D' }, // sage
} as const;

/**
 * Format year for display
 */
export function formatYear(event: TimelineEvent, hideYear: boolean = false): string {
    if (hideYear) return '???';
    return event.year.toString();
}

/**
 * Get category icon/emoji
 */
export function getCategoryIcon(category: EventCategory): string {
    return CATEGORY_STYLES[category]?.icon || '❓';
}

/**
 * Get category color
 */
export function getCategoryColor(category: EventCategory): string {
    return CATEGORY_STYLES[category]?.color || '#B0AEA5';
}

/**
 * Get category label (uppercase)
 */
export function getCategoryLabel(category: EventCategory): string {
    return category.toUpperCase();
}

/**
 * Sort placed events by year
 */
export function sortEvents(events: PlacedEvent[]): PlacedEvent[] {
    return [...events].sort((a, b) => a.year - b.year);
}

// Legacy function for backward compatibility
export function formatEventValue(event: TimelineEvent, hideValue: boolean = false): string {
    return formatYear(event, hideValue);
}
