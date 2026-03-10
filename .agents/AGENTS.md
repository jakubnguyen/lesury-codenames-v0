---
description: Lesury project rules and practices for AI agents. Read this before making any changes.
---

# Lesury — Agent Instructions

This file is read automatically at the start of every agent session. Follow all rules here without needing to be told.

---

## Project Overview

Lesury is a **multiplayer party game platform** built as a Turbo monorepo with npm workspaces:

| Package | Purpose |
|---|---|
| `packages/game-logic` | All game logic, types, and utilities. Pure TypeScript, no framework dependencies. |
| `apps/server` | PartyKit server. Handles connections, routing, state broadcasting. **No game logic here.** |
| `apps/web` | Next.js frontend. Displays state, sends messages. **No game logic here.** |
| `packages/config` | Shared ESLint and TypeScript configs. |

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | **Next.js 16** (App Router), **TypeScript**, **Tailwind CSS v4**, **ShadCN UI** |
| Real-time server | **PartyKit** + **partysocket** (WebSocket-based state sync) |
| Animation | **Framer Motion** |
| Icons | **Lucide React** (`lucide-react`) — the ShadCN default |
| Font | **Source Code Pro** (loaded via `next/font/google`, mapped to all three font families) |

---

## Rule 1: Logic Belongs in `game-logic`

- **ALL** game rules, state transitions, scoring, win conditions, and player rotation must live in `packages/game-logic/src/`.
- `apps/server` only: receives messages → calls game-logic → broadcasts state.
- `apps/web` only: renders state → sends messages. No business logic.
- If you catch yourself computing game state in `server.ts` or a `.tsx` file, extract it to game-logic first.

**Pattern for adding logic:**

```
packages/game-logic/src/games/<gameName>/logic.ts   ← pure functions
packages/game-logic/src/games/<gameName>/types.ts   ← types
packages/game-logic/src/games/<gameName>/index.ts   ← re-export everything
```

---

## Rule 2: Share Solutions Across Games

- Common frontend socket logic lives in `apps/web/hooks/usePartyRoom.ts`. **Use it** for every new game page — never write raw PartySocket code in a page.
- Common server patterns (room management, player join/leave) are already handled by `Server` class in `server.ts`. Extend, don't duplicate.
- When two games need the same helper (e.g. turn rotation), it goes into `game-logic`, not copy-pasted.

---

## Rule 3: TypeScript Everywhere + Always Build After Changes

- All files must be `.ts` or `.tsx`. No `.js` or `.jsx` files in source. Avoid `any` — use proper types or `unknown` with narrowing.
- **After every code change**, run `npm run build` from the monorepo root and fix any TypeScript errors before finishing.

```bash
npm run build
```

> If build fails with TypeScript errors: fix them. Never leave a broken build.

---

## Rule 4: Approval Tests for Game Logic

All game logic in `packages/game-logic` must be covered by approval tests.

**Run tests after every change to game-logic:**

```bash
npm run test
```

### If tests fail:

| Situation | Action |
|---|---|
| You changed logic intentionally and the snapshot is now wrong | Promote received→approved: `cp *.received.txt *.approved.txt` for the affected test, then re-run |
| The failure looks like a regression/bug | Fix the code, don't change the approved file |
| Unsure if the behavior change is intentional | **Ask the developer before promoting snapshots** |

### Adding tests for new logic:

```
packages/game-logic/src/games/<gameName>/__tests__/logic.test.ts
```

Use the `approve(testName, data)` helper pattern (see existing tests). Use `nodediff` reporter.

**Promoting all received files to approved (first run or bulk approval):**

```bash
for f in packages/game-logic/src/**/__tests__/*.received.txt; do cp "$f" "${f/.received.txt/.approved.txt}"; done
```

---

## Rule 5: After Every Code Change — Checklist

// turbo-all

1. Run `npm run build` from monorepo root — fix any TypeScript errors
2. Run `npm run test` from monorepo root — fix test failures or ask developer about snapshot changes

---

## Rule 6: Utility and Generation Scripts

- One-off scripts (e.g., data generation, API scrapers, image generators) must live in the `scripts/` folder at the monorepo root.
- **NEVER** import from the `scripts/` folder inside `apps/` or `packages/`.
- Prefer `.ts` over `.js`. Run them using `npx tsx scripts/<script-name>.ts`.
- Every script must have a concise header comment explaining its purpose and the exact command to run it.

---

## Rule 7: AI Agent Handoffs and Scratchpads

- If an ongoing task requires tracking state between sessions (like tracking generated images, rate limits, or a checklist), keep this context in `.agents/handoff_plan.md` (or similarly named files in `.agents/`).
- Do not clutter the root directory with agent-only markdown scratchpads (other than standard project docs like `README.md` and `DEPLOYMENT.md`).

---

## Rule 8: Git — CRITICAL

> [!CAUTION]
> **The agent must NEVER run `git commit`, `git push`, `git add`, or any other git write command.**
> Only the user commits and pushes to the repository.

- Make code changes freely, but **stop before any git operation**.
- When changes are ready, tell the user which files changed and let them commit.
- The only git commands the agent may run are **read-only**: `git status`, `git diff`, `git log`, `git branch`, etc.

---

## Styling & Design System

### Colors — Use Tokens Only

**Never hardcode hex values.** Always use CSS variable design tokens:

| Token | Usage |
|---|---|
| `bg-background` / `text-foreground` | Page backgrounds and primary text |
| `bg-card` / `text-card-foreground` | Cards, panels |
| `bg-secondary` | Subtle surface areas |
| `bg-muted` / `text-muted-foreground` | Subdued backgrounds, captions, labels |
| `bg-accent` / `text-accent-foreground` | Primary buttons, highlights (terracotta in dark mode) |
| `bg-border` | Dividers, input borders |
| `bg-destructive` | Error and danger states |

All tokens automatically adapt to light/dark mode. Source of truth: `apps/web/app/globals.css`.

### Dark Mode

The project uses `next-themes` with `attribute="class"`. The `.dark` class is toggled on `<html>`. All design tokens already have dark-mode overrides in `globals.css`. Do **not** write `dark:` Tailwind variants unless a specific override is unavoidable — the tokens handle it.

### Typography

- **Font:** Source Code Pro — applied globally. Do **not** specify `font-mono` or `font-sans` per-element.
- **Weight conventions:** `font-normal` (body) → `font-medium` (labels) → `font-semibold`/`font-bold` (headings) → `font-black` (hero/display).
- Use `tabular-nums` for counters and numbers.

### Tailwind & Components

- **Tailwind CSS v4 utilities only.** No `tailwind.config.js` — all config lives in `apps/web/app/globals.css` via `@theme inline`.
- No custom CSS files or `style={{}}` props unless absolutely unavoidable.
- Mobile-first: default styles for mobile, `md:` / `lg:` for larger screens.
- Animations via **Framer Motion** (`framer-motion`). Use `motion.div` with `initial/animate` for entrances.
- Rounded corners: `rounded-xl` (inputs), `rounded-2xl` (cards), `rounded-3xl` (modals/panels).
- **Buttons:** use the shadcn `<Button>` component. For primary actions: `bg-accent text-accent-foreground`.

### Component Reuse — Critical

1. **Before creating any component**, search `apps/web/components/` and `apps/web/app/components/` first.
2. **Never duplicate** functionality already covered by an existing component, ShadCN primitive, or game-logic function.
3. If a ShadCN component is not yet installed: `npx shadcn@latest add <component>` (run inside `apps/web`).

---

## Game Architecture Pattern

Every game **must** follow this structure exactly:

```
app/games/<game>/page.tsx                      ← landing page (description + start/join CTAs)
app/games/<game>/host/page.tsx                 ← host page (TV screen)
app/games/<game>/player/page.tsx               ← player page (phone controller)

components/games/<game>/<Game>Host.tsx         ← host display & game board logic
components/games/<game>/<Game>Player.tsx       ← player controls & input logic

packages/game-logic/src/games/<game>/types.ts  ← state + message types
packages/game-logic/src/games/<game>/logic.ts  ← pure reducer (createInitial* + apply*)
packages/game-logic/src/games/<game>/index.ts  ← re-exports
packages/game-logic/src/games/<game>/__tests__/logic.test.ts ← approval tests

apps/server/src/server.ts                      ← PartyKit message routing handler
```

- **Host page** uses `usePartyRoom({ asHost: true, gameType: '<game>' })`.
- **Player page** uses `usePartyRoom({ sessionKeyPrefix: 'lobby' })`.
- The server handler must call `this.connToPlayer.get(sender.id) || sender.id` to resolve the **canonical player ID** before passing to `apply*Message` — never use raw `sender.id` as a player key.

See `.agents/workflows/add-new-game.md` for the full step-by-step checklist.

---

## Host Lobby Screen

All host lobby screens must follow `.agents/workflows/host-lobby-design-spec.md`. Summary:

- Dark background (`bg-background`) with two `bg-card` panels side by side (`max-w-5xl`)
- Game title centered **above** both panels
- Left panel: QR code + room code + player list (subtitle: **"Scan to join"**)
- Right panel: game settings (up to 2 controls) + Start Game button (subtitle: **"Set up game"**)
- Accent color (`bg-accent / text-accent-foreground`) for active selections and the Start button

---

## Game Over Screen

All game over screens must follow `.agents/workflows/game-over-design-spec.md`. Summary:

- **Host (TV)**: centered `bg-card rounded-xl` card — trophy + winner avatar + `"{Name} Wins!"` headline + staggered leaderboard rows (`bg-accent` for #1, `bg-secondary` for rest) + Play Again / Home buttons
- **Player (Mobile)**: centered `bg-muted rounded-3xl` card — placement medal + personal score in `text-accent` + `<LeadCaptureForm />` + waiting text + Home button
- Only the **Host** sends `{ type: 'play_again' }` — players never get a Play Again button
- `trackGameCompleted()` fires on the Host component only

---

## Real-Time Communication

- Server uses **PartyKit** for WebSocket state sync.
- Clients connect via **partysocket** (`PartySocket`).
- Game state is managed **server-side**; clients send action messages and receive `sync` broadcasts.
- Send messages from components via `(window as any).__partySocket.send(JSON.stringify({ type: '...' }))`.
- The `usePartyRoom` hook handles all connection boilerplate — use it instead of raw PartySocket in pages.

---

## File Structure Reference

```
apps/
  server/src/server.ts          ← single server entry point
  web/
    app/games/<name>/
      host/page.tsx             ← uses usePartyRoom({ asHost: true })
      player/page.tsx           ← uses usePartyRoom({ sessionKeyPrefix: 'lobby' })
    components/games/<name>/
      <Name>Host.tsx            ← pure display, receives state prop
      <Name>Player.tsx          ← pure display + sends messages via window.__partySocket
    hooks/
      usePartyRoom.ts           ← shared PartySocket hook
    app/globals.css             ← Tailwind v4 theme, design tokens, dark mode variables

packages/
  game-logic/src/
    games/
      <name>/
        logic.ts                ← pure functions (no I/O, no side effects)
        types.ts                ← TypeScript types
        index.ts                ← re-exports
        __tests__/
          logic.test.ts         ← approval tests
          *.approved.txt        ← committed snapshots (source of truth)
    room/
      types.ts                  ← RoomState, Player, RoomMessage
```
