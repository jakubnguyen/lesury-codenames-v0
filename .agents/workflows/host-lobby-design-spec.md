# Host Lobby Screen — Design Specification

This document defines the standard design for all **host lobby screens** across every game on the Lesury platform. Use this as the reference when implementing or reviewing any `<Name>Host.tsx` component's lobby/setup view.

The canonical reference implementation is [`TheLineHost.tsx`](../apps/web/components/games/the-line/TheLineHost.tsx) — specifically its `game.status === 'setup'` render branch.

The design uses the **Lesury_Main theme** (shadcn), installed via:
```bash
npx shadcn@latest add https://tweakcn.com/r/themes/cmmfbqrgi000004jscwige8ey
```

---

## Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  bg-background  full-screen, centered         🌙 ← fixed br     │
│                                                                  │
│  [lesury logo] ← absolute top-left                               │
│                                                                  │
│              [Game Title]   ← shared heading above panels        │
│                                                                  │
│  ┌──────────────────────┐    ┌──────────────────────────────┐   │
│  │   LEFT PANEL         │    │   RIGHT PANEL                │   │
│  │   bg-card            │    │   bg-card                    │   │
│  │   rounded-xl         │    │   rounded-xl                 │   │
│  │   shadow-2xl         │    │   shadow-2xl                 │   │
│  │   flex-1             │    │   flex-1                     │   │
│  │                      │    │                              │   │
│  │  "Scan to join"      │    │  "Set up game"               │   │
│  │  [QR Code]           │    │  [Settings]                  │   │
│  │  [Room Code]         │    │  [Start Game Button]         │   │
│  │  [Player List]       │    │                              │   │
│  └──────────────────────┘    └──────────────────────────────┘   │
│                              max-w-5xl, gap-8                    │
└──────────────────────────────────────────────────────────────────┘
```

- Outer wrapper: `min-h-screen bg-background flex flex-col items-center justify-center p-6 gap-4 relative`
- **Lesury logo + home link** (absolute, top-left): `absolute top-6 left-6 flex items-center gap-2 hover:opacity-80 transition-opacity` — 32×32px logo image + `text-lg font-bold text-foreground` "lesury" text, both wrapped in `<Link href="/">`
- **Shared heading** (above the two panels): `text-3xl font-bold text-foreground text-center` → game title
- Inner wrapper: `flex gap-8 max-w-5xl w-full`
- Each panel: `flex-1 bg-card rounded-xl p-8 shadow-2xl flex flex-col`
- Both panels animate in: `initial={{ opacity: 0, x: ±20 }} animate={{ opacity: 1, x: 0 }}`
- **ThemeToggle** is provided globally via `ThemeProvider` as `fixed bottom-4 right-4 z-50` — do **not** add a separate toggle inside the lobby component.

---

## Left Panel — Join Info

### 1. QR Code
- Label above: `text-muted-foreground text-center text-base mb-4` → `"Scan to join"`
- `<canvas>` element, **250×250 px**, `rounded-md`, centered, wrapped in `flex justify-center mb-6`
- Generated via `qrcode` library: `generateRoomUrl('<game>', room.roomCode, window.location.origin)`
- **QR colours must use hex values** keyed to `resolvedTheme` (from `useTheme()`). The canvas renderer does **not** support oklch:
  ```ts
  const qrColors = resolvedTheme === 'dark'
      ? { dark: '#F0EFEA', light: '#2E2E2C' }   // ≈ --foreground / --card dark
      : { dark: '#191917', light: '#FFFFFF' };   // ≈ --foreground / --card light
  ```
- margin: `2`, width: `250`
- Add `resolvedTheme` to the `useEffect` dependency array so the QR regenerates on theme switch.

### 2. Room Code
- Container: `bg-background rounded-md p-4 mb-6 text-center border border-border`
- Small label: `text-xs text-muted-foreground mb-1` → `"Room Code"`
- Code: `text-4xl font-bold tracking-widest text-foreground tabular-nums`

### 3. Player List
- Label: `text-sm font-bold text-foreground mb-2` → `"Players (N)"`
- **Empty state:** `text-muted-foreground text-sm` → `"Waiting for players to join…"`
- **Each player row:** `bg-background px-3 py-2 rounded-md text-sm font-bold text-foreground flex items-center gap-2 border border-border`
  - Avatar emoji: `text-lg`
  - Name: `flex-1`
  - Kick button: `✕` — `text-muted-foreground hover:text-destructive transition-colors text-lg px-1`; show `confirm()` dialog before sending `{ type: 'kick', playerId }`

---

## Right Panel — Game Configuration

### 1. Subtitle
- `text-muted-foreground text-center text-base mb-8` → `"Set up game"`
- _(The game title lives above both panels as the shared heading — do **not** repeat it here.)_

### 2. Settings Controls
Game-specific. Two common patterns:

**Option Group (e.g. category selector):**
- Section label: `text-sm font-bold text-foreground mb-2`
- Grid: `grid grid-cols-2 gap-2`
- Inactive button: `bg-background text-foreground border border-border hover:bg-secondary px-4 py-3 rounded-md font-bold text-sm transition-all`
- Active button: `bg-accent text-accent-foreground shadow-md px-4 py-3 rounded-md font-bold text-sm`

**Slider (e.g. rounds):**
- Label: `text-sm font-bold text-foreground mb-2`, live value in `text-accent tabular-nums`
- Range input: `w-full accent-[var(--ring)]`
- Min/max labels: `flex justify-between text-xs text-muted-foreground mt-1`

### 3. Spacer
`<div className="flex-1" />` — pushes Start button to the bottom

### 4. Start Game Button
Last element in the right panel. No emojis in the label.

- **Active** (≥1 player): `w-full bg-accent text-accent-foreground px-6 py-4 rounded-md font-bold text-lg hover:opacity-90 transition-opacity cursor-pointer`
- **Disabled** (0 players): `w-full bg-muted text-muted-foreground px-6 py-4 rounded-md font-bold text-lg cursor-not-allowed`
- Label: `"Start Game (N players)"` when active, `"Start Game"` when 0 players
- Sends `{ type: 'start_game', ...gameSettings }` on click

---

## Design Tokens (from Lesury_Main theme)

| Token | Light value | Dark value | Usage |
|-------|-------------|------------|-------|
| `--background` | `oklch(0.982 0.005 95)` ≈ warm off-white | `oklch(0.191 0.002 107)` ≈ near-black | Page bg |
| `--card` | `oklch(1.000 0 0)` = white | `oklch(0.235 0.002 107)` ≈ dark card | Panel bg |
| `--foreground` | `oklch(0.191 0.002 107)` ≈ near-black | `oklch(0.982 0.005 95)` ≈ near-white | All text |
| `--muted-foreground` | `oklch(0.750 0.013 96)` ≈ mid-grey | `oklch(0.750 0.013 96)` ≈ warm light | Labels, hints |
| `--border` | `oklch(0.924 0.014 97)` ≈ warm grey | `oklch(0.284 0.004 107)` ≈ dark border | Dividers |
| `--accent` | `oklch(0.672 0.131 39)` ≈ terracotta | `oklch(0.672 0.131 39)` ≈ **terracotta** | Active selection, Start button |
| `--accent-foreground` | `white` | `white` | Text on accent |
| `--muted` | `oklch(0.952 0.007 97)` | `oklch(0.284 0.004 107)` | Disabled bg |
| `--secondary` | `oklch(0.952 0.007 97)` | `oklch(0.284 0.004 107)` | Hover bg for inactive buttons |
| `--ring` | `oklch(0.672 0.131 39)` ≈ terracotta | `oklch(0.672 0.131 39)` ≈ terracotta | Focus ring, slider thumb |
| `--radius` | `0.75rem` | `0.125rem` (sharp in dark) | `rounded-md` = `calc(var(--radius) - 2px)` |

> **Font:** `Source Code Pro, monospace` — applied globally. All text inherits this; no need to specify `font-mono` explicitly.

> **Shadows:** Very subtle, 1px teal-tinted offset. Use `shadow-2xl` for panels (matches the theme's shadow-2xl token). Do not use heavy drop shadows.

---

## Notes for Implementation

- The lobby supports **both light and dark mode** — always use CSS design tokens (`bg-background`, `bg-card`, `text-foreground`, etc.), never hardcode hex values in Tailwind classes.
- In dark mode `--accent` = terracotta `oklch(0.672 0.131 39)` — this is the same brand colour used across the platform.
- **QR code colours**: Do NOT use CSS variable strings or `getComputedStyle`. The `qrcode` canvas renderer does not support oklch. Use explicit hex values keyed to `resolvedTheme` (see QR Code section above).
- Kick player sends `{ type: 'kick', playerId }` via the party socket; show a `confirm()` dialog first.
- Start Game sends `{ type: 'start_game', ...gameSettings }` and the server must set `this.state.room.status = 'playing'`.
- Use `motion.div` (framer-motion) for the slide-in animation on both panels.
- **Do not add a ThemeToggle inside the lobby component.** It is provided globally by `ThemeProvider` at `fixed bottom-4 right-4`.

---

## Per-Game Customisation

The **Left panel is identical across all games.** Only the Right panel settings change:

| Game | Settings |
|------|----------|
| The Line | Category selector (2-col grid) + Rounds slider (3–10) |
| Zoom-Out | Rounds slider (1–N) + "Image set" description (no spoilers) |
| _New game_ | Up to 2 controls max — keep it clean |
