import type * as Party from "partykit/server";

// ─── Types ────────────────────────────────────────────────────────────────────

type CardType = 'red' | 'blue' | 'neutral' | 'assassin';
type TeamColor = 'red' | 'blue';
type GamePhase = 'lobby' | 'red_clue' | 'red_guess' | 'blue_clue' | 'blue_guess' | 'game_over';
type GameMode = '4device' | '2device';

interface Card {
    word: string;
    type: CardType;
    revealed: boolean;
}

interface CardPublic {
    word: string;
    type: CardType | null; // null until revealed
    revealed: boolean;
}

interface Clue {
    word: string;
    number: number;
}

interface GameState {
    phase: GamePhase;
    cards: Card[];
    clue: Clue | null;
    redRemaining: number;
    blueRemaining: number;
    connectedDevices: string[];
    winner: TeamColor | null;
    winReason: 'agents_found' | 'assassin' | null;
    gameMode: GameMode;
}

// Device types that receive full state (all card colors visible)
const FULL_STATE_DEVICES = new Set([
    'red_spymaster',
    'blue_spymaster',
    'dual_spymaster',
    'host',
]);

// Device types that can submit a clue
const CAN_CLUE_DEVICES = new Set([
    'red_spymaster',
    'blue_spymaster',
]);

// Device types that can guess/endTurn
const CAN_GUESS_DEVICES = new Set([
    'red_operative',
    'blue_operative',
    'dual_player',
]);

// Device types that can start the game
const CAN_START_DEVICES = new Set(['host']);

// ─── Word list ────────────────────────────────────────────────────────────────
// 400-word pool — standard Codenames English set (subset shown; expand as needed)
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function createNewGame(): GameState {
    const words = shuffle(WORDS).slice(0, 25);

    // Red starts → 9 red, 8 blue, 7 neutral, 1 assassin
    const types: CardType[] = [
        ...Array(9).fill('red'),
        ...Array(8).fill('blue'),
        ...Array(7).fill('neutral'),
        'assassin',
    ];
    const shuffledTypes = shuffle(types);

    const cards: Card[] = words.map((word, i) => ({
        word,
        type: shuffledTypes[i],
        revealed: false,
    }));

    return {
        phase: 'lobby',
        cards,
        clue: null,
        redRemaining: 9,
        blueRemaining: 8,
        connectedDevices: [],
        winner: null,
        winReason: null,
        gameMode: '4device',
    };
}

function toPublic(state: GameState): Omit<GameState, 'cards'> & { cards: CardPublic[] } {
    return {
        ...state,
        cards: state.cards.map(c => ({
            word: c.word,
            type: c.revealed ? c.type : null,
            revealed: c.revealed,
        })),
    };
}

function isFullStateDevice(deviceType: string): boolean {
    return FULL_STATE_DEVICES.has(deviceType);
}

// ─── Server ───────────────────────────────────────────────────────────────────

export default class CodenamesServer implements Party.Server {
    private game: GameState;

    constructor(readonly room: Party.Room) {
        this.game = createNewGame();
    }

    // ── Connection ───────────────────────────────────────────────────────
    async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
        const url = new URL(ctx.request.url);
        const deviceType = url.searchParams.get('deviceType') || 'unknown';
        const playerName = url.searchParams.get('playerName') || 'Player';

        // Store on connection so we can auth later
        conn.setState({ deviceType, playerName });

        // Add to connectedDevices list if not already present
        if (!this.game.connectedDevices.includes(deviceType)) {
            this.game.connectedDevices = [...this.game.connectedDevices, deviceType];
        }

        // Send state to the new connection
        this.sendToConn(conn, deviceType);

        // Broadcast updated connectedDevices to all (lobby needs to update checkmarks)
        this.broadcastAll();
    }

    // ── Disconnect ───────────────────────────────────────────────────────
    async onClose(conn: Party.Connection) {
        const { deviceType } = (conn.state as any) ?? {};
        if (!deviceType) return;

        // Only remove from connectedDevices if no other connection with same deviceType exists
        const stillConnected = [...this.room.getConnections()].some(
            c => c.id !== conn.id && (c.state as any)?.deviceType === deviceType
        );
        if (!stillConnected) {
            this.game.connectedDevices = this.game.connectedDevices.filter(d => d !== deviceType);
            this.broadcastAll();
        }
    }

    // ── Messages ─────────────────────────────────────────────────────────
    async onMessage(message: string, sender: Party.Connection) {
        let msg: any;
        try {
            msg = JSON.parse(message);
        } catch {
            return;
        }

        const { deviceType } = (sender.state as any) ?? {};

        switch (msg.type) {

            // ── Start game ───────────────────────────────────────────────
            case 'startGame': {
                if (!CAN_START_DEVICES.has(deviceType)) return;
                if (this.game.phase !== 'lobby') return;

                const gameMode: GameMode = msg.gameMode === '2device' ? '2device' : '4device';
                this.game = createNewGame();
                this.game.phase = 'red_clue';
                this.game.gameMode = gameMode;

                // Mark all currently connected devices
                for (const conn of this.room.getConnections()) {
                    const dt = (conn.state as any)?.deviceType;
                    if (dt && !this.game.connectedDevices.includes(dt)) {
                        this.game.connectedDevices.push(dt);
                    }
                }

                this.broadcastAll();
                break;
            }

            // ── Submit clue (spymasters only) ────────────────────────────
            case 'submitClue': {
                if (!CAN_CLUE_DEVICES.has(deviceType)) {
                    console.warn(`[server] submitClue rejected — deviceType: ${deviceType}`);
                    return;
                }

                const { word, number } = msg;
                if (!word || typeof word !== 'string') return;

                // Validate the phase matches the sender's team
                const teamFromDevice = deviceType === 'red_spymaster' ? 'red' : 'blue';
                const expectedPhase  = `${teamFromDevice}_clue` as GamePhase;

                if (this.game.phase !== expectedPhase) {
                    console.warn(`[server] submitClue rejected — wrong phase: ${this.game.phase}, expected: ${expectedPhase}`);
                    return;
                }

                this.game.clue = { word: word.trim(), number: Number(number) };
                this.game.phase = `${teamFromDevice}_guess` as GamePhase;

                this.broadcastAll();
                break;
            }

            // ── Guess word ───────────────────────────────────────────────
            case 'guessWord': {
                if (!CAN_GUESS_DEVICES.has(deviceType)) return;

                const { cardIndex } = msg;
                if (typeof cardIndex !== 'number') return;

                // Determine active team
                let activeTeam: TeamColor | null = null;
                if (this.game.phase === 'red_guess')  activeTeam = 'red';
                if (this.game.phase === 'blue_guess') activeTeam = 'blue';
                if (!activeTeam) return;

                // In 4-device mode, validate operative belongs to active team
                if (this.game.gameMode === '4device') {
                    if (deviceType === 'red_operative'  && activeTeam !== 'red')  return;
                    if (deviceType === 'blue_operative' && activeTeam !== 'blue') return;
                }
                // dual_player can guess for any active team

                const card = this.game.cards[cardIndex];
                if (!card || card.revealed) return;

                card.revealed = true;

                if (card.type === 'assassin') {
                    // Assassin — other team wins
                    this.game.winner    = activeTeam === 'red' ? 'blue' : 'red';
                    this.game.winReason = 'assassin';
                    this.game.phase     = 'game_over';
                    this.broadcastAll();
                    return;
                }

                if (card.type === 'red')  this.game.redRemaining  = Math.max(0, this.game.redRemaining  - 1);
                if (card.type === 'blue') this.game.blueRemaining = Math.max(0, this.game.blueRemaining - 1);

                // Check win
                if (this.game.redRemaining  === 0) { this.game.winner = 'red';  this.game.winReason = 'agents_found'; this.game.phase = 'game_over'; this.broadcastAll(); return; }
                if (this.game.blueRemaining === 0) { this.game.winner = 'blue'; this.game.winReason = 'agents_found'; this.game.phase = 'game_over'; this.broadcastAll(); return; }

                // Wrong card — end turn automatically
                if (card.type !== activeTeam) {
                    this.game.clue  = null;
                    this.game.phase = activeTeam === 'red' ? 'blue_clue' : 'red_clue';
                }

                this.broadcastAll();
                break;
            }

            // ── End turn ─────────────────────────────────────────────────
            case 'endTurn': {
                if (!CAN_GUESS_DEVICES.has(deviceType)) return;

                let activeTeam: TeamColor | null = null;
                if (this.game.phase === 'red_guess')  activeTeam = 'red';
                if (this.game.phase === 'blue_guess') activeTeam = 'blue';
                if (!activeTeam) return;

                // In 4-device mode, validate operative belongs to active team
                if (this.game.gameMode === '4device') {
                    if (deviceType === 'red_operative'  && activeTeam !== 'red')  return;
                    if (deviceType === 'blue_operative' && activeTeam !== 'blue') return;
                }

                this.game.clue  = null;
                this.game.phase = activeTeam === 'red' ? 'blue_clue' : 'red_clue';

                this.broadcastAll();
                break;
            }
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────

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
