---
description: Design specification for the game over screens on Host (TV) and Player (Mobile) views
---

# Game Over Screen — Design Specification

This document defines the standard design for all **game over screens** across every game on the Lesury platform. It covers both the **Host (TV)** and **Player (Mobile)** views.

The canonical reference implementations are:
- Host: [`TheLineHost.tsx`](../apps/web/components/games/the-line/TheLineHost.tsx) — `game.status === 'finished'` branch
- Player: [`TheLinePlayer.tsx`](../apps/web/components/games/the-line/TheLinePlayer.tsx) — `game.status === 'finished'` branch

The design uses the **Lesury_Main theme** (shadcn-based Oklch colours).

---

## 1. Separation of Concerns

| View | Purpose |
|------|---------|
| **Host (TV)** | Grand summary: winner announcement, full leaderboard with all scores, and Play Again / Home controls. |
| **Player (Mobile)** | Personalised result: placement medal, their score only, the LeadCaptureForm, and a Home button. They cannot trigger Play Again. |

---

## 2. Host Screen — "TV" View

Rendered when `game.status === 'finished'` (or equivalent — see § 6).

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  bg-background  min-h-screen  flex items-center justify-center   │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  bg-card  rounded-xl  shadow-2xl  p-12  text-center        │  │
│  │  max-w-2xl  w-full                                         │  │
│  │                                                            │  │
│  │  🏆  (text-7xl  mb-4)                                      │  │
│  │  {winner avatar emoji}  (text-5xl  mb-2)                   │  │
│  │  "{Player} Wins!"  (text-4xl  font-bold  mb-2)             │  │
│  │  "Category: X · N rounds"  (text-muted-foreground  mb-8)   │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │  {avatar}  #1  {name}              {score} pts  ← accent  │  │
│  │  ├──────────────────────────────────────────────────────┤  │  │
│  │  │  {avatar}  #2  {name}              {score} pts  ← secondary  │  │
│  │  │  …                                                    │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  │  (space-y-2  mb-8, each row stagger-animates in)           │  │
│  │                                                            │  │
│  │  [  Play Again  ]        [  Home  ]                        │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### Specification

- **Outer wrapper**: `min-h-screen bg-background flex items-center justify-center p-6`
- **Card** (`motion.div`): `bg-card rounded-xl shadow-2xl p-12 text-center max-w-2xl w-full`
  - Animation: `initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}`
- **Trophy icon**: `text-7xl mb-4` → `🏆`, or `💥` when draw (see § 8)
- **Winner avatar**: `text-5xl mb-2` — emoji from `room.players`; omit entirely on a draw
- **Winner headline**: `text-4xl font-bold mb-2 text-foreground` → `"{Name} Wins!"` or `"Game Over"` on draw
- **Game settings subtitle**: `text-muted-foreground mb-8` — game-specific (see § 8)
- **Leaderboard list**: `space-y-2 mb-8`
  - Each row is a `motion.div` with `initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}`
  - **#1 row**: `flex justify-between items-center p-4 rounded-xl bg-accent text-accent-foreground`
  - **#2+ rows**: same layout with `bg-secondary` (text: `text-foreground`)
  - Row contents — left side: rank `#N`, avatar `text-2xl`, name `font-bold`; right side: score `font-bold tabular-nums text-xl`
- **Action row**: `flex gap-4`
  - **Play Again**: `flex-1 bg-accent text-accent-foreground px-8 py-4 rounded-xl text-lg font-bold hover:opacity-90 transition-opacity shadow-lg` → sends `{ type: 'play_again' }`
  - **Home**: `flex-1 bg-secondary text-secondary-foreground px-8 py-4 rounded-xl text-lg font-bold hover:opacity-80 transition-opacity shadow-lg` → `window.location.href = '/games/<slug>'`

---

## 3. Player Screen — "Controller" View

Rendered when `game.status === 'finished'` (or equivalent — see § 6).

### Layout

```
┌──────────────────────────────────────────┐
│  bg-background  min-h-screen             │
│  flex items-center justify-center p-6    │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │  bg-muted  rounded-3xl  p-8      │    │
│  │  text-center  max-w-md  shadow-xl│    │
│  │                                  │    │
│  │  {medal emoji}  (text-6xl  mb-4) │    │
│  │  "You Win!" / "#2 Place"         │    │
│  │  text-2xl  font-bold  mb-2       │    │
│  │                                  │    │
│  │  ┌────────────────────────────┐  │    │
│  │  │  "Your Score"  (muted-fg)  │  │    │
│  │  │  {score}  text-4xl accent  │  │    │
│  │  └────────────────────────────┘  │    │
│  │  bg-card rounded-xl p-4 mb-6     │    │
│  │                                  │    │
│  │  ┌────────────────────────────┐  │    │
│  │  │   <LeadCaptureForm />      │  │    │
│  │  └────────────────────────────┘  │    │
│  │  mb-6                            │    │
│  │                                  │    │
│  │  "Waiting for host..."  (muted)  │    │
│  │  mb-4  text-sm                   │    │
│  │                                  │    │
│  │  [  Home  ]                      │    │
│  └──────────────────────────────────┘    │
└──────────────────────────────────────────┘
```

### Specification

- **Outer wrapper**: `min-h-screen bg-background flex items-center justify-center p-6`
- **Card** (`motion.div`): `bg-muted rounded-3xl p-8 text-center max-w-md shadow-xl w-full`
  - Animation: `initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}`
- **Medal icon**: `text-6xl mb-4` → `🏆` (1st), `🥈` (2nd), `🥉` (3rd), `🎮` (4th+)
- **Placement title**: `text-2xl font-bold mb-2 text-foreground` → `"You Win!"` (1st) or `"#{rank} Place"`
- **Score block**: `bg-card rounded-xl p-4 mb-6 shadow-md`
  - Label: `text-sm text-muted-foreground` → `"Your Score"`
  - Value: `text-4xl font-bold text-accent tabular-nums`
- **LeadCaptureForm**: `<LeadCaptureForm />` wrapped in a `mb-6` container (see § 5)
- **Waiting text**: `text-muted-foreground text-sm mb-4` → `"Waiting for host to start a new game..."`
- **Home button**: `w-full bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold hover:bg-[#2A2A2A] transition-colors`
  - Routes to `/` (the platform home page, not the game page)
  - **Players do not get a Play Again button** — only the host can reset

---

## 4. Animation Summary

| Element | `initial` | `animate` | Extra |
|---------|-----------|-----------|-------|
| Host card | `{ opacity: 0, scale: 0.9 }` | `{ opacity: 1, scale: 1 }` | — |
| Player card | `{ opacity: 0, scale: 0.9 }` | `{ opacity: 1, scale: 1 }` | — |
| Leaderboard rows (host) | `{ opacity: 0, x: -20 }` | `{ opacity: 1, x: 0 }` | `transition={{ delay: idx * 0.1 }}` |

---

## 5. LeadCaptureForm

`<LeadCaptureForm />` lives at [`apps/web/components/LeadCaptureForm.tsx`](../apps/web/components/LeadCaptureForm.tsx).

- Renders an email input + "Get Access" submit button inside a `bg-card rounded-xl` container.
- On success, transitions to a `🎯` confirmation message in place of the form.
- **Render on the Player screen only** — directly below the score block, above the waiting text.
- **Do not render on the Host screen.**

---

## 5a. Game-Over Latch (Play Again Guard)

**Problem:** When the host clicks Play Again, the server immediately broadcasts a new game state (phase: `'lobby'` / status: `'setup'`). Without a guard, the player's game-over screen — including the half-filled LeadCaptureForm — disappears before the player can submit.

**Solution:** Each `<Name>Player.tsx` must maintain a `gameOverSnapshot` local state that:

1. **Captures** score/stats into local state the moment the game-over phase is first detected (before any reset can arrive).
2. **Drives** the game-over render branch instead of reading live game state — so the screen stays visible even after the game resets.
3. **Changes the footer** based on whether a new game has started:

| Condition | Footer shown |
|-----------|-------------|
| `game phase === game-over` (still waiting) | `"Waiting for host..."` text + **Home** button |
| `game phase !== game-over` (new game started) | Pulsing `"New game starting!"` text + **Join Game →** button (accent) |

4. **Clears** (`setGameOverSnapshot(null)`) only when the player taps **Join Game →**, at which point the component naturally renders the lobby/waiting screen.

```typescript
// Capture once — scores/stats are reset to zero by play_again
useEffect(() => {
    if (game.status === 'finished' && !gameOverSnapshot) {
        const sorted = Object.entries(game.scores).sort(([, a], [, b]) => b - a);
        setGameOverSnapshot({
            myScore: game.scores[playerId] || 0,
            myRank: sorted.findIndex(([pid]) => pid === playerId) + 1,
        });
    }
}, [game.status, game.scores, playerId, gameOverSnapshot]);

// Render while latched — regardless of current game.status
if (gameOverSnapshot) {
    const newGameStarting = game.status !== 'finished';
    // … render score, LeadCaptureForm, then conditional footer …
}
```

**Join Game → button styling:** `w-full bg-accent text-accent-foreground px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity`

**"New game starting!" styling:** `text-accent font-bold text-sm mb-4` + pulsing opacity animation `animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.5, repeat: Infinity }}`

> This hook pattern must be implemented in every `<Name>Player.tsx` that shows a LeadCaptureForm. The snapshot field names vary by game (score for The Line, stats for Mindshot) but the latch mechanism is identical.

---

## 6. Technical Requirements

### Game status field names

| Game | Field | Finished value |
|------|-------|----------------|
| The Line | `game.status` | `'finished'` |
| Mindshot | `game.phase` | `'game-over'` |
| Guessio | `game.status` | `'ended'` |
| Zoom | `game.phase` | `'game_over'` |

### Score sorting (Host leaderboard)

```typescript
const sortedScores = Object.entries(game.scores).sort(([, a], [, b]) => b - a);
const winnerId = sortedScores[0]?.[0];
```

### Player rank

```typescript
const myRank = sortedScores.findIndex(([pid]) => pid === playerId) + 1;
```

### Analytics

`trackGameCompleted(GAME_NAME, 0)` fires in the **Host** component only, inside a `useEffect` on the status transition:

```typescript
useEffect(() => {
    if (game.status === 'finished') {
        trackGameCompleted('The Line', 0);
    }
}, [game.status]);
```

---

## 7. Design Tokens (from Lesury_Main theme)

| Token | Light value | Dark value | Usage |
|-------|-------------|------------|-------|
| `--background` | `oklch(0.982 0.005 95)` | `oklch(0.191 0.002 107)` | Page bg |
| `--card` | `oklch(1.000 0 0)` | `oklch(0.235 0.002 107)` | Score block (player); host card |
| `--foreground` | `oklch(0.191 0.002 107)` | `oklch(0.982 0.005 95)` | All text |
| `--muted-foreground` | `oklch(0.750 0.013 96)` | `oklch(0.750 0.013 96)` | Subtitle, labels, waiting text |
| `--accent` | `oklch(0.672 0.131 39)` ≈ terracotta | same | #1 leaderboard row bg; score value; Play Again button |
| `--accent-foreground` | white | white | Text on accent bg |
| `--secondary` | `oklch(0.952 0.007 97)` | `oklch(0.284 0.004 107)` | #2+ leaderboard row bg; Home button (host) |
| `--muted` | `oklch(0.952 0.007 97)` | `oklch(0.284 0.004 107)` | Player card bg |
| `--primary` | near-black | near-white | Home button bg (player) |
| `--radius` | `0.75rem` | `0.125rem` | `rounded-xl` = `calc(var(--radius) - 2px)` |

> **Shape convention:** Host card → `rounded-xl`. Player card → `rounded-3xl`. Do not swap these.
> **Font:** `Source Code Pro, monospace` — inherited globally; no need to specify `font-mono`.
> **Shadows:** Use `shadow-2xl` for the host card and `shadow-xl` for the player card, consistent with the theme's shadow tokens.

---

## 8. Per-Game Customisation

### Leaderboard vs Stats Table

| Game | Host summary element | Player score block |
|------|---------------------|-------------------|
| The Line | Score rows from `game.scores` | "Your Score" |
| Mindshot | Stats table: `game.placements` + `game.players[id].stats` (rounds, damage, eliminations) | — (no per-player score card) |
| Guessio | Team score rows from `game.scores` | "Your Team's Score" |
| Zoom | Score rows from `game.scores` | "Your Score" |

### Winner / draw handling

| Game | Winner field | Draw condition |
|------|-------------|----------------|
| The Line | Derived: `sortedScores[0][0]` | N/A (ties split by index) |
| Mindshot | `game.winner` (nullable) | `game.winner === null` → show `💥 "Draw!"` |
| Guessio | Derived from team scores | N/A |
| Zoom | `game.winnerId` | — |

### Game settings subtitle (under winner headline)

| Game | Subtitle format |
|------|----------------|
| The Line | `"Category: {category} · {N} rounds"` |
| Mindshot | `"Last one standing"` (winner) or `"No survivors"` (draw) |
| Guessio | `"{N} rounds completed"` |
| Zoom | `"{N} rounds completed"` |

---

## 9. Notes for Implementation

- Always use CSS design tokens — **never hardcode hex values** in Tailwind classes (the `hover:bg-[#2A2A2A]` on the player Home button is an accepted legacy exception from the canonical reference).
- **Do not add a ThemeToggle** inside the game-over screen. It is provided globally by `ThemeProvider` at `fixed bottom-4 right-4`.
- Use `motion.div` (framer-motion) for the card entrance animation on both Host and Player.
- **Play Again** sends `{ type: 'play_again' }` via the party socket; the server resets game state to `setup`/`lobby` while preserving the room and player list — no QR re-scan needed.
- **Only the Host triggers Play Again.** Players only get a Home button.
- `trackGameCompleted` fires on the Host component only — not on the Player component.
- Scores/stats come from the final synced game state; the server must not reset state before all clients have rendered the game-over screen.
