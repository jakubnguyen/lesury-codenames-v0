export type OneWordLanguage = 'en' | 'cz';
export type OneWordCardType = 'red' | 'blue' | 'neutral' | 'assassin';
export type OneWordTeam = 'red' | 'blue';
export type OneWordPhase =
    | 'lobby'
    | 'red_briefing'
    | 'red_guessing'
    | 'blue_briefing'
    | 'blue_guessing'
    | 'game_over';

export interface OneWordCard {
    word: string;
    type: OneWordCardType;
    revealed: boolean;
}

export interface OneWordPublicCard {
    word: string;
    type: OneWordCardType | null;
    revealed: boolean;
}

export interface OneWordGameState {
    phase: OneWordPhase;
    cards: OneWordCard[];
    redRemaining: number;
    blueRemaining: number;
    connectedDevices: string[];
    currentTeam: OneWordTeam | null;
    submittedNumber: number | null;
    guessesRemaining: number;
    winner: OneWordTeam | null;
    winReason: 'agents_found' | 'assassin' | null;
    lastAction: string | null;
    language: OneWordLanguage;
}

export interface OneWordPublicGameState extends Omit<OneWordGameState, 'cards'> {
    cards: OneWordPublicCard[];
}

export type OneWordMessage =
    | { type: 'start_game'; language: OneWordLanguage }
    | { type: 'submit_number'; number: number }
    | { type: 'guess_word'; cardIndex: number }
    | { type: 'skip_turn' }
    | { type: 'play_again' };
