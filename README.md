# Lesury 🦥

A web-based multiplayer party game platform. Think Jackbox — one shared screen on a TV, everyone plays from their phone. No app install needed.

---

## Games

| Game         | Players | Status             |
| ------------ | ------- | ------------------ |
| **Timeline** | 2–8     | ✅ Live            |
| **Demo**     | Any     | ✅ (dev reference) |

### How to play

1. Open the game on a TV/laptop — this is the **host screen**
2. Players scan the QR code or enter the room code on their phones
3. Phones act as controllers — the TV is the source of truth

---

## Stack

| Layer           | Technology                                       |
| --------------- | ------------------------------------------------ |
| Frontend        | Next.js (App Router)                             |
| Realtime server | PartyKit (Cloudflare Workers)                    |
| Game logic      | Shared TypeScript package (`@lesury/game-logic`) |
| Styling         | Tailwind CSS + Framer Motion                     |
| Monorepo        | Turborepo                                        |

---

## Project Structure

```
apps/
  web/          → Next.js app (host + player pages)
  server/       → PartyKit server (WebSocket state broadcaster)

packages/
  game-logic/   → All game rules, types, and state transitions
  config/       → Shared TypeScript & ESLint configs
```

---

## Development

```bash
npm install
npm run dev     # starts Next.js + PartyKit locally
```

Player pages open on `localhost:3000`, server on `localhost:1999`.

---

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full guide.

**Short version:**

- **Frontend (Vercel):** auto-deploys from `main` branch
- **Server (PartyKit):** `npm run deploy`

Tests run automatically before every deployment.

---

## Design Principles

- **Heads-up design** — the TV is the game. The phone is just a controller.
- **Zero friction** — no login, no app install, instant join via room code.
- **Clear start and end** — games have a defined arc, no infinite loops.

---

## For Developers

Agent instructions, workflows, and design specs live in `.agents/`:

```
.agents/
  AGENTS.md                     → Rules every AI agent follows
  design_guide.md               → UI/design system reference
  timeline_game_guide.md        → Timeline game complete spec
  workflows/
    after-code-change.md        → Run after every code change
    add-new-game.md             → Guide for adding a new game
  skills/
    approve-tests/              → Approval test snapshot workflow
```
