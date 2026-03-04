// Room utility functions

/**
 * Generate a random 6-character room code
 */
export function generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar chars (I,O,0,1)
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

/**
 * Validate a room code format
 */
export function validateRoomCode(code: string): boolean {
    return /^[A-Z0-9]{4,6}$/i.test(code);
}

/**
 * Format a room code for display (e.g., ABC123)
 */
export function formatRoomCode(code: string): string {
    return code.toUpperCase();
}

/**
 * Generate a room URL for QR code
 */
export function generateRoomUrl(gameType: string, roomCode: string, baseUrl: string): string {
    return `${baseUrl}/join?room=${roomCode}`;
}
