'use client';

import { useEffect, useRef, useState } from 'react';
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
    neutral:   '#B0AEA5',
    assassin:  '#141413',
    green:     '#788C5D',
    greenSoft: '#788C5D20',
};

type GameMode = '4device' | '2device';

interface Props {
    state: { room: RoomState; game: CodenamesGameStatePublic };
    roomCode: string;
    socket: import("partysocket").PartySocket | null;
}

// ─── QR Code canvas ───────────────────────────────────────────────────────────
function QRCanvas({ url, label, color, soft }: { url: string; label: string; color: string; soft: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current) return;
        import('qrcode').then((QRCode) => {
            QRCode.toCanvas(canvasRef.current!, url, {
                width: 140,
                margin: 1,
                color: { dark: T.text, light: '#FFFFFF' },
            });
        });
    }, [url]);

    return (
        <div style={{
            background: T.white,
            border: `2px solid ${color}`,
            borderRadius: '20px',
            padding: '16px',
            textAlign: 'center',
            flex: 1,
            minWidth: '160px',
            boxShadow: `0 2px 12px ${soft}`,
        }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color, letterSpacing: '1.5px', marginBottom: '10px' }}>
                {label.toUpperCase()}
            </div>
            <canvas ref={canvasRef} style={{ borderRadius: '8px', display: 'block', margin: '0 auto' }} />
            <div style={{ fontSize: '10px', color: T.textMid, marginTop: '8px', fontFamily: 'monospace', letterSpacing: '1px' }}>
                {url.replace('https://', '').replace('http://', '')}
            </div>
        </div>
    );
}

// ─── Checkmark overlay ────────────────────────────────────────────────────────
function ConnectedBadge() {
    return (
        <div style={{
            position: 'absolute', top: '12px', right: '12px',
            width: '20px', height: '20px', borderRadius: '50%',
            background: T.green, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', color: T.white, fontWeight: '800',
        }}>✓</div>
    );
}

// ─── Mode toggle ──────────────────────────────────────────────────────────────
function ModeToggle({ mode, onChange }: { mode: GameMode; onChange: (m: GameMode) => void }) {
    return (
        <div style={{ display: 'flex', background: T.bgSecond, border: `1px solid ${T.bgThird}`, borderRadius: '14px', padding: '4px', gap: '4px' }}>
            {(['4device', '2device'] as GameMode[]).map(m => {
                const active = mode === m;
                return (
                    <button
                        key={m}
                        onClick={() => onChange(m)}
                        style={{
                            flex: 1, padding: '8px 12px', borderRadius: '10px',
                            background: active ? T.white : 'transparent',
                            border: active ? `1px solid ${T.bgThird}` : '1px solid transparent',
                            fontFamily: 'inherit', fontWeight: '700', fontSize: '12px',
                            color: active ? T.text : T.textMid, cursor: 'pointer',
                            boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                            transition: 'all 0.15s', letterSpacing: '0.3px',
                        }}
                    >
                        {m === '4device' ? '📱📱📱📱 4 Phones' : '📱📱 2 Phones'}
                    </button>
                );
            })}
        </div>
    );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
function Card({ card }: { card: CodenamesCardPublic }) {
    const revealed = card.revealed;
    let bg = T.white, text = T.text, border = T.bgThird;

    if (revealed) {
        if (card.type === 'red')      { bg = T.red;      text = T.white; border = '#CC785C'; }
        if (card.type === 'blue')     { bg = T.blue;     text = T.white; border = '#5589BB'; }
        if (card.type === 'neutral')  { bg = T.bgThird;  text = T.textMid; border = T.bgThird; }
        if (card.type === 'assassin') { bg = T.assassin; text = T.white; border = T.assassin; }
    }

    return (
        <div style={{
            background: bg,
            border: `2px solid ${border}`,
            borderRadius: '12px',
            padding: '8px 4px',
            textAlign: 'center',
            fontSize: '13px',
            fontWeight: '700',
            letterSpacing: '0.5px',
            color: text,
            opacity: revealed ? 0.6 : 1,
            textDecoration: revealed ? 'line-through' : 'none',
            minHeight: '52px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: revealed ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
        }}>
            {card.word}
        </div>
    );
}

// ─── Score pill ───────────────────────────────────────────────────────────────
function Score({ team, count, active }: { team: 'red' | 'blue'; count: number; active: boolean }) {
    const color = team === 'red' ? T.red : T.blue;
    const soft  = team === 'red' ? T.redSoft : T.blueSoft;
    return (
        <div style={{
            background: active ? soft : 'transparent',
            border: `2px solid ${active ? color : T.bgThird}`,
            borderRadius: '16px',
            padding: '10px 32px',
            textAlign: 'center',
            transition: 'all 0.25s',
        }}>
            <div style={{ fontSize: '40px', fontWeight: '800', color, lineHeight: 1 }}>{count}</div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: active ? color : T.textMid, letterSpacing: '2px', marginTop: '4px' }}>
                {team.toUpperCase()}
            </div>
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CodenamesHost({ state, roomCode, socket }: Props) {
    const { game } = state;
    const { phase, cards, clue, redRemaining, blueRemaining, connectedDevices = [], winner, winReason } = game;

    // ── Game mode toggle (client-side, host decides before start) ────────
    const [gameMode, setGameMode] = useState<GameMode>('4device');

    const baseUrl = typeof window !== 'undefined'
        ? `${window.location.protocol}//${window.location.host}`
        : '';

    // ── QR URLs per mode ─────────────────────────────────────────────────
    const qrUrls4 = {
        red_spymaster:  `${baseUrl}/games/codenames/spymaster?room=${roomCode}&team=red`,
        blue_spymaster: `${baseUrl}/games/codenames/spymaster?room=${roomCode}&team=blue`,
        red_operative:  `${baseUrl}/games/codenames/operative?room=${roomCode}&team=red`,
        blue_operative: `${baseUrl}/games/codenames/operative?room=${roomCode}&team=blue`,
    };

    const qrUrls2 = {
        dual_spymaster: `${baseUrl}/games/codenames/dual-spymaster?room=${roomCode}`,
        dual_player:    `${baseUrl}/games/codenames/dual-player?room=${roomCode}`,
    };

    const isRedTurn  = phase === 'red_clue'  || phase === 'red_guess';
    const isBlueTurn = phase === 'blue_clue' || phase === 'blue_guess';

    // Connected check differs by mode
    const allConnected4 = connectedDevices.length >= 4;
    const allConnected2 = connectedDevices.includes('dual_spymaster') && connectedDevices.includes('dual_player');
    const allConnected  = gameMode === '4device' ? allConnected4 : allConnected2;

    // ── Notify server of mode change when host starts (include in startGame) ──
    const startGame = () => {
        socket?.send(JSON.stringify({ type: 'startGame', gameMode }));
    };

    // ── Lobby ────────────────────────────────────────────────────────────
    if (phase === 'lobby') {
        const connectedCount4 = connectedDevices.filter(d =>
            ['red_spymaster','blue_spymaster','red_operative','blue_operative'].includes(d)
        ).length;
        const connectedCount2 = connectedDevices.filter(d =>
            ['dual_spymaster','dual_player'].includes(d)
        ).length;

        return (
            <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'Inter', system-ui, sans-serif", padding: '24px' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: T.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: T.white }}>⊙</div>
                        <span style={{ fontSize: '22px', fontWeight: '800', color: T.text }}>lesury</span>
                    </div>
                    <div style={{ background: T.bgSecond, border: `1px solid ${T.bgThird}`, borderRadius: '12px', padding: '8px 20px', fontSize: '15px', fontWeight: '700', color: T.textMid, fontFamily: 'monospace', letterSpacing: '3px' }}>
                        {roomCode}
                    </div>
                </div>

                <h1 style={{ fontSize: '32px', fontWeight: '800', color: T.text, marginBottom: '6px' }}>Codenames</h1>
                <p style={{ color: T.textMid, fontSize: '15px', marginBottom: '20px' }}>
                    {allConnected ? 'All players connected! Ready to start.' : gameMode === '4device' ? `Waiting for players — ${connectedCount4}/4 connected` : `Waiting for players — ${connectedCount2}/2 connected`}
                </p>

                {/* Mode toggle */}
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: T.textMid, letterSpacing: '1.5px', marginBottom: '8px' }}>DEVICE MODE</div>
                    <ModeToggle mode={gameMode} onChange={setGameMode} />
                    <div style={{ fontSize: '12px', color: T.textMid, marginTop: '8px' }}>
                        {gameMode === '4device'
                            ? '2 spymaster phones + 2 operative phones'
                            : '1 spymaster phone (sees colors, gives clues verbally) + 1 player phone (taps cards)'}
                    </div>
                </div>

                {/* QR codes — 4-device mode */}
                {gameMode === '4device' && (
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '32px' }}>
                        {[
                            { key: 'red_spymaster',  label: '🔴 Red Spymaster',  color: T.red,  soft: T.redSoft  },
                            { key: 'blue_spymaster', label: '🔵 Blue Spymaster', color: T.blue, soft: T.blueSoft },
                            { key: 'red_operative',  label: '🔴 Red Operative',  color: T.red,  soft: T.redSoft  },
                            { key: 'blue_operative', label: '🔵 Blue Operative', color: T.blue, soft: T.blueSoft },
                        ].map(({ key, label, color, soft }) => (
                            <div key={key} style={{ flex: 1, minWidth: '180px', position: 'relative' }}>
                                <QRCanvas url={qrUrls4[key as keyof typeof qrUrls4]} label={label} color={color} soft={soft} />
                                {connectedDevices.includes(key) && <ConnectedBadge />}
                            </div>
                        ))}
                    </div>
                )}

                {/* QR codes — 2-device mode */}
                {gameMode === '2device' && (
                    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '32px', justifyContent: 'center' }}>
                        {[
                            {
                                key: 'dual_spymaster',
                                label: '🕵️ Spymaster Phone',
                                sublabel: 'Sees all card colors — gives clues verbally',
                                color: T.text,
                                soft: T.bgSecond,
                            },
                            {
                                key: 'dual_player',
                                label: '🎮 Player Phone',
                                sublabel: 'Taps cards for both teams',
                                color: T.green,
                                soft: T.greenSoft,
                            },
                        ].map(({ key, label, sublabel, color, soft }) => (
                            <div key={key} style={{ flex: 1, minWidth: '200px', maxWidth: '280px', position: 'relative' }}>
                                <QRCanvas url={qrUrls2[key as keyof typeof qrUrls2]} label={label} color={color} soft={soft} />
                                <div style={{ textAlign: 'center', fontSize: '11px', color: T.textMid, marginTop: '8px', padding: '0 8px' }}>
                                    {sublabel}
                                </div>
                                {connectedDevices.includes(key) && <ConnectedBadge />}
                            </div>
                        ))}
                    </div>
                )}

                {/* Start button */}
                {allConnected && (
                    <div style={{ textAlign: 'center' }}>
                        <button
                            onClick={startGame}
                            style={{
                                background: T.text, color: T.white, border: 'none',
                                borderRadius: '100px', padding: '16px 48px',
                                fontSize: '18px', fontWeight: '700', fontFamily: 'inherit',
                                cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                            }}
                        >
                            Start Game →
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // ── Game over ────────────────────────────────────────────────────────
    if (phase === 'game_over') {
        const winColor = winner === 'red' ? T.red : T.blue;
        const winSoft  = winner === 'red' ? T.redSoft : T.blueSoft;
        return (
            <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'Inter', system-ui, sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                <div style={{ background: winSoft, border: `3px solid ${winColor}`, borderRadius: '24px', padding: '40px 60px', textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>{winReason === 'assassin' ? '☠️' : '🏆'}</div>
                    <div style={{ fontSize: '36px', fontWeight: '800', color: winColor, marginBottom: '8px' }}>
                        {winner?.toUpperCase()} WINS
                    </div>
                    <div style={{ fontSize: '16px', color: T.textMid }}>
                        {winReason === 'assassin' ? 'Assassin contacted — elimination victory' : 'All agents found!'}
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', width: '100%', maxWidth: '600px' }}>
                    {cards.map((card, i) => <Card key={i} card={card} />)}
                </div>
            </div>
        );
    }

    // ── Playing ──────────────────────────────────────────────────────────
    const clueTeamColor = isRedTurn ? T.red : T.blue;
    const clueTeamSoft  = isRedTurn ? T.redSoft : T.blueSoft;
    const isGuessingPhase = phase === 'red_guess' || phase === 'blue_guess';

    return (
        <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'Inter', system-ui, sans-serif" }}>
            {/* Header */}
            <div style={{ background: T.white, borderBottom: `1px solid ${T.bgThird}`, padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: T.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: T.white }}>⊙</div>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: T.text }}>lesury</span>
                </div>
                <span style={{ fontSize: '13px', fontWeight: '600', color: T.textMid }}>Codenames</span>
                <div style={{ fontFamily: 'monospace', fontSize: '15px', fontWeight: '700', color: T.textMid, letterSpacing: '3px' }}>{roomCode}</div>
            </div>

            {/* Score bar */}
            <div style={{ background: T.white, borderBottom: `1px solid ${T.bgThird}`, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
                <Score team="red"  count={redRemaining}  active={isRedTurn} />

                <div style={{ flex: 1, maxWidth: '280px', textAlign: 'center' }}>
                    {isGuessingPhase && clue ? (
                        <div style={{ background: clueTeamSoft, border: `2px solid ${clueTeamColor}`, borderRadius: '16px', padding: '12px 20px' }}>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: T.textMid, letterSpacing: '1.5px', marginBottom: '4px' }}>CLUE</div>
                            <div style={{ fontSize: '24px', fontWeight: '800', color: clueTeamColor, letterSpacing: '1px' }}>
                                {clue.word} — {clue.number === 0 ? '∞' : clue.number}
                            </div>
                        </div>
                    ) : (
                        <div style={{ background: clueTeamSoft, border: `2px solid ${clueTeamColor}`, borderRadius: '16px', padding: '12px 20px' }}>
                            <div style={{ fontSize: '14px', color: clueTeamColor, fontWeight: '600' }}>
                                {isGuessingPhase
                                    ? `⏳ ${isRedTurn ? 'Red' : 'Blue'} is guessing…`
                                    : `⏳ Waiting for ${isRedTurn ? 'Red' : 'Blue'} clue…`}
                            </div>
                        </div>
                    )}
                </div>

                <Score team="blue" count={blueRemaining} active={isBlueTurn} />
            </div>

            {/* 5×5 Grid */}
            <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', maxWidth: '760px', margin: '0 auto' }}>
                {cards.map((card, i) => <Card key={i} card={card} />)}
            </div>
        </div>
    );
}
