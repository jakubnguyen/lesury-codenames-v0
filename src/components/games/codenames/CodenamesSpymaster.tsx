'use client';

import { useState } from 'react';
import type { PartySocket } from 'partysocket';
import type { RoomState } from '@lesury/game-logic';
import type { CodenamesGameState, CodenamesCard, TeamColor } from '@lesury/game-logic';

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
    state: { room: RoomState; game: CodenamesGameState };
    team: TeamColor;
    socket?: PartySocket | null;  // ← NEW: passed from page.tsx; fallback to window.__partySocket
}

// ─── Colored card for spymaster (sees all types) ──────────────────────────────
function SpyCard({ card }: { card: CodenamesCard }) {
    const revealed = card.revealed;

    let bg = T.white, text = T.text, border = T.bgThird, glow = 'none';

    if (revealed) {
        if (card.type === 'red')      { bg = T.red;      text = T.white; border = '#CC785C'; }
        if (card.type === 'blue')     { bg = T.blue;     text = T.white; border = '#5589BB'; }
        if (card.type === 'neutral')  { bg = T.bgThird;  text = T.textMid; border = T.bgThird; }
        if (card.type === 'assassin') { bg = T.text;     text = T.white; border = T.text; }
    } else {
        if (card.type === 'red')      { bg = T.redSoft;  text = T.red;  border = T.red;  glow = `0 0 0 1px ${T.red}33`; }
        if (card.type === 'blue')     { bg = T.blueSoft; text = T.blue; border = T.blue; glow = `0 0 0 1px ${T.blue}33`; }
        if (card.type === 'neutral')  { bg = T.bgSecond; text = T.textMid; border = T.bgThird; }
        if (card.type === 'assassin') { bg = '#14141310'; text = T.text; border = T.text; }
    }

    return (
        <div style={{
            background: bg, border: `2px solid ${border}`,
            borderRadius: '10px', padding: '8px 4px',
            textAlign: 'center', fontSize: '10px', fontWeight: '800',
            letterSpacing: '0.5px', color: text,
            opacity: revealed ? 0.5 : 1,
            textDecoration: revealed ? 'line-through' : 'none',
            minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: glow,
            transition: 'all 0.15s',
        }}>
            {card.type === 'assassin' && !revealed ? '☠ ' : ''}
            {card.word}
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CodenamesSpymaster({ state, team, socket: socketProp }: Props) {
    const { game } = state;
    const { phase, cards, clue, redRemaining, blueRemaining, winner, winReason } = game;

    const [clueWord, setClueWord] = useState('');
    const [clueNum, setClueNum] = useState(2);

    const myColor  = team === 'red' ? T.red : T.blue;
    const mySoft   = team === 'red' ? T.redSoft : T.blueSoft;
    const myCluePhase  = team === 'red' ? 'red_clue'  : 'blue_clue';
    const myGuessPhase = team === 'red' ? 'red_guess' : 'blue_guess';

    const isMyCluePhase  = phase === myCluePhase;
    const isMyGuessPhase = phase === myGuessPhase;
    const isMyTurn       = isMyCluePhase || isMyGuessPhase;

    // ── FIXED: prefer prop socket, fall back to window reference ────────────
    const getSocket = (): PartySocket | null => {
        if (socketProp) return socketProp;
        return (window as any).__partySocket ?? null;
    };

    const send = (msg: object) => {
        const s = getSocket();
        if (!s) {
            console.warn('[Spymaster] No socket available to send message', msg);
            return;
        }
        s.send(JSON.stringify(msg));
    };

    const submitClue = () => {
        const word = clueWord.trim();
        if (!word) return;
        send({ type: 'submitClue', word, number: clueNum });
        setClueWord('');
    };

    // ── Game over ────────────────────────────────────────────────────────
    if (phase === 'game_over') {
        const won = winner === team;
        const winColor = winner === 'red' ? T.red : T.blue;
        const winSoft  = winner === 'red' ? T.redSoft : T.blueSoft;
        return (
            <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'Inter', system-ui, sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' }}>
                <div style={{ background: winSoft, border: `3px solid ${winColor}`, borderRadius: '24px', padding: '32px 48px', marginBottom: '24px' }}>
                    <div style={{ fontSize: '40px', marginBottom: '8px' }}>{won ? '🏆' : (winReason === 'assassin' ? '☠️' : '😔')}</div>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: winColor }}>{winner?.toUpperCase()} WINS</div>
                    <div style={{ fontSize: '14px', color: T.textMid, marginTop: '6px' }}>
                        {winReason === 'assassin' ? 'Assassin contacted' : 'All agents found'}
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', width: '100%', maxWidth: '380px' }}>
                    {cards.map((card, i) => <SpyCard key={i} card={card} />)}
                </div>
            </div>
        );
    }

    // ── Waiting (not my turn) ────────────────────────────────────────────
    if (!isMyTurn) {
        const activeTeam  = phase.startsWith('red') ? 'red' : 'blue';
        const activeColor = activeTeam === 'red' ? T.red : T.blue;
        const activeSoft  = activeTeam === 'red' ? T.redSoft : T.blueSoft;

        return (
            <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'Inter', system-ui, sans-serif" }}>
                {/* Score */}
                <div style={{ background: T.white, borderBottom: `1px solid ${T.bgThird}`, padding: '16px 20px', display: 'flex', justifyContent: 'center', gap: '20px' }}>
                    <div style={{ textAlign: 'center', border: `2px solid ${phase.startsWith('red') ? T.red : T.bgThird}`, borderRadius: '12px', padding: '8px 24px' }}>
                        <div style={{ fontSize: '28px', fontWeight: '800', color: T.red }}>{redRemaining}</div>
                        <div style={{ fontSize: '10px', fontWeight: '700', color: T.textMid, letterSpacing: '2px' }}>RED</div>
                    </div>
                    <div style={{ textAlign: 'center', border: `2px solid ${phase.startsWith('blue') ? T.blue : T.bgThird}`, borderRadius: '12px', padding: '8px 24px' }}>
                        <div style={{ fontSize: '28px', fontWeight: '800', color: T.blue }}>{blueRemaining}</div>
                        <div style={{ fontSize: '10px', fontWeight: '700', color: T.textMid, letterSpacing: '2px' }}>BLUE</div>
                    </div>
                </div>

                {/* Waiting message */}
                <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                    <div style={{ background: activeSoft, border: `2px solid ${activeColor}`, borderRadius: '20px', padding: '24px', marginBottom: '20px', display: 'inline-block' }}>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>{activeTeam === 'red' ? '🟠' : '🔵'}</div>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: activeColor }}>
                            {activeTeam.toUpperCase()} team's turn
                        </div>
                        <div style={{ fontSize: '13px', color: T.textMid, marginTop: '4px' }}>
                            {phase.endsWith('_clue') ? 'Giving a clue…' : (clue ? `Clue: ${clue.word} — ${clue.number === 0 ? '∞' : clue.number}` : 'Guessing…')}
                        </div>
                    </div>
                    <div style={{ fontSize: '13px', color: T.textMid }}>Watch the TV screen</div>
                </div>

                {/* Mini grid */}
                <div style={{ padding: '0 16px 24px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '5px', maxWidth: '380px', margin: '0 auto' }}>
                    {cards.map((card, i) => <SpyCard key={i} card={card} />)}
                </div>
            </div>
        );
    }

    // ── My clue phase ────────────────────────────────────────────────────
    if (isMyCluePhase) {
        return (
            <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'Inter', system-ui, sans-serif" }}>
                {/* Header */}
                <div style={{ background: mySoft, borderBottom: `2px solid ${myColor}`, padding: '14px 20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: myColor, letterSpacing: '1.5px' }}>
                        YOUR TURN — {team.toUpperCase()} SPYMASTER
                    </div>
                </div>

                {/* Score */}
                <div style={{ background: T.white, borderBottom: `1px solid ${T.bgThird}`, padding: '12px 20px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '20px', fontWeight: '800', color: T.red }}>{redRemaining}</span>
                        <span style={{ fontSize: '10px', color: T.textMid, letterSpacing: '1px', marginLeft: '4px' }}>RED</span>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '20px', fontWeight: '800', color: T.blue }}>{blueRemaining}</span>
                        <span style={{ fontSize: '10px', color: T.textMid, letterSpacing: '1px', marginLeft: '4px' }}>BLUE</span>
                    </div>
                </div>

                {/* Grid */}
                <div style={{ padding: '14px 14px 12px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '5px', maxWidth: '420px', margin: '0 auto' }}>
                    {cards.map((card, i) => <SpyCard key={i} card={card} />)}
                </div>

                {/* Clue input */}
                <div style={{ padding: '0 16px 32px', maxWidth: '420px', margin: '0 auto' }}>
                    <div style={{ background: T.white, border: `2px solid ${myColor}`, borderRadius: '20px', padding: '18px' }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: T.textMid, letterSpacing: '1.5px', marginBottom: '12px' }}>
                            GIVE YOUR CLUE
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                            <input
                                value={clueWord}
                                onChange={e => setClueWord(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && submitClue()}
                                placeholder="One word..."
                                style={{
                                    flex: 1, background: T.bgSecond, border: `2px solid ${T.bgThird}`,
                                    borderRadius: '12px', padding: '12px 14px', fontFamily: 'inherit',
                                    fontSize: '16px', fontWeight: '600', color: T.text, outline: 'none',
                                }}
                            />
                            <select
                                value={clueNum}
                                onChange={e => setClueNum(Number(e.target.value))}
                                style={{
                                    background: T.bgSecond, border: `2px solid ${T.bgThird}`,
                                    borderRadius: '12px', padding: '12px', fontFamily: 'inherit',
                                    fontSize: '16px', fontWeight: '700', color: T.text,
                                    outline: 'none', width: '70px', cursor: 'pointer',
                                }}
                            >
                                {[0,1,2,3,4,5,6,7,8,9].map(n => (
                                    <option key={n} value={n}>{n === 0 ? '∞' : n}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={submitClue}
                            disabled={!clueWord.trim()}
                            style={{
                                width: '100%', background: clueWord.trim() ? myColor : T.bgThird,
                                color: clueWord.trim() ? T.white : T.textMid,
                                border: 'none', borderRadius: '100px', padding: '14px',
                                fontFamily: 'inherit', fontSize: '15px', fontWeight: '700',
                                cursor: clueWord.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.15s',
                            }}
                        >
                            Confirm clue →
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── My guess phase (spectating my team guessing) ─────────────────────
    return (
        <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'Inter', system-ui, sans-serif" }}>
            {/* Active clue banner */}
            <div style={{ background: mySoft, borderBottom: `2px solid ${myColor}`, padding: '14px 20px', textAlign: 'center' }}>
                {clue ? (
                    <>
                        <div style={{ fontSize: '10px', fontWeight: '700', color: T.textMid, letterSpacing: '1.5px', marginBottom: '2px' }}>CLUE</div>
                        <div style={{ fontSize: '20px', fontWeight: '800', color: myColor }}>{clue.word} — {clue.number === 0 ? '∞' : clue.number}</div>
                    </>
                ) : (
                    <div style={{ fontSize: '14px', color: myColor, fontWeight: '600' }}>Your team is guessing…</div>
                )}
            </div>

            {/* Score */}
            <div style={{ background: T.white, borderBottom: `1px solid ${T.bgThird}`, padding: '12px 20px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
                <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '20px', fontWeight: '800', color: T.red }}>{redRemaining}</span>
                    <span style={{ fontSize: '10px', color: T.textMid, letterSpacing: '1px', marginLeft: '4px' }}>RED</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '20px', fontWeight: '800', color: T.blue }}>{blueRemaining}</span>
                    <span style={{ fontSize: '10px', color: T.textMid, letterSpacing: '1px', marginLeft: '4px' }}>BLUE</span>
                </div>
            </div>

            {/* Grid — spymaster watches */}
            <div style={{ padding: '14px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '5px', maxWidth: '420px', margin: '0 auto' }}>
                {cards.map((card, i) => <SpyCard key={i} card={card} />)}
            </div>

            <div style={{ textAlign: 'center', padding: '8px', fontSize: '13px', color: T.textMid }}>
                Watch the TV — your operatives are guessing
            </div>
        </div>
    );
}
