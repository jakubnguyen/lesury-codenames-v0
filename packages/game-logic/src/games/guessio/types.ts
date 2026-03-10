import { BasePlayer, BaseGameState } from '../../types';

export const ACTIVITY_CATEGORIES = ['description', 'drawing', 'pantomime'] as const;
export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number];

export interface GuessioPlayer extends BasePlayer {
    teamId: string;
}

export type GuessioStatus = 'setup' | 'choosing' | 'recording_resolution' | 'scoring' | 'ended';

export interface GuessioGameState extends BaseGameState {
    players: Record<string, GuessioPlayer>;
    teams: Record<string, string[]>; // teamId -> playerIds
    activePlayerId: string; // The one providing the clue
    status: GuessioStatus;
    board: ActivityCategory[]; // Optional, could just use random generator
    activeCategory?: ActivityCategory; // Type of activity determined by board space
    currentOptionsForType?: string[]; // 3 words for activeCategory
    chosenWord?: string; // Word chosen by active player
    chosenBet?: number; // 1-5 bet placed
    timerStartAt?: number; // Start time for the 60 seconds
    roundResult?: 'success' | 'failure';
    scores: Record<string, number>; // TeamId -> Score
}

export type GuessioMessage =
    | { type: 'join'; playerId: string; teamId: string }
    | { type: 'start_game'; teamIds: string[] }
    | { type: 'select_word_and_bet'; word: string; bet: number; timestamp: number }
    | { type: 'report_result'; result: 'success' | 'failure' }
    | { type: 'next_turn' };
