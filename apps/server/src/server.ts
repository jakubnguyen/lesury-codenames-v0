import type * as Party from 'partykit/server';
import {
    type RoomState,
    type RoomMessage,
    type Player,
    // Demo
    createInitialDemoState,
    applyDemoMessage,
    type DemoGameState,
    type DemoGameMessage,
    // The Line
    createInitialTheLineState,
    applyTheLineMessage,
    type TheLineGameState,
    type TheLineMessage,
    // Guessio
    createInitialGuessioState,
    applyGuessioMessage,
    type GuessioGameState,
    type GuessioMessage,
    // Timeline
    createInitialTimelineState,
    applyTimelineMessage,
    type TimelineGameState,
    type TimelineMessage,
    dealNextEvent,
    getNextPlayerId,
    // Zoom
    createInitialZoomState,
    applyZoomMessage,
    type ZoomGameState,
    type ZoomMessage,
    // Mindshot
    createInitialMindshotState,
    applyMindshotMessage,
    type MindshotGameState,
    type MindshotMessage,
    // OneWord
    createInitialOneWordState,
    applyOneWordMessage,
    toPublicOneWordState,
    type OneWordGameState,
    type OneWordMessage,
} from '@lesury/game-logic';

// Pool of distinct emoji avatars for players
const AVATAR_POOL = [
    '🦊',
    '🐸',
    '🦉',
    '🐙',
    '🦋',
    '🐺',
    '🦁',
    '🐧',
    '🐼',
    '🦄',
    '🐝',
    '🐳',
    '🦜',
    '🐨',
    '🦚',
    '🐯',
];

/**
 * Combined state for room + game
 */
interface ServerState {
    room: RoomState;
    game:
        | DemoGameState
        | TheLineGameState
        | GuessioGameState
        | TimelineGameState
        | ZoomGameState
        | MindshotGameState
        | OneWordGameState;
}

export default class Server implements Party.Server {
    state: ServerState;
    gameInitialized: boolean = false;
    // Maps current conn.id → canonical player id (sessionId from lobby)
    connToPlayer: Map<string, string> = new Map();

    constructor(readonly room: Party.Room) {
        // Initialize with room code from room.id
        this.state = {
            room: {
                roomCode: room.id.toUpperCase(),
                hostId: '',
                players: [],
                status: 'waiting',
                gameType: 'demo', // Default, will be updated
            },
            game: createInitialDemoState(),
        };
    }

    onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
        console.log(
            `Connected: id=${conn.id} room=${this.room.id} url=${new URL(ctx.request.url).pathname}`
        );
        const url = new URL(ctx.request.url);
        const deviceType = url.searchParams.get('deviceType') || undefined;
        conn.setState({ deviceType });

        // First connection becomes host
        if (!this.state.room.hostId) {
            this.state.room.hostId = conn.id;
        }

        this.updateOneWordConnectedDevices();

        // Send current state to new connection
        this.syncToConnection(conn);
    }

    onClose(conn: Party.Connection) {
        console.log(`Disconnected: id=${conn.id}`);

        // Use the canonical player id (may differ from conn.id after a rejoin)
        const playerId = this.connToPlayer.get(conn.id) || conn.id;
        this.connToPlayer.delete(conn.id);

        // Remove player from list
        this.state.room.players = this.state.room.players.filter((p) => p.id !== playerId);

        this.updateOneWordConnectedDevices();

        // Broadcast updated state
        this.broadcastState();
    }

    onMessage(message: string, sender: Party.Connection) {
        console.log(`Message from ${sender.id}: ${message}`);

        try {
            const msg = JSON.parse(message);

            // Handle room messages
            if (this.isRoomMessage(msg)) {
                this.handleRoomMessage(msg, sender);
                return;
            }

            console.log(
                `[onMessage] gameType=${this.state.room.gameType}, msg.type=${msg.type}, gameInitialized=${this.gameInitialized}`
            );

            // Handle game-specific messages based on game type
            if (this.state.room.gameType === 'demo' && this.isDemoMessage(msg)) {
                this.handleDemoMessage(msg);
                return;
            }

            if (this.state.room.gameType === 'the-line' && this.isTheLineMessage(msg)) {
                console.log(`[onMessage] Routing to handleTheLineMessage`);
                this.handleTheLineMessage(msg, sender);
                return;
            }

            if (this.state.room.gameType === 'guessio' && this.isGuessioMessage(msg)) {
                console.log(`[onMessage] Routing to handleGuessioMessage`);
                this.handleGuessioMessage(msg, sender);
                return;
            }

            if (this.state.room.gameType === 'timeline' && this.isTimelineMessage(msg)) {
                console.log(`[onMessage] Routing to handleTimelineMessage`);
                this.handleTimelineMessage(msg, sender);
                return;
            }

            if (this.state.room.gameType === 'zoom' && this.isZoomMessage(msg)) {
                console.log(`[onMessage] Routing to handleZoomMessage`);
                this.handleZoomMessage(msg, sender);
                return;
            }

            if (this.state.room.gameType === 'mindshot' && this.isMindshotMessage(msg)) {
                console.log(`[onMessage] Routing to handleMindshotMessage`);
                this.handleMindshotMessage(msg, sender);
                return;
            }

            if (this.state.room.gameType === 'oneword' && this.isOneWordMessage(msg)) {
                console.log(`[onMessage] Routing to handleOneWordMessage`);
                this.handleOneWordMessage(msg, sender);
                return;
            }

            console.log(
                `[onMessage] Message NOT handled! gameType=${this.state.room.gameType}, msg.type=${msg.type}`
            );
        } catch (e) {
            console.error('Failed to process message:', e);
        }
    }

    // Room message handling
    isRoomMessage(msg: any): msg is RoomMessage {
        return ['join', 'leave', 'start', 'sync', 'kick'].includes(msg.type);
    }

    handleRoomMessage(msg: RoomMessage, sender: Party.Connection) {
        switch (msg.type) {
            case 'join':
                if (msg.gameType && !this.gameInitialized) {
                    // First host join: initialize the game type and state
                    this.state.room.gameType = msg.gameType;
                    this.state.room.hostId = sender.id;
                    this.gameInitialized = true;

                    console.log(`Initializing game type: ${msg.gameType}`);

                    if (msg.gameType === 'the-line') {
                        this.state.game = {
                            selectedCategory: '',
                            roundLimit: 5,
                            roundIndex: 0,
                            line: [],
                            deck: [],
                            playQueue: [],
                            activePlayerId: '',
                            activeEvent: null,
                            cursorIndex: 0,
                            scores: {},
                            usedCardIds: [],
                            status: 'setup',
                            last_action: null,
                        } satisfies TheLineGameState;
                    } else if (msg.gameType === 'guessio') {
                        this.state.game = createInitialGuessioState([], []);
                    } else if (msg.gameType === 'timeline') {
                        this.state.game = createInitialTimelineState();
                    } else if (msg.gameType === 'zoom') {
                        this.state.game = createInitialZoomState([]);
                    } else if (msg.gameType === 'mindshot') {
                        this.state.game = createInitialMindshotState([]);
                    } else if (msg.gameType === 'oneword') {
                        this.state.game = createInitialOneWordState('en');
                    } else {
                        this.state.game = createInitialDemoState();
                    }
                    this.updateOneWordConnectedDevices();
                } else if (msg.gameType && msg.playerName === 'Host') {
                    // Host reconnecting (e.g. after redirect) — update hostId to new connection
                    // so start_game and other host actions work correctly
                    this.state.room.hostId = sender.id;
                    console.log(`Host reconnected, updated hostId to ${sender.id}`);
                }

                // Use sessionId if provided (player rejoining after redirect keeps same canonical ID)
                this.addPlayer(sender.id, msg.playerName, msg.sessionId);
                break;
            case 'leave':
                this.removePlayer(sender.id);
                break;
            case 'start':
                if (sender.id === this.state.room.hostId) {
                    this.state.room.status = 'playing';

                    this.broadcastState();
                }
                break;
            case 'kick':
                if (sender.id === this.state.room.hostId && msg.playerId) {
                    // Send kicked message to the player's connection before removing
                    for (const [connId, pid] of this.connToPlayer.entries()) {
                        if (pid === msg.playerId) {
                            const conn = [...this.room.getConnections()].find(
                                (c) => c.id === connId
                            );
                            if (conn) {
                                conn.send(JSON.stringify({ type: 'kicked' }));
                            }
                        }
                    }
                    // Remove player from list
                    this.state.room.players = this.state.room.players.filter(
                        (p) => p.id !== msg.playerId
                    );
                    this.broadcastState();
                }
                break;
        }
    }

    addPlayer(connId: string, name: string, sessionId?: string) {
        // The canonical player id: prefer sessionId (from lobby before redirect)
        const playerId = sessionId || connId;

        // Track which conn maps to which player (for onClose cleanup)
        this.connToPlayer.set(connId, playerId);

        // Don't add if already exists (e.g. reconnect race)
        if (this.state.room.players.some((p) => p.id === playerId)) {
            return;
        }

        // Pick an avatar not yet taken
        const usedAvatars = new Set(this.state.room.players.map((p) => p.avatar));
        const avatar = AVATAR_POOL.find((a) => !usedAvatars.has(a)) || '👤';

        const player: Player = {
            id: playerId,
            name,
            isHost: playerId === this.state.room.hostId,
            joinedAt: Date.now(),
            avatar,
        };

        this.state.room.players.push(player);
        this.broadcastState();
    }

    removePlayer(connId: string) {
        const playerId = this.connToPlayer.get(connId) || connId;
        this.state.room.players = this.state.room.players.filter((p) => p.id !== playerId);
        this.broadcastState();
    }

    // Demo game message handling
    isDemoMessage(msg: any): msg is DemoGameMessage {
        return ['increment', 'decrement'].includes(msg.type);
    }

    handleDemoMessage(msg: DemoGameMessage) {
        if (this.state.room.status !== 'playing') return;

        this.state.game = applyDemoMessage(this.state.game as DemoGameState, msg);
        this.broadcastState();
    }

    // The Line game message handling
    isTheLineMessage(msg: any): msg is TheLineMessage {
        return ['start_game', 'move_cursor', 'place_card', 'next_turn', 'play_again'].includes(
            msg.type
        );
    }

    handleTheLineMessage(msg: TheLineMessage, sender: Party.Connection) {
        try {
            let gameState = this.state.game as TheLineGameState;

            if (msg.type === 'start_game') {
                // Create initial state with all non-host player IDs
                const playerIds = this.state.room.players.filter((p) => !p.isHost).map((p) => p.id);
                console.log(
                    `[start_game] players=${JSON.stringify(this.state.room.players.map((p) => ({ id: p.id, name: p.name, isHost: p.isHost })))}, playerIds=${JSON.stringify(playerIds)}, category=${msg.category}, roundLimit=${msg.roundLimit}`
                );
                // Pass session's used card IDs for no-repeat draw
                const previouslyUsedCardIds = gameState.usedCardIds || [];
                gameState = createInitialTheLineState(
                    msg.category,
                    msg.roundLimit,
                    playerIds,
                    previouslyUsedCardIds
                );
                this.state.room.status = 'playing';
                console.log(
                    `[start_game] Game started! status=${gameState.status}, line=${gameState.line.length}, deck=${gameState.deck.length}`
                );
            } else if (msg.type === 'play_again') {
                gameState = applyTheLineMessage(gameState, msg);
                // Return to lobby/setup state
                this.state.room.status = 'playing';
            } else {
                gameState = applyTheLineMessage(gameState, msg);
            }

            this.state.game = gameState;
            this.broadcastState();
        } catch (e) {
            console.error('[handleTheLineMessage] ERROR:', e);
        }
    }

    // Guessio game message handling
    isGuessioMessage(msg: any): msg is GuessioMessage {
        return ['join', 'start_game', 'select_word_and_bet', 'report_result', 'next_turn'].includes(
            msg.type
        );
    }

    handleGuessioMessage(msg: GuessioMessage, sender: Party.Connection) {
        try {
            let gameState = this.state.game as GuessioGameState;
            gameState = applyGuessioMessage(gameState, msg);

            if (msg.type === 'start_game') {
                this.state.room.status = 'playing';
            }

            this.state.game = gameState;
            this.broadcastState();
        } catch (e) {
            console.error('[handleGuessioMessage] ERROR:', e);
        }
    }

    // Timeline message handling
    isTimelineMessage(msg: any): msg is TimelineMessage {
        return ['startGame', 'moveCard', 'setPosition', 'placeCard', 'nextTurn'].includes(msg.type);
    }

    handleTimelineMessage(msg: TimelineMessage, sender: Party.Connection) {
        try {
            let gameState = this.state.game as TimelineGameState;
            const canonicalSenderId = this.connToPlayer.get(sender.id) || sender.id;

            if (msg.type === 'startGame') {
                gameState = createInitialTimelineState(msg.mode, msg.cardsGoal);
                const playerIds = this.state.room.players
                    .filter((p) => !p.isHost)
                    .map((p) => p.id);
                if (playerIds.length > 0) {
                    gameState = dealNextEvent(gameState, playerIds[0]);
                    gameState.playerScores = {};
                    for (const pid of playerIds) {
                        gameState.playerScores[pid] = 0;
                    }
                }
                this.state.room.status = 'playing';
            } else if (msg.type === 'nextTurn') {
                const playerIds = this.state.room.players
                    .filter((p) => !p.isHost)
                    .map((p) => p.id);
                const nextPlayerId = getNextPlayerId(playerIds, gameState.activePlayerId);
                gameState = dealNextEvent(gameState, nextPlayerId);
            } else {
                gameState = applyTimelineMessage(gameState, msg);
            }

            this.state.game = gameState;
            this.broadcastState();
        } catch (e) {
            console.error('[handleTimelineMessage] ERROR:', e);
        }
    }

    // Zoom message handling
    isZoomMessage(msg: any): msg is ZoomMessage {
        return ['start_game', 'guess', 'time_up', 'next_round', 'pause', 'resume', 'play_again'].includes(msg.type);
    }

    handleZoomMessage(msg: ZoomMessage, sender: Party.Connection) {
        try {
            let gameState = this.state.game as ZoomGameState;

            // Resolve the canonical player ID (may differ from conn.id after a redirect/rejoin)
            const canonicalSenderId = this.connToPlayer.get(sender.id) || sender.id;

            const activePlayerIds = this.state.room.players
                .filter((p) => !p.isHost)
                .map((p) => p.id);

            if (msg.type === 'start_game') {
                gameState = createInitialZoomState(activePlayerIds);
                // The host sends the levels with start_game, so we pass it immediately
                gameState = applyZoomMessage(gameState, msg, canonicalSenderId, activePlayerIds);
                this.state.room.status = 'playing';
            } else {
                gameState = applyZoomMessage(gameState, msg, canonicalSenderId, activePlayerIds);
            }

            // Sync players names if they changed or joined
            const players = { ...gameState.players };
            let playersUpdated = false;
            Object.keys(players).forEach((id) => {
                const roomPlayer = this.state.room.players.find((p) => p.id === id);
                if (roomPlayer && roomPlayer.name !== players[id].name) {
                    players[id] = { ...players[id], name: roomPlayer.name };
                    playersUpdated = true;
                }
            });

            if (playersUpdated) {
                gameState = { ...gameState, players };
            }

            this.state.game = gameState;
            this.broadcastState();
        } catch (e) {
            console.error('[handleZoomMessage] ERROR:', e);
        }
    }


    // Mindshot message handling
    isMindshotMessage(msg: any): msg is MindshotMessage {
        return ['start_game', 'submit_actions', 'unlock_actions', 'end_planning', 'advance_phase', 'play_again'].includes(msg.type);
    }

    handleMindshotMessage(msg: MindshotMessage, sender: Party.Connection) {
        try {
            let gameState = this.state.game as MindshotGameState;

            const canonicalSenderId = this.connToPlayer.get(sender.id) || sender.id;

            const activePlayerIds = this.state.room.players
                .filter((p) => !p.isHost)
                .map((p) => p.id);

            if (msg.type === 'start_game') {
                gameState = createInitialMindshotState(activePlayerIds);
                gameState = applyMindshotMessage(gameState, msg, canonicalSenderId, activePlayerIds);
                this.state.room.status = 'playing';

                // Sync player names from room
                for (const roomPlayer of this.state.room.players) {
                    if (gameState.players[roomPlayer.id]) {
                        gameState.players[roomPlayer.id] = {
                            ...gameState.players[roomPlayer.id],
                            name: roomPlayer.name,
                        };
                    }
                }
            } else {
                gameState = applyMindshotMessage(gameState, msg, canonicalSenderId, activePlayerIds);
            }

            this.state.game = gameState;
            this.broadcastState();
        } catch (e) {
            console.error('[handleMindshotMessage] ERROR:', e);
        }
    }

    // OneWord message handling
    isOneWordMessage(msg: any): msg is OneWordMessage {
        return ['start_game', 'submit_number', 'guess_word', 'skip_turn', 'play_again'].includes(
            msg.type
        );
    }

    handleOneWordMessage(msg: OneWordMessage, sender: Party.Connection) {
        try {
            let gameState = this.state.game as OneWordGameState;
            const deviceType = ((sender.state as any)?.deviceType as string | undefined) || '';

            if (msg.type === 'start_game' || msg.type === 'play_again') {
                if (sender.id !== this.state.room.hostId) {
                    console.warn(
                        `[handleOneWordMessage] Ignoring ${msg.type}: sender ${sender.id} is not current host ${this.state.room.hostId}`
                    );
                    return;
                }
            }

            if (msg.type === 'submit_number' && deviceType !== 'spymaster') {
                console.warn(
                    `[handleOneWordMessage] Ignoring submit_number: deviceType=${deviceType || 'unknown'}`
                );
                return;
            }

            if ((msg.type === 'guess_word' || msg.type === 'skip_turn') && deviceType !== 'player') {
                console.warn(
                    `[handleOneWordMessage] Ignoring ${msg.type}: deviceType=${deviceType || 'unknown'}`
                );
                return;
            }

            gameState = applyOneWordMessage(gameState, msg);
            this.state.game = gameState;
            this.state.room.status = gameState.phase === 'lobby' ? 'waiting' : 'playing';
            this.updateOneWordConnectedDevices();
            this.broadcastState();
        } catch (e) {
            console.error('[handleOneWordMessage] ERROR:', e);
        }
    }

    // State sync
    syncToConnection(conn: Party.Connection) {
        const { deviceType } = (conn.state as any) ?? {};
        conn.send(
            JSON.stringify({
                type: 'sync',
                room: this.state.room,
                game: this.getSyncedGameState(deviceType),
            })
        );
    }

    broadcastState() {
        for (const conn of this.room.getConnections()) {
            const { deviceType } = (conn.state as any) ?? {};
            conn.send(
                JSON.stringify({
                    type: 'sync',
                    room: this.state.room,
                    game: this.getSyncedGameState(deviceType),
                })
            );
        }
    }

    getSyncedGameState(deviceType?: string) {
        if (this.state.room.gameType !== 'oneword') {
            return this.state.game;
        }

        return deviceType === 'spymaster' ? this.state.game : toPublicOneWordState(this.state.game as OneWordGameState);
    }

    updateOneWordConnectedDevices() {
        if (this.state.room.gameType !== 'oneword') return;
        const gameState = this.state.game as OneWordGameState;
        const connectedDevices = new Set<string>();
        for (const conn of this.room.getConnections()) {
            const deviceType = (conn.state as any)?.deviceType;
            if (deviceType) connectedDevices.add(deviceType);
        }
        this.state.game = {
            ...gameState,
            connectedDevices: [...connectedDevices],
        };
    }
}

Server satisfies Party.Worker;
