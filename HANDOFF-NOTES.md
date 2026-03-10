# Lesury Codenames — Handoff Document for New Chat

## Project Overview

**Lesury** is a hybrid party game platform: TV/PC shows the game board, players use phones as controllers (join via QR code, no app needed). Built with Next.js + PartyKit (WebSockets). The project owner is non-technical and relies on Claude for all code.

**Local project path:** `/Users/tnguyen/LESURY/lesury-codenames-v0`
**Dev GitHub:** `https://github.com/jakubnguyen/lesury-codenames-v0`
**Production GitHub:** `https://github.com/Leasury/lesury`
**Vercel deployment:** `https://lesury-codenames-v0-web.vercel.app`

---

## Tech Stack

- **Frontend:** Next.js 16 (App Router, TypeScript, Tailwind CSS)
- **Real-time:** PartyKit (WebSockets) — server file at `src/server.ts`
- **Monorepo-style:** Single Next.js app, game logic in `src/game-logic/`
- **Deployment:** Vercel (frontend) + PartyKit cloud (websocket server)

---

## Local Development — How to Run

Requires **two terminal windows open simultaneously:**

**Terminal 1 — PartyKit (game server):**
```bash
cd /Users/tnguyen/LESURY/lesury-codenames-v0
npx partykit dev src/server.ts
# Runs on localhost:1999
```

**Terminal 2 — Next.js (frontend):**
```bash
cd /Users/tnguyen/LESURY/lesury-codenames-v0
npm run dev
# Runs on localhost:3000
```

---

## Codenames Game — Complete File Map

All Codenames files live in the repo. Here is every file and its role:

### Backend (PartyKit server)
```
src/server.ts
```
- Standalone PartyKit server — completely separate from the main platform server
- Manages all game state in memory
- Identifies connected devices via URL query param `?deviceType=`
- Sends game state as `{ type: 'state', game: {...} }` (NOT 'sync')
- Device types: `host`, `red_spymaster`, `blue_spymaster`, `red_operative`, `blue_operative`, `dual_spymaster`, `dual_player`
- Full state (all card colors visible) sent to: `host`, `red_spymaster`, `blue_spymaster`, `dual_spymaster`
- Public state (card colors hidden until revealed) sent to: `red_operative`, `blue_operative`, `dual_player`
- Supports two modes: `4device` (2 spymasters + 2 operatives) and `2device` (1 spymaster + 1 player)

### Hook (critical — connects frontend to PartyKit)
```
src/hooks/usePartyRoom.ts
```
- **KEY FIX APPLIED:** Passes `deviceType` and `playerName` as URL query params to PartyKit
- **KEY FIX APPLIED:** Accepts BOTH `type: 'state'` and `type: 'sync'` messages
- **KEY FIX APPLIED:** Uses `setRoomState(data.room ?? {})` — roomState was staying null because codenames server doesn't send a `room` field
- Without these fixes the host page spins forever

### Pages (Next.js App Router)
```
src/app/games/codenames/page.tsx          — Landing page (game description, "Host" button, how to play)
src/app/games/codenames/host/page.tsx     — TV/PC host page (generates room code, shows QR codes)
src/app/games/codenames/spymaster/page.tsx       — 4-device spymaster phone
src/app/games/codenames/operative/page.tsx       — 4-device player phone  
src/app/games/codenames/dual-spymaster/page.tsx  — 2-device spymaster phone
src/app/games/codenames/dual-player/page.tsx     — 2-device player phone
```

**Important — host page uses these options:**
```typescript
usePartyRoom(roomCode, {
    asHost: true,        // sends join message on connect
    deviceType: 'host',  // passed as URL query param to server
    playerName: 'TV',
})
```

**Spymaster/operative pages use:**
```typescript
usePartyRoom(roomCode, {
    deviceType: 'red_spymaster', // or blue_spymaster, red_operative, etc.
    playerName: 'Red Spymaster',
})
```

### Components (React UI)
```
src/components/games/codenames/CodenamesHost.tsx          — TV display (5x5 grid, scores, QR lobby)
src/components/games/codenames/CodenamesSpymaster.tsx     — Spymaster phone (sees colors, submits clues)
src/components/games/codenames/CodenamesOperative.tsx     — Player phone (taps cards to guess)
src/components/games/codenames/CodenamesDualSpymaster.tsx — 2-device spymaster (read-only, gives clues verbally)
src/components/games/codenames/CodenamesDualPlayer.tsx    — 2-device player (taps for both teams)
```

**KEY FIX in all 5 components:**
```typescript
// WRONG — crashes before server sends first state:
const { phase, cards, clue, ... } = game;

// CORRECT — safe default prevents .map() crash:
const { phase, cards = [], clue, ... } = game;
```

---

## Design System / Tokens

All components use this shared token object (inline styles, no Tailwind in game components):
```typescript
const T = {
    bg:        '#FAF9F5',  // page background
    bgSecond:  '#F0EFEA',  // card/section background
    bgThird:   '#E8E6DC',  // borders
    text:      '#141413',  // primary text
    textMid:   '#B0AEA5',  // muted text
    white:     '#FFFFFF',
    red:       '#D97757',  // red team
    redSoft:   '#D9775718',
    blue:      '#6A9BCC',  // blue team
    blueSoft:  '#6A9BCC18',
};
```

---

## Game Logic Summary

**Setup:** 25 words in 5x5 grid. 9 red, 8 blue, 7 neutral, 1 assassin. Red goes first.

**Turn flow:**
1. `red_clue` phase → Red Spymaster gives 1 word + number
2. `red_guess` phase → Red Operatives tap cards
3. Correct card → keep guessing (max = clue number + 1)
4. Wrong card (neutral/blue/assassin) → turn ends or game over
5. Repeat for blue

**Win conditions:**
- Find all your team's agents → win
- Opponent taps assassin → you win
- You tap assassin → you lose

---

## GitHub Problem (UNRESOLVED)

The repo has `node_modules` tracked in git history across 6 commits, causing push failures (100MB file limit). This needs to be fixed before deploying to Vercel via GitHub.

**Fix when ready:**
```bash
cd /Users/tnguyen/LESURY/lesury-codenames-v0
git filter-branch --force --index-filter \
  'git rm -rf --cached --ignore-unmatch node_modules' \
  --prune-empty --tag-name-filter cat -- --all
echo "node_modules/" > .gitignore
git add .gitignore
git push origin main --force
```
Or simpler: delete the repo on GitHub, create fresh, push from local.

---

## What Was Working / What Was Tested

✅ Landing page (`/games/codenames`) — fully working
✅ Host lobby (`/games/codenames/host`) — loads with QR codes after fixes
✅ WebSocket connection confirmed working via browser DevTools
✅ Server sending correct game state confirmed via WebSocket messages
⚠️ Full game flow (spymaster clue → operative guess → win condition) — not yet fully tested end-to-end
⚠️ Vercel deployment — blocked by GitHub node_modules issue

---

## Next Steps (Priority Order)

1. **Fix GitHub push** (node_modules in history) — use the filter-branch command above
2. **Test full game flow locally** — open 4 browser tabs: host + 2 spymasters + 2 operatives
3. **Deploy to Vercel** — connect GitHub repo, set `NEXT_PUBLIC_PARTYKIT_HOST` env var to PartyKit cloud URL
4. **Add Codenames to the games list** — `src/app/games/page.tsx` may need a Codenames card added

---

## ZIP Package

A complete ZIP of the repo (without node_modules) was prepared as:
`lesury-codenames-FINAL.zip`

To use: unzip, then run `npm install` inside the folder, then follow the Local Development steps above.
