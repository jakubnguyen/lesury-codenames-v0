'use client';

import type { PartySocket } from 'partysocket';
import type { RoomState } from '@lesury/game-logic';
import type { CodenamesGameState, CodenamesCard } from '@lesury/game-logic';

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
    socket?: PartySocket | null;
}

// ─── Card — spymaster always sees color ───────────────────────────────────────
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
            opacity: revealed ? 0.45 : 1,
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

// ─── Active turn banner ───────────────────────────────────────────────────────
function TurnBanner({ phase, clue }: { phase: string; clue: { word: string; number: number } | null }) {
    const isRed  = phase.startsWith('red');
    const color  = isRed ? T.red : T.blue;
    const soft   = isRed ? T.redSoft : T.blueSoft;
    const team   = isRed ? 'RED' : 'BLUE';
    const isClue = phase.endsWith('_clue');

    return (
        <div style={{ background: soft, borderBottom: `2px solid ${color}`, padding: '14px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color, letterSpacing: '1.5px', marginBottom: '2px' }}>
                {team} TEAM
            </div>
            {isClue ? (
                <div style={{ fontSize: '15px', fontWeight: '700', color }}>
                    Give your clue verbally 🗣
                </div>
            ) : clue ? (
                <>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: T.textMid, letterSpacing: '1px' }}>CLUE</div>
                    <div style={{ fontSize: '20px', fontWeight: '800', color }}>
                        {clue.word} — {clue.number === 0 ? '∞' : clue.number}
                    </div>
                </>
            ) : (
                <div style={{ fontSize: '15px', fontWeight: '700', color }}>Guessing…</div>
            )}
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CodenamesDualSpymaster({ state }: Props) {
    const { game } = state;
    const { phase, cards, clue, redRemaining, blueRemaining, winner, winReason } = game;

    // ── Game over ────────────────────────────────────────────────────────
    if (phase === 'game_over') {
        const winColor = winner === 'red' ? T.red : T.blue;
        const winSoft  = winner === 'red' ? T.redSoft : T.blueSoft;
        return (
            <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'Inter', system-ui, sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' }}>
                <div style={{ background: winSoft, border: `3px solid ${winColor}`, borderRadius: '24px', padding: '32px 48px', marginBottom: '24px' }}>
                    <div style={{ fontSize: '40px', marginBottom: '8px' }}>{winReason === 'assassin' ? '☠️' : '🏆'}</div>
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

    // ── Lobby ────────────────────────────────────────────────────────────
    if (phase === 'lobby') {
        return (
            <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'Inter', system-ui, sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' }}>
                <div style={{ background: T.bgSecond, border: `2px solid ${T.bgThird}`, borderRadius: '20px', padding: '32px 40px' }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>🕵️</div>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: T.text, marginBottom: '6px' }}>
                        Spymaster
                    </div>
                    <div style={{ fontSize: '14px', color: T.textMid }}>
                        Connected — waiting for host to start
                    </div>
                </div>
                <div style={{ marginTop: '16px', fontSize: '13px', color: T.textMid }}>
                    You'll see all card colors. Give clues verbally.
                </div>
            </div>
        );
    }

    // ── Playing ──────────────────────────────────────────────────────────
    return (
        <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'Inter', system-ui, sans-serif" }}>
            {/* Active turn banner */}
            <TurnBanner phase={phase} clue={clue} />

            {/* Score */}
            <div style={{ background: T.white, borderBottom: `1px solid ${T.bgThird}`, padding: '10px 20px', display: 'flex', justifyContent: 'center', gap: '20px' }}>
                <div style={{ textAlign: 'center', border: `2px solid ${phase.startsWith('red') ? T.red : T.bgThird}`, borderRadius: '12px', padding: '6px 20px' }}>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: T.red }}>{redRemaining}</div>
                    <div style={{ fontSize: '10px', fontWeight: '700', color: T.textMid, letterSpacing: '2px' }}>RED</div>
                </div>
                <div style={{ textAlign: 'center', border: `2px solid ${phase.startsWith('blue') ? T.blue : T.bgThird}`, borderRadius: '12px', padding: '6px 20px' }}>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: T.blue }}>{blueRemaining}</div>
                    <div style={{ fontSize: '10px', fontWeight: '700', color: T.textMid, letterSpacing: '2px' }}>BLUE</div>
                </div>
            </div>

            {/* Full colored grid — read only */}
            <div style={{ padding: '14px 14px 24px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '5px', maxWidth: '420px', margin: '0 auto' }}>
                {cards.map((card, i) => <SpyCard key={i} card={card} />)}
            </div>

            <div style={{ textAlign: 'center', padding: '0 16px 24px', fontSize: '12px', color: T.textMid }}>
                Give clues verbally — the player taps cards on their phone
            </div>
        </div>
    );
}
