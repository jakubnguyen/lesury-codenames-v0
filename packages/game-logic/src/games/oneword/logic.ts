import {
    type OneWordCard,
    type OneWordGameState,
    type OneWordLanguage,
    type OneWordMessage,
    type OneWordPublicGameState,
    type OneWordTeam,
} from './types';

const BOARD_SIZE = 20;
const RED_COUNT = 7;
const BLUE_COUNT = 6;
const NEUTRAL_COUNT = 6;

const EN_WORDS = [
    'APPLE', 'RIVER', 'CASTLE', 'BREAD', 'CLOUD', 'POCKET', 'SHADOW', 'BOTTLE', 'TRAIN', 'GARDEN',
    'MARKET', 'WINTER', 'MIRROR', 'ANCHOR', 'FOREST', 'TUNNEL', 'LADDER', 'PENCIL', 'BEACON', 'ROCKET',
    'BRIDGE', 'SILVER', 'PILLOW', 'HAMMER', 'THUNDER', 'ISLAND', 'CANDLE', 'BUTTON', 'CAMERA', 'DESERT',
    'PLANET', 'SCHOOL', 'ENGINE', 'FLOWER', 'GUITAR', 'HARBOR', 'JUNGLE', 'KITCHEN', 'MOUNTAIN', 'NEEDLE',
    'ORANGE', 'PIRATE', 'QUEEN', 'RADIO', 'SAILOR', 'TEMPLE', 'UMBRELLA', 'VALLEY', 'WINDOW', 'YELLOW',
    'ZEBRA', 'BALLOON', 'CARPET', 'DRAGON', 'EAGLE', 'FARMER', 'GALAXY', 'HUNTER', 'INK', 'JACKET',
    'KETTLE', 'LIBRARY', 'MAGNET', 'NATION', 'OCEAN', 'PARROT', 'QUARTZ', 'RABBIT', 'SADDLE', 'TIGER',
    'UNIFORM', 'VIOLET', 'WHISPER', 'XENON', 'YOGURT', 'ZIPPER', 'ALMOND', 'BLADE', 'CIRCUS', 'DOLPHIN',
];

const CZ_WORDS = [
    'JABLKO', 'REKA', 'HRAD', 'CHLEB', 'MRAK', 'KAPSA', 'STIN', 'LAHEV', 'VLAK', 'ZAHRADA',
    'TRH', 'ZIMA', 'ZRCADLO', 'KOTVA', 'LES', 'TUNEL', 'ZEBRIK', 'TUZKA', 'MAJAK', 'RAKETA',
    'MOST', 'STRIBRO', 'POLSTAR', 'KLADIVO', 'HROM', 'OSTROV', 'SVICKA', 'KNOFLIK', 'FOTOAPARAT', 'POUST',
    'PLANETA', 'SKOLA', 'MOTOR', 'KVETINA', 'KYTARA', 'PRISTAV', 'DZUNGLE', 'KUCHYNE', 'HORA', 'JEHLA',
    'POMERANC', 'PIRAT', 'KRALOVNA', 'RADIO', 'NAMORNIK', 'CHRAM', 'DESTNIK', 'UDOLI', 'OKNO', 'ZLUTA',
    'ZEBRA', 'BALONEK', 'KOBEREC', 'DRAK', 'OREL', 'FARMAR', 'GALAXIE', 'LOVEC', 'INKOUST', 'BUNDA',
    'KONVICE', 'KNIHOVNA', 'MAGNET', 'NAROD', 'OCEAN', 'PAPOUSEK', 'KREMEN', 'KRALIK', 'SEDLO', 'TYGR',
    'UNIFORMA', 'FIALOVA', 'SEPOT', 'XYLOFON', 'JOGURT', 'ZIP', 'MANDLE', 'CEPEL', 'CIRKUS', 'DELFIN',
];

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function getWords(language: OneWordLanguage): string[] {
    return language === 'cz' ? CZ_WORDS : EN_WORDS;
}

function createBoard(language: OneWordLanguage): OneWordCard[] {
    const words = shuffle(getWords(language)).slice(0, BOARD_SIZE);
    const types = shuffle([
        ...Array(RED_COUNT).fill('red'),
        ...Array(BLUE_COUNT).fill('blue'),
        ...Array(NEUTRAL_COUNT).fill('neutral'),
        'assassin',
    ] as const);

    return words.map((word, index) => ({
        word,
        type: types[index],
        revealed: false,
    }));
}

function nextTeam(team: OneWordTeam): OneWordTeam {
    return team === 'red' ? 'blue' : 'red';
}

function briefingPhase(team: OneWordTeam): OneWordGameState['phase'] {
    return team === 'red' ? 'red_briefing' : 'blue_briefing';
}

function guessingPhase(team: OneWordTeam): OneWordGameState['phase'] {
    return team === 'red' ? 'red_guessing' : 'blue_guessing';
}

function revealAllCards(cards: OneWordCard[]): OneWordCard[] {
    return cards.map((card) => ({
        ...card,
        revealed: true,
    }));
}

function finishGame(
    state: OneWordGameState,
    winner: OneWordTeam,
    winReason: OneWordGameState['winReason'],
    lastAction: string
): OneWordGameState {
    return {
        ...state,
        cards: revealAllCards(state.cards),
        winner,
        winReason,
        phase: 'game_over',
        lastAction,
    };
}

function advanceTurn(state: OneWordGameState, team: OneWordTeam, lastAction?: string): OneWordGameState {
    const next = nextTeam(team);
    return {
        ...state,
        currentTeam: next,
        phase: briefingPhase(next),
        submittedNumber: null,
        guessesRemaining: 0,
        lastAction: lastAction ?? `${next === 'red' ? 'Red' : 'Blue'} team briefing`,
    };
}

export function createInitialOneWordState(language: OneWordLanguage = 'en'): OneWordGameState {
    return {
        phase: 'lobby',
        cards: createBoard(language),
        redRemaining: RED_COUNT,
        blueRemaining: BLUE_COUNT,
        connectedDevices: [],
        currentTeam: null,
        submittedNumber: null,
        guessesRemaining: 0,
        winner: null,
        winReason: null,
        lastAction: null,
        language,
    };
}

export function toPublicOneWordState(state: OneWordGameState): OneWordPublicGameState {
    return {
        ...state,
        cards: state.cards.map((card) => ({
            word: card.word,
            type: card.revealed ? card.type : null,
            revealed: card.revealed,
        })),
    };
}

export function applyOneWordMessage(state: OneWordGameState, msg: OneWordMessage): OneWordGameState {
    switch (msg.type) {
        case 'start_game': {
            const next = createInitialOneWordState(msg.language);
            return {
                ...next,
                phase: 'red_briefing',
                currentTeam: 'red',
                connectedDevices: state.connectedDevices,
                lastAction: 'Red team briefing',
            };
        }
        case 'submit_number': {
            if (!state.currentTeam) return state;
            if (state.phase !== briefingPhase(state.currentTeam)) return state;
            const max = state.cards.length;
            const number = Math.max(1, Math.min(Number(msg.number) || 1, max));
            return {
                ...state,
                submittedNumber: number,
                guessesRemaining: number,
                phase: guessingPhase(state.currentTeam),
                lastAction: `${state.currentTeam === 'red' ? 'Red' : 'Blue'} team guessing (${number})`,
            };
        }
        case 'guess_word': {
            if (!state.currentTeam) return state;
            if (state.phase !== guessingPhase(state.currentTeam)) return state;
            const card = state.cards[msg.cardIndex];
            if (!card || card.revealed) return state;

            const cards = state.cards.map((item, index) => index === msg.cardIndex ? { ...item, revealed: true } : item);
            const picked = cards[msg.cardIndex];
            let nextState: OneWordGameState = { ...state, cards };

            if (picked.type === 'assassin') {
                return finishGame(
                    nextState,
                    nextTeam(state.currentTeam),
                    'assassin',
                    `${state.currentTeam === 'red' ? 'Red' : 'Blue'} hit the assassin`
                );
            }

            if (picked.type === 'red') nextState.redRemaining -= 1;
            if (picked.type === 'blue') nextState.blueRemaining -= 1;

            if (nextState.redRemaining === 0) {
                return finishGame(nextState, 'red', 'agents_found', 'Red team found all agents');
            }
            if (nextState.blueRemaining === 0) {
                return finishGame(nextState, 'blue', 'agents_found', 'Blue team found all agents');
            }

            if (picked.type === state.currentTeam) {
                nextState.guessesRemaining = Math.max(0, state.guessesRemaining - 1);
                nextState.lastAction = `${state.currentTeam === 'red' ? 'Red' : 'Blue'} guessed correctly`;
                return nextState.guessesRemaining === 0 ? advanceTurn(nextState, state.currentTeam) : nextState;
            }

            if (picked.type === 'neutral') {
                return advanceTurn(nextState, state.currentTeam, `${state.currentTeam === 'red' ? 'Red' : 'Blue'} hit a neutral card`);
            }

            return advanceTurn(nextState, state.currentTeam, `${state.currentTeam === 'red' ? 'Red' : 'Blue'} revealed the other team's card`);
        }
        case 'skip_turn': {
            if (!state.currentTeam) return state;
            if (state.phase !== guessingPhase(state.currentTeam)) return state;
            return advanceTurn(state, state.currentTeam, `${state.currentTeam === 'red' ? 'Red' : 'Blue'} skipped`);
        }
        case 'play_again': {
            const next = createInitialOneWordState(state.language);
            return {
                ...next,
                phase: 'red_briefing',
                currentTeam: 'red',
                connectedDevices: state.connectedDevices,
                lastAction: 'Red team briefing',
            };
        }
        default:
            return state;
    }
}
