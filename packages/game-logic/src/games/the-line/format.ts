/**
 * Display formatting utilities for The Line game values.
 */

/**
 * Format a display_value string for human readability.
 * Converts scientific notation (e.g. "1.00E+00") to clean numbers.
 * Leaves already-readable values unchanged.
 */
export function formatDisplayValue(value: string): string {
    const sciMatch = value.match(/^([0-9.]+)[Ee]([+-]?\d+)$/);
    if (!sciMatch) return value;

    const coefficient = parseFloat(sciMatch[1]);
    const exponent = parseInt(sciMatch[2], 10);
    const num = coefficient * Math.pow(10, exponent);

    // Format to a clean, readable number
    if (Number.isInteger(num)) return num.toLocaleString('en-US');
    return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
}
