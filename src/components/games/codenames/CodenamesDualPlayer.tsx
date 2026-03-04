'use client';

import type { PartySocket } from 'partysocket';
import type { RoomState } from '@lesury/game-logic';
import type { CodenamesGameStatePublic, CodenamesCardPublic } from '@lesury/game-logic';

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
    bg:        '#FAF9F5',
    bgSecond:  '#F0EFEA',
    bgThird:   '#E8E6DC',
    text:      '#141413',
    textMid:   '#B0AEA5',
    white:     '#FFFFFF',
    red:       '#D97757',
    redSoft:   '#D9775718',
    blue:      '#6A9BCC',
    blueSoft:  '#6A9BCC18',
};

interface Props {
    state: { room: RoomState; game: CodenamesGameStatePublic };
    socket?: PartySocket | null;
}

// ─── Guess card ───────────────────────────────────────────────────────────────
function GuessCard({
    card, onTap, active, teamColor,
}: {
    card: CodenamesCardPublic;
    onTap: () => void;
    active: boolean;
    teamColor: string;
}) {
    const revealed = card.revealed;
    let bg = T.white, text = T.text, border = T.bgThird;

    if (revealed) {
        if (card.type === 'red')      { bg = T.red;      text = T.white; border = '#CC785C'; }
        if (card.type === 'blue')     { bg = T.blue;     text = T.white; border = '#5589BB'; }
        if (card.type === 'neutral')  { bg = T.bgThird;  text = T.textMid; border = T.bgThird; }
        if (card.type === 'assassin') { bg = T.text;     text = T.white; border = T.text; }
    }

    return (
        <button
            onClick={active ? onTap : undefined}
            disabled={!active || revealed}
            style={{
                background: bg, border: `2px solid ${active && !revealed ? teamColor : border}`,
                borderRadius: '14px', padding: '12px 6px',
                textAlign: 'center', fontSize: '11px', fontWeight: '800',
                letterSpacing: '0.5px', color: text,
                opacity: revealed ? 0.55 : 1,
                textDecoration: revealed ? 'line-through' : 'none',
                cursor: active && !revealed ? 'pointer' : 'default',
                transition: 'all 0.15s', userSelect: 'none',
                minHeight: '54px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: active && !revealed ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                width: '100%', fontFamily: 'inherit',
            }}
        >
            {card.word}
        </button>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CodenamesDualPlayer({ state, socket: socketProp }: Props) {
    const { game } = state;
    const { phase, cards, clue, redRemaining, blueRemaining, winner, winReason } = game;

    const getSocket = (): PartySocket | null => {
        if (socketProp) return socketProp;
        return (window as any).__partySocket ?? null;
    };

    const send = (msg: object) => {
        const s = getSocket();
        if (!s) return;
        s.send(JSON.stringify(msg));
    };

    const guess   = (idx: number) => send({ type: 'guessWord', cardIndex: idx });
    const endTurn = () => send({ type: 'endTurn' });

    // Derive active team and whether we should be interactive
    const isRedGuess  = phase === 'red_guess';
    const isBlueGuess = phase === 'blue_guess';
    const isGuessing  = isRedGuess || isBlueGuess;
    const isClue      = phase === 'red_clue' || phase === 'blue_clue';

    const activeTeam  = phase.startsWith('red') ? 'red' : phase.startsWith('blue') ? 'blue' : null;
    const teamColor   = activeTeam === 'red' ? T.red : T.blue;
    const teamSoft    = activeTeam === 'red' ? T.redSoft : T.blueSoft;

    // ── Lobby ────────────────────────────────────────────────────────────
    if (phase === 'lobby') {
        return (
            <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'Inter', system-ui, sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' }}>
                <div style={{ background: T.bgSecond, border: `2px solid ${T.bgThird}`, borderRadius: '20px', padding: '32px 40px' }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎮</div>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: T.text, marginBottom: '6px' }}>
                        Player
                    </div>
                    <div style={{ fontSize: '14px', color: T.textMid }}>
                        Connected — waiting for host to start
                    </div>
                </div>
                <div style={{ marginTop: '16px', fontSize: '13px', color: T.textMid }}>
                    You'll play for both teams alternating turns.
                </div>
            </div>
        );
    }

    // ── Game over ────────────────────────────────────────────────────────
    if (phase === 'game_over') {
        const winColor = winner === 'red' ? T.red : T.blue;
        const winSoft  = winner === 'red' ? T.redSoft : T.blueSoft;
        return (
            <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'Inter', system-ui, sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' }}>
                <div style={{ background: winSoft, border: `3px solid ${winColor}`, borderRadius: '24px', padding: '32px 48px' }}>
                    <div style={{ fontSize: '40px', marginBottom: '8px' }}>{winReason === 'assassin' ? '☠️' : '🏆'}</div>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: winColor }}>{winner?.toUpperCase()} WINS</div>
                    <div style={{ fontSize: '14px', color: T.textMid, marginTop: '6px' }}>
                        {winReason === 'assassin' ? 'Assassin contacted' : 'All agents found'}
                    </div>
                </div>
            </div>
        );
    }

    // ── Clue phase — wait for spymaster's verbal clue ─────────────────────
    if (isClue) {
        return (
            <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'Inter', system-ui, sans-serif" }}>
                {/* Score */}
                <div style={{ background: T.white, borderBottom: `1px solid ${T.bgThird}`, padding: '14px 20px', display: 'flex', justifyContent: 'center', gap: '20px' }}>
                    <div style={{ textAlign: 'center', border: `2px solid ${isRedGuess || phase === 'red_clue' ? T.red : T.bgThird}`, borderRadius: '12px', padding: '8px 24px' }}>
                        <div style={{ fontSize: '28px', fontWeight: '800', color: T.red }}>{redRemaining}</div>
                        <div style={{ fontSize: '10px', fontWeight: '700', color: T.textMid, letterSpacing: '2px' }}>RED</div>
                    </div>
                    <div style={{ textAlign: 'center', border: `2px solid ${isBlueGuess || phase === 'blue_clue' ? T.blue : T.bgThird}`, borderRadius: '12px', padding: '8px 24px' }}>
                        <div style={{ fontSize: '28px', fontWeight: '800', color: T.blue }}>{blueRemaining}</div>
                        <div style={{ fontSize: '10px', fontWeight: '700', color: T.textMid, letterSpacing: '2px' }}>BLUE</div>
                    </div>
                </div>

                <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                    <div style={{ background: teamSoft, border: `2px solid ${teamColor}`, borderRadius: '20px', padding: '28px', display: 'inline-block' }}>
                        <div style={{ fontSize: '36px', marginBottom: '12px' }}>🗣</div>
                        <div style={{ fontSize: '18px', fontWeight: '700', color: teamColor, marginBottom: '6px' }}>
                            {activeTeam?.toUpperCase()} Spymaster is thinking…
                        </div>
                        <div style={{ fontSize: '14px', color: T.textMid }}>
                            Wait for the verbal clue
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Guess phase ───────────────────────────────────────────────────────
    return (
        <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'Inter', system-ui, sans-serif" }}>
            {/* Clue banner */}
            <div style={{
                background: teamSoft, borderBottom: `2px solid ${teamColor}`,
                padding: '14px 20px', textAlign: 'center',
            }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: T.textMid, letterSpacing: '1.5px', marginBottom: '2px' }}>
                    {activeTeam?.toUpperCase()} TEAM — CLUE
                </div>
                {clue ? (
                    <div style={{ fontSize: '22px', fontWeight: '800', color: teamColor }}>
                        {clue.word} — {clue.number === 0 ? '∞' : clue.number}
                    </div>
                ) : (
                    <div style={{ fontSize: '15px', fontWeight: '600', color: teamColor }}>Tap a card to guess!</div>
                )}
            </div>

            {/* Score */}
            <div style={{ background: T.white, borderBottom: `1px solid ${T.bgThird}`, padding: '10px 20px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
                <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: T.red }}>{redRemaining}</span>
                    <span style={{ fontSize: '10px', color: T.textMid, letterSpacing: '1px', marginLeft: '4px' }}>RED</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: T.blue }}>{blueRemaining}</span>
                    <span style={{ fontSize: '10px', color: T.textMid, letterSpacing: '1px', marginLeft: '4px' }}>BLUE</span>
                </div>
            </div>

            {/* Guess grid */}
            <div style={{ padding: '14px 14px 0', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', maxWidth: '440px', margin: '0 auto' }}>
                {cards.map((card, idx) => (
                    <GuessCard
                        key={idx}
                        card={card}
                        onTap={() => guess(idx)}
                        active={isGuessing && !card.revealed}
                        teamColor={teamColor}
                    />
                ))}
            </div>

            {/* End Turn */}
            <div style={{ padding: '16px', textAlign: 'center', maxWidth: '440px', margin: '0 auto' }}>
                <button
                    onClick={endTurn}
                    style={{
                        background: 'transparent', color: teamColor,
                        border: `2px solid ${teamColor}`, borderRadius: '100px',
                        padding: '12px 32px', fontFamily: 'inherit', fontSize: '14px',
                        fontWeight: '700', cursor: 'pointer', width: '100%',
                        transition: 'all 0.15s',
                    }}
                >
                    End Turn →
                </button>
            </div>
        </div>
    );
}
