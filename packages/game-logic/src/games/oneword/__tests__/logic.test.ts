import { beforeAll, describe, it } from 'vitest';
import * as approvals from 'approvals';
import path from 'path';
import { applyOneWordMessage, toPublicOneWordState } from '../logic';
import type { OneWordGameState } from '../types';

const APPROVED_DIR = path.join(__dirname);

beforeAll(() => {
    approvals.configure({ reporters: ['nodediff'] } as any);
});

function approve(testName: string, content: unknown) {
    approvals.verifyAsJSON(APPROVED_DIR, testName, content, {});
}

function makeState(overrides: Partial<OneWordGameState> = {}): OneWordGameState {
    return {
        phase: 'red_briefing',
        cards: [
            { word: 'APPLE', type: 'red', revealed: false },
            { word: 'RIVER', type: 'red', revealed: false },
            { word: 'CASTLE', type: 'blue', revealed: false },
            { word: 'BREAD', type: 'neutral', revealed: false },
            { word: 'CLOUD', type: 'assassin', revealed: false },
            ...Array.from({ length: 15 }, (_, index) => ({
                word: `WORD_${index}`,
                type: index < 5 ? 'neutral' : index < 10 ? 'blue' : 'red',
                revealed: false,
            })),
        ],
        redRemaining: 7,
        blueRemaining: 6,
        connectedDevices: ['host', 'spymaster', 'player'],
        currentTeam: 'red',
        submittedNumber: null,
        guessesRemaining: 0,
        winner: null,
        winReason: null,
        lastAction: 'Red team briefing',
        language: 'en',
        ...overrides,
    };
}

describe('applyOneWordMessage', () => {
    it('caps submitted number at board size', () => {
        const next = applyOneWordMessage(makeState(), { type: 'submit_number', number: 99 });
        approve('submit_number_caps_to_board', {
            phase: next.phase,
            submittedNumber: next.submittedNumber,
            guessesRemaining: next.guessesRemaining,
            lastAction: next.lastAction,
        });
    });

    it('advances turn after neutral guess', () => {
        const next = applyOneWordMessage(
            makeState({
                phase: 'red_guessing',
                submittedNumber: 3,
                guessesRemaining: 3,
            }),
            { type: 'guess_word', cardIndex: 3 }
        );
        approve('neutral_guess_ends_turn', {
            phase: next.phase,
            currentTeam: next.currentTeam,
            guessesRemaining: next.guessesRemaining,
            submittedNumber: next.submittedNumber,
            revealed: next.cards[3].revealed,
            lastAction: next.lastAction,
        });
    });

    it('hides unrevealed card types from public state', () => {
        const next = toPublicOneWordState(
            makeState({
                cards: [
                    { word: 'APPLE', type: 'red', revealed: false },
                    { word: 'RIVER', type: 'blue', revealed: true },
                    { word: 'CASTLE', type: 'neutral', revealed: false },
                    { word: 'BREAD', type: 'assassin', revealed: true },
                    ...Array.from({ length: 16 }, (_, index) => ({
                        word: `WORD_${index}`,
                        type: 'neutral' as const,
                        revealed: false,
                    })),
                ],
            })
        );
        approve('public_state_hides_secret_types', next.cards.slice(0, 4));
    });

    it('reveals the whole board when the assassin is guessed', () => {
        const next = applyOneWordMessage(
            makeState({
                phase: 'red_guessing',
                submittedNumber: 1,
                guessesRemaining: 1,
            }),
            { type: 'guess_word', cardIndex: 4 }
        );
        approve('assassin_guess_reveals_board', {
            phase: next.phase,
            winner: next.winner,
            winReason: next.winReason,
            hiddenCards: next.cards.filter((card) => !card.revealed).length,
            assassinRevealed: next.cards[4].revealed,
        });
    });
});
