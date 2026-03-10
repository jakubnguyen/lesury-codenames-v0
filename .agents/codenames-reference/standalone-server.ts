import type * as Party from 'partykit/server';

type CardType = 'red' | 'blue' | 'neutral' | 'assassin';
type TeamColor = 'red' | 'blue';
type GamePhase =
    | 'lobby'
    | 'red_briefing'
    | 'red_guessing'
    | 'blue_briefing'
    | 'blue_guessing'
    | 'game_over';

type DeviceType = 'host' | 'spymaster' | 'player';

interface Card {
    word: string;
    type: CardType;
    revealed: boolean;
}

interface CardPublic {
    word: string;
    type: CardType | null;
    revealed: boolean;
}

interface GameState {
    phase: GamePhase;
    cards: Card[];
    redRemaining: number;
    blueRemaining: number;
    connectedDevices: string[];
    currentTeam: TeamColor | null;
    submittedNumber: number | null;
    guessesRemaining: number;
    winner: TeamColor | null;
    winReason: 'agents_found' | 'assassin' | null;
    lastAction: string | null;
}

const FULL_STATE_DEVICES = new Set<DeviceType>(['host', 'spymaster']);
const CAN_START_DEVICES = new Set<DeviceType>(['host']);
const CAN_NUMBER_DEVICES = new Set<DeviceType>(['spymaster']);
const CAN_GUESS_DEVICES = new Set<DeviceType>(['player']);
const MAX_SUBMITTED_NUMBER = 4;

const WORDS: string[] = [
    'AFRICA', 'AGENT', 'AIR', 'ALIEN', 'ALPS', 'AMAZON', 'AMBULANCE', 'AMERICA',
    'ANGEL', 'ANTARCTICA', 'APPLE', 'ARM', 'BACK', 'BALL', 'BAND', 'BANK',
    'BARK', 'BAT', 'BATTERY', 'BEACH', 'BEAR', 'BEAT', 'BED', 'BERRY',
    'BILL', 'BLOCK', 'BOARD', 'BOLT', 'BOMB', 'BOX', 'BRIDGE', 'BRUSH',
    'BUCK', 'BUG', 'BUGLE', 'BUTTON', 'CAMEL', 'CAPITAL', 'CARD', 'CARROT',
    'CAST', 'CAT', 'CELL', 'CENTAUR', 'CHAIR', 'CHANGE', 'CHARGE', 'CHECK',
    'CHEST', 'CHICK', 'CHINA', 'CHIP', 'CHOCOLATE', 'CHURCH', 'CIRCLE', 'CLIFF',
    'CLOAK', 'CLUB', 'CODE', 'COLD', 'COMIC', 'COMPOUND', 'CONCERT', 'CONDUCTOR',
    'CONTRACT', 'COOK', 'COPPER', 'COTTON', 'COUCH', 'COVER', 'CRANE', 'CRASH',
    'CRICKET', 'CROSS', 'CROWN', 'CYCLE', 'CZECH', 'DANCE', 'DATE', 'DAY',
    'DEATH', 'DECK', 'DEGREE', 'DIAMOND', 'DICE', 'DINOSAUR', 'DISEASE', 'DOCTOR',
    'DOG', 'DRAFT', 'DRAGON', 'DRESS', 'DRILL', 'DROP', 'DUCK', 'DWARF',
    'EAGLE', 'EGYPT', 'EMBASSY', 'ENGINE', 'ENGLAND', 'EUROPE', 'EYE', 'FACE',
    'FAIR', 'FALL', 'FAN', 'FENCE', 'FIELD', 'FIGURE', 'FILE', 'FILM',
    'FIRE', 'FISH', 'FLUTE', 'FLY', 'FOOT', 'FORCE', 'FOREST', 'FORK',
    'FRANCE', 'GAME', 'GAS', 'GERMANY', 'GHOST', 'GIANT', 'GLASS', 'GLOVE',
    'GOLD', 'GRACE', 'GRASS', 'GREECE', 'GREEN', 'GROUND', 'GUITAR', 'GUN',
    'HAMMER', 'HEAD', 'HEART', 'HELICOPTER', 'HIMALAYAS', 'HOLE', 'HOOK', 'HORN',
    'HORSE', 'HOSPITAL', 'HOTEL', 'HOUND', 'ICE', 'ICE CREAM', 'INDIA', 'IRON',
    'IVORY', 'JACK', 'JAM', 'JET', 'JUPITER', 'KANGAROO', 'KEY', 'KID',
    'KING', 'KIWI', 'KNIFE', 'KNIGHT', 'LAB', 'LAP', 'LASER', 'LEMON',
    'LEPRECHAUN', 'LIGHT', 'LIMOUSINE', 'LINE', 'LION', 'LITTER', 'LOCH NESS', 'LOG',
    'LONDON', 'LUCK', 'MAIL', 'MAMMOTH', 'MAPLE', 'MARBLE', 'MARCH', 'MATCH',
    'MERCURY', 'MEXICO', 'MICROSCOPE', 'MINE', 'MINT', 'MISSILE', 'MOLE', 'MOON',
    'MOUNT', 'MOUSE', 'MUG', 'NAIL', 'NEEDLE', 'NET', 'NIGHT', 'NOTE',
    'NOVEL', 'NURSE', 'NUT', 'OBJECT', 'OPERA', 'ORANGE', 'ORGAN', 'PALM',
    'PAN', 'PAPER', 'PARACHUTE', 'PARK', 'PART', 'PASS', 'PASTE', 'PENGUIN',
    'PHOENIX', 'PIANO', 'PILOT', 'PIN', 'PIPE', 'PIRATE', 'PISTOL', 'PIT',
    'PITCH', 'PLANE', 'PLASTIC', 'PLATE', 'PLATYPUS', 'PLAY', 'PLOT', 'POINT',
    'POISON', 'POLE', 'POLICE', 'POOL', 'PORT', 'POST', 'PRESS', 'PRINCESS',
    'PUMPKIN', 'PUPIL', 'QUEEN', 'RABBIT', 'RACK', 'RAY', 'ROBIN', 'ROBOT',
    'ROCK', 'ROME', 'ROOT', 'ROSE', 'ROUND', 'ROW', 'RULER', 'SATELLITE',
    'SATURN', 'SCALE', 'SCHOOL', 'SCIENTIST', 'SCREEN', 'SCUBA DIVER', 'SEAL', 'SERVER',
    'SHADOW', 'SHAKESPEARE', 'SHARK', 'SHOT', 'SINK', 'SKYSCRAPER', 'SLIP', 'SLUG',
    'SMUGGLER', 'SNOW', 'SNOWMAN', 'SOCK', 'SOUL', 'SPACE', 'SPELL', 'SPIDER',
    'SPIKE', 'SPINE', 'SPOT', 'SPRING', 'SPY', 'SQUARE', 'STAFF', 'STAR',
    'STATE', 'STATION', 'STICK', 'STOCKING', 'STREAM', 'STRIKE', 'STRING', 'SUB',
    'SUIT', 'SUPERHERO', 'SWITCH', 'TABLE', 'TABLET', 'TAG', 'TAIL', 'TAP',
    'TAR', 'TEACHER', 'TELESCOPE', 'THIEF', 'THUMB', 'TICK', 'TIE', 'TIME',
    'TIP', 'TOKYO', 'TOOTH', 'TORCH', 'TOWER', 'TRACK', 'TRAIN', 'TRIANGLE',
    'TRIP', 'TRUCK', 'TUBE', 'TURKEY', 'UNICORN', 'VACUUM', 'VAN', 'VICTORIA',
    'VIKING', 'VOLCANO', 'WAKE', 'WALL', 'WATCH', 'WAVE', 'WEB', 'WELL',
    'WHALE', 'WHIP', 'WIND', 'WITCH', 'WORM', 'YARD',
];

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function createNewGame(): GameState {
    const words = shuffle(WORDS).slice(0, 25);
    const types: CardType[] = [
        ...Array(9).fill('red'),
        ...Array(8).fill('blue'),
        ...Array(7).fill('neutral'),
        'assassin',
    ];
    const shuffledTypes = shuffle(types);
    const cards: Card[] = words.map((word, i) => ({ word, type: shuffledTypes[i], revealed: false }));

    return {
        phase: 'lobby',
        cards,
        redRemaining: 9,
        blueRemaining: 8,
        connectedDevices: [],
        currentTeam: null,
        submittedNumber: null,
        guessesRemaining: 0,
        winner: null,
        winReason: null,
        lastAction: null,
    };
}

function toPublic(state: GameState): Omit<GameState, 'cards'> & { cards: CardPublic[] } {
    return {
        ...state,
        cards: state.cards.map((card) => ({
            word: card.word,
            type: card.revealed ? card.type : null,
            revealed: card.revealed,
        })),
    };
}

function getBriefingPhase(team: TeamColor): GamePhase {
    return team === 'red' ? 'red_briefing' : 'blue_briefing';
}

function getGuessingPhase(team: TeamColor): GamePhase {
    return team === 'red' ? 'red_guessing' : 'blue_guessing';
}

function nextTeam(team: TeamColor): TeamColor {
    return team === 'red' ? 'blue' : 'red';
}

function getActiveTeam(phase: GamePhase): TeamColor | null {
    if (phase.startsWith('red')) return 'red';
    if (phase.startsWith('blue')) return 'blue';
    return null;
}

function isFullStateDevice(deviceType: string): deviceType is DeviceType {
    return FULL_STATE_DEVICES.has(deviceType as DeviceType);
}

export default class CodenamesServer implements Party.Server {
    private game: GameState;

    constructor(readonly room: Party.Room) {
        this.game = createNewGame();
    }

    async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
        const url = new URL(ctx.request.url);
        const deviceType = (url.searchParams.get('deviceType') || 'unknown') as string;
        const playerName = url.searchParams.get('playerName') || 'Player';

        conn.setState({ deviceType, playerName });

        if (!this.game.connectedDevices.includes(deviceType)) {
            this.game.connectedDevices = [...this.game.connectedDevices, deviceType];
        }

        this.sendToConn(conn, deviceType);
        this.broadcastAll();
    }

    async onClose(conn: Party.Connection) {
        const { deviceType } = (conn.state as any) ?? {};
        if (!deviceType) return;

        const stillConnected = [...this.room.getConnections()].some(
            (c) => c.id !== conn.id && (c.state as any)?.deviceType === deviceType
        );

        if (!stillConnected) {
            this.game.connectedDevices = this.game.connectedDevices.filter((d) => d !== deviceType);
            this.broadcastAll();
        }
    }

    async onMessage(message: string, sender: Party.Connection) {
        let msg: any;
        try {
            msg = JSON.parse(message);
        } catch {
            return;
        }

        const deviceType = ((sender.state as any)?.deviceType || 'unknown') as string;

        switch (msg.type) {
            case 'startGame': {
                if (!CAN_START_DEVICES.has(deviceType as DeviceType)) return;
                if (this.game.phase !== 'lobby') return;

                this.game = createNewGame();
                this.game.phase = 'red_briefing';
                this.game.currentTeam = 'red';
                this.game.lastAction = 'Red team briefing';

                for (const conn of this.room.getConnections()) {
                    const dt = (conn.state as any)?.deviceType;
                    if (dt && !this.game.connectedDevices.includes(dt)) {
                        this.game.connectedDevices.push(dt);
                    }
                }

                this.broadcastAll();
                break;
            }

            case 'submit_number': {
                if (!CAN_NUMBER_DEVICES.has(deviceType as DeviceType)) return;
                const activeTeam = getActiveTeam(this.game.phase);
                if (!activeTeam) return;
                if (this.game.phase !== getBriefingPhase(activeTeam)) return;

                const number = Number(msg.number);
                if (!Number.isInteger(number) || number < 1 || number > MAX_SUBMITTED_NUMBER) return;

                this.game.submittedNumber = number;
                this.game.guessesRemaining = number;
                this.game.phase = getGuessingPhase(activeTeam);
                this.game.lastAction = `${activeTeam === 'red' ? 'Red' : 'Blue'} team guessing (${number} guesses)`;
                this.broadcastAll();
                break;
            }

            case 'guess_word': {
                if (!CAN_GUESS_DEVICES.has(deviceType as DeviceType)) return;
                const activeTeam = getActiveTeam(this.game.phase);
                if (!activeTeam) return;
                if (this.game.phase !== getGuessingPhase(activeTeam)) return;

                const cardIndex = Number(msg.cardIndex);
                if (!Number.isInteger(cardIndex)) return;
                const card = this.game.cards[cardIndex];
                if (!card || card.revealed) return;

                card.revealed = true;

                if (card.type === 'assassin') {
                    this.game.winner = nextTeam(activeTeam);
                    this.game.winReason = 'assassin';
                    this.game.phase = 'game_over';
                    this.game.lastAction = `${activeTeam === 'red' ? 'Red' : 'Blue'} hit the assassin`;
                    this.broadcastAll();
                    return;
                }

                if (card.type === 'red') this.game.redRemaining = Math.max(0, this.game.redRemaining - 1);
                if (card.type === 'blue') this.game.blueRemaining = Math.max(0, this.game.blueRemaining - 1);

                if (this.game.redRemaining === 0) {
                    this.game.winner = 'red';
                    this.game.winReason = 'agents_found';
                    this.game.phase = 'game_over';
                    this.game.lastAction = 'Red team found all agents';
                    this.broadcastAll();
                    return;
                }

                if (this.game.blueRemaining === 0) {
                    this.game.winner = 'blue';
                    this.game.winReason = 'agents_found';
                    this.game.phase = 'game_over';
                    this.game.lastAction = 'Blue team found all agents';
                    this.broadcastAll();
                    return;
                }

                if (card.type === activeTeam) {
                    this.game.guessesRemaining = Math.max(0, this.game.guessesRemaining - 1);
                    this.game.lastAction = `${activeTeam === 'red' ? 'Red' : 'Blue'} guessed correctly`;
                    if (this.game.guessesRemaining === 0) {
                        this.advanceTurn(activeTeam);
                    }
                    this.broadcastAll();
                    return;
                }

                if (card.type === 'neutral') {
                    this.game.lastAction = `${activeTeam === 'red' ? 'Red' : 'Blue'} hit a neutral card`;
                } else {
                    this.game.lastAction = `${activeTeam === 'red' ? 'Red' : 'Blue'} revealed the other team's card`;
                }
                this.advanceTurn(activeTeam);
                this.broadcastAll();
                break;
            }

            case 'skip_turn': {
                if (!CAN_GUESS_DEVICES.has(deviceType as DeviceType)) return;
                const activeTeam = getActiveTeam(this.game.phase);
                if (!activeTeam) return;
                if (this.game.phase !== getGuessingPhase(activeTeam)) return;

                this.game.lastAction = `${activeTeam === 'red' ? 'Red' : 'Blue'} skipped`;
                this.advanceTurn(activeTeam);
                this.broadcastAll();
                break;
            }

            case 'play_again': {
                if (!CAN_START_DEVICES.has(deviceType as DeviceType)) return;
                this.game = createNewGame();
                this.game.phase = 'red_briefing';
                this.game.currentTeam = 'red';
                this.game.lastAction = 'Red team briefing';
                this.game.connectedDevices = [...new Set(this.game.connectedDevices.concat(this.connectedDeviceList()))];
                this.broadcastAll();
                break;
            }
        }
    }

    private connectedDeviceList(): string[] {
        return [...this.room.getConnections()]
            .map((conn) => (conn.state as any)?.deviceType)
            .filter(Boolean);
    }

    private advanceTurn(activeTeam: TeamColor) {
        const next = nextTeam(activeTeam);
        this.game.currentTeam = next;
        this.game.submittedNumber = null;
        this.game.guessesRemaining = 0;
        this.game.phase = getBriefingPhase(next);
    }

    private sendToConn(conn: Party.Connection, deviceType: string) {
        const payload = isFullStateDevice(deviceType)
            ? { type: 'state', game: this.game }
            : { type: 'state', game: toPublic(this.game) };
        conn.send(JSON.stringify(payload));
    }

    private broadcastAll() {
        for (const conn of this.room.getConnections()) {
            const { deviceType } = (conn.state as any) ?? {};
            if (!deviceType) continue;
            this.sendToConn(conn, deviceType);
        }
    }
}
