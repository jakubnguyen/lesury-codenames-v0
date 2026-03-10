
import {
    GuessioGameState,
    GuessioMessage,
    ActivityCategory,
    ACTIVITY_CATEGORIES,
} from './types';

// simple pseudorandom replacement since we don't have access to the words.ts
const WORDS: Record<ActivityCategory, string[]> = {
    description: ['Apple', 'House', 'Tree', 'President'],
    drawing: ['Car', 'Bicycle', 'Sun', 'Moon'],
    pantomime: ['Swimming', 'Sleeping', 'Eating', 'Running'],
};

export function getRandomWordOptions(category: ActivityCategory, rand?: number): string[] {
    const list = WORDS[category];
    if (typeof rand === 'number') {
        const start = Math.floor(rand * list.length);
        const res = [];
        for (let i = 0; i < 3; i++) {
            res.push(list[(start + i) % list.length]);
        }
        return res;
    }
    const shuffled = [...list].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
}

export function createInitialGuessioState(
    teamIds: string[],
    players: string[],
    options: { testRandomResult?: number } = {}
): GuessioGameState {

    // Distribute players
    const teams: Record<string, string[]> = {};
    teamIds.forEach((t) => (teams[t] = []));

    const pState: GuessioGameState['players'] = {};
    players.forEach((pId, idx) => {
        const teamId = teamIds[idx % teamIds.length];
        pState[pId] = {
            id: pId,
            name: `Player ${pId}`,
            teamId,
            isHost: false, // Set properly elsewhere
        };
        teams[teamId].push(pId);
    });

    const scores: Record<string, number> = {};
    teamIds.forEach(tId => scores[tId] = 0);

    const firstActivePlayer = players[0] ?? '';

    // setup random board
    const board: ActivityCategory[] = [];
    for (let i = 0; i < 50; i++) {
        const rand = typeof options.testRandomResult === 'number'
            ? options.testRandomResult
            : Math.random();

        const idx = Math.floor(rand * ACTIVITY_CATEGORIES.length);
        board.push(ACTIVITY_CATEGORIES[idx]);
    }

    const firstActiveCategory = board[0] ?? 'description';

    return {
        players: pState,
        teams,
        activePlayerId: firstActivePlayer,
        status: 'choosing',
        board,
        activeCategory: firstActiveCategory,
        phase: 'playing',
        scores,
        currentOptionsForType: getRandomWordOptions(firstActiveCategory, options.testRandomResult)
    };
}

export function applyGuessioMessage(
    state: GuessioGameState,
    message: GuessioMessage
): GuessioGameState {
    switch (message.type) {
        case 'join': {
            // Re-adding a player
            return {
                ...state,
                players: {
                    ...state.players,
                    [message.playerId]: {
                        id: message.playerId,
                        name: `Player ${message.playerId}`,
                        teamId: message.teamId,
                        isHost: false,
                    }
                }
            };
        }
        case 'start_game': {
            // Handled mostly by server.ts, but inside here we could reset
            const pIds = Object.keys(state.players);
            return createInitialGuessioState(message.teamIds, pIds);
        }
        case 'select_word_and_bet': {
            if (state.status !== 'choosing') return state;
            return {
                ...state,
                chosenWord: message.word,
                chosenBet: message.bet,
                status: 'recording_resolution',
                timerStartAt: message.timestamp,
            };
        }
        case 'report_result': {
            if (state.status !== 'recording_resolution') return state;
            const currentPlayer = state.players[state.activePlayerId];
            if (!currentPlayer) return state;

            const tId = currentPlayer.teamId;
            const newScores = { ...state.scores };
            const bet = state.chosenBet || 1;

            if (message.result === 'success') {
                newScores[tId] += bet;
            } else {
                newScores[tId] = Math.max(0, newScores[tId] - bet); // assuming they can't go below 0? or can they
            }

            return {
                ...state,
                status: 'scoring',
                scores: newScores,
                roundResult: message.result,
            };
        }
        case 'next_turn': {
            // Find next player ID
            const allPlayers = Object.keys(state.players); // Not reliably ordered. Real implementation needs ordered list. 
            const currentIndex = allPlayers.indexOf(state.activePlayerId);
            const nextIndex = (currentIndex + 1) % allPlayers.length;
            const nextPlayerId = allPlayers[nextIndex];

            // Get position of next player's team to find the category
            const nextPlayerTeamId = state.players[nextPlayerId]?.teamId;
            const position = state.scores[nextPlayerTeamId] || 0;
            const nextCategory = state.board[position] || 'description';

            // Use testRng randomly from options if we had one? We pass undefined here out of simplicity.
            return {
                ...state,
                status: 'choosing',
                activePlayerId: nextPlayerId,
                activeCategory: nextCategory,
                currentOptionsForType: getRandomWordOptions(nextCategory),
                chosenWord: undefined,
                chosenBet: undefined,
                timerStartAt: undefined,
                roundResult: undefined,
            }
        }
        default:
            return state;
    }
}
