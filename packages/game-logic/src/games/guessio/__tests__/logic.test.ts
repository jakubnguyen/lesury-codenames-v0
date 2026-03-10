import { describe, it, beforeAll } from 'vitest';
import * as approvals from 'approvals';
import path from 'path';

// Create __dirname equivalent for approval path logic
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { createInitialGuessioState, applyGuessioMessage } from '../logic';

const APPROVED_DIR = path.join(__dirname);

beforeAll(() => {
    approvals.configure({ reporters: ['nodediff'] } as any);
});

function approve(testName: string, content: unknown) {
    approvals.verifyAsJSON(APPROVED_DIR, testName, content, {});
}

describe('Guessio Logic Transitions', () => {
    it('creates initial state', () => {
        const teamIds = ['teamA', 'teamB'];
        const state = createInitialGuessioState(teamIds, ['pA1', 'pB1', 'pA2', 'pB2'], { testRandomResult: 0.1 });
        approve('guessio_initial', state);
    });

    it('selects word and bet', () => {
        const state = createInitialGuessioState(['t1', 't2'], ['p1', 'p2'], { testRandomResult: 0.1 });
        const updated = applyGuessioMessage(state, {
            type: 'select_word_and_bet',
            word: 'Apple',
            bet: 3,
            timestamp: 1000
        });
        approve('guessio_select_word', updated);
    });

    it('reports failure', () => {
         const state = createInitialGuessioState(['t1', 't2'], ['p1', 'p2'], { testRandomResult: 0.1 });
         const selected = applyGuessioMessage(state, {
             type: 'select_word_and_bet',
             word: 'Apple',
             bet: 4,
             timestamp: 1000
         });
         const reported = applyGuessioMessage(selected, {
             type: 'report_result',
             result: 'failure'
         });
         approve('guessio_report_failure', reported);
    });

    it('reports success', () => {
         const state = createInitialGuessioState(['t1', 't2'], ['p1', 'p2'], { testRandomResult: 0.1 });
         const selected = applyGuessioMessage(state, {
             type: 'select_word_and_bet',
             word: 'Apple',
             bet: 4,
             timestamp: 1000
         });
         const reported = applyGuessioMessage(selected, {
             type: 'report_result',
             result: 'success'
         });
         approve('guessio_report_success', reported);
    });
});
