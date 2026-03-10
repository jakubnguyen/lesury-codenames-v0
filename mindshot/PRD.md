# Mindshot — Product Requirements Document

## 1. Overview

**Mindshot** is a turn-based tactical board game for 2–4 players, played on a shared TV/host screen with individual phone controllers. Players move and shoot on a grid (configurable size: 8×8, 10×10, or 12×12) while a shrinking danger zone forces them closer together. The last player standing wins.

The game fits into the existing Lesury platform alongside games like The Line, Guessio, and Timeline. It uses the same host/player split, PartyKit real-time infrastructure, and lobby system.

---

## 2. Game Identity

| Property        | Value                                |
|-----------------|--------------------------------------|
| Internal name   | `mindshot`                      |
| Display name    | Mindshot                        |
| Players         | 2–4                                  |
| Avg. game time  | 5–10 minutes                         |
| Genre           | Tactical / Strategy / Elimination    |
| Devices         | Host = TV/laptop, Players = phones   |

---

## 3. Core Concepts

### 3.1 Grid

A square grid with **configurable size**, chosen by the host before starting the game. Each cell is identified by `(row, col)` where `(0, 0)` is the top-left corner.

| Arena size | Grid   | Total cells | Zone shrink/round | ~Rounds to fill | Character                              |
|------------|--------|-------------|-------------------|-----------------|----------------------------------------|
| **Small**  | 8×8    | 64          | 6 cells           | ~11             | Fast, intense — action starts immediately |
| **Medium** | 10×10  | 100         | 9 cells           | ~11             | Balanced (default)                     |
| **Large**  | 12×12  | 144         | 13 cells          | ~11             | Strategic — more room to maneuver      |

The zone shrink count scales proportionally with the grid area (`boardSize² / 11`, rounded) so the game length stays consistent at **~11 rounds** regardless of arena size.

Every cell is in one of three states:

| State      | Color  | Meaning                                                        |
|------------|--------|----------------------------------------------------------------|
| **Safe**   | Neutral| No danger. Players can stand here without penalty.             |
| **Warning**| Orange | Will become danger next round. Visual warning only, no damage. |
| **Danger** | Red    | Standing here at end of round costs 1 HP.                      |

### 3.2 Players

Each player has:

- **Position** `(row, col)` — current cell on the grid.
- **HP** — starts at **3**. At 0 HP the player is eliminated.
- **Color** — unique player color (blue, green, purple, yellow), assigned randomly at game start.
- **Name** — entered at join time.
- **Status** — `alive` | `eliminated`.

### 3.3 Projectile

A projectile is a one-time straight-line shot fired by a player. It travels from the player's current cell in the chosen direction until it either hits a player or exits the grid. A hit deals **1 HP** damage.

---

## 4. Game Setup

1. Host creates a room via `/host?game=mindshot` (or directly at `/games/mindshot/host`).
2. Players join via `/join`, enter room code and name.
3. Host sees all connected players in the lobby.
4. Host presses **Start Game** (minimum 2 players required).
5. Each player is placed at a **random safe cell** with no two players sharing the same starting cell. Minimum starting distance (Manhattan) scales with arena size: **2 cells** (Small), **3 cells** (Medium), **4 cells** (Large).
6. The grid starts with **all cells safe** (no danger, no warning).

---

## 5. Round Structure

Each round follows five sequential phases. All player actions are decided secretly during the Planning Phase before any resolution occurs.

```
┌─────────────────────────────────────────────────────┐
│  PLANNING ──▸ MOVE 1 ──▸ MOVE 2 ──▸ SHOOT ──▸ ZONE │
└─────────────────────────────────────────────────────┘
```

### 5.1 Planning Phase

**Duration:** 20 seconds (configurable by host: 15 / 20 / 30 seconds).

Each player **secretly** selects on their phone:

- **Move 1:** one cardinal direction (Up / Down / Left / Right) **or Stay**
- **Move 2:** one cardinal direction (Up / Down / Left / Right) **or Stay**
- **Shoot direction:** one cardinal direction (Up / Down / Left / Right) **or Skip** (no shot)

The map is visible only on the host TV / other device.
The players see only the controls on their phone together with the time of the round running up.

Once a player confirms their choices, they tap **Lock In**. Their status changes to "Ready" on the host screen. **Players can change their choices until they lock in or the timer expires.**

If a player **does not lock in** before the timer runs out, their actions default to: **Stay, Stay, Skip** (no movement, no shot).

Once all players have locked in (or the timer expires), the host screen transitions to the Resolution Phase.

### 5.2 Move 1 Phase (Resolution)

All players' **first move** resolves simultaneously:

- Each player moves 1 cell in their chosen direction.
- If the move would go **off the grid**, the player stays in place (move is wasted).
- **Multiple players can occupy the same cell.** There is no collision.

**Host animation:** All player tokens slide to their new positions at the same time (~0.5s per tile).

### 5.3 Move 2 Phase (Resolution)

Identical rules to Move 1, using each player's **second move** choice.

**Host animation:** Same as Move 1.

### 5.4 Shoot Phase (Resolution)

All players' **shots** resolve simultaneously:

- From each player's **current position** (after both moves), a projectile is fired in the chosen direction.
- The projectile travels in a straight line through cells one by one.
- It **hits the first player** it encounters along the path.
- A hit deals **1 HP** damage to the target.
- If no player is in the path, the projectile exits the grid (no effect).
- **A player cannot hit themselves.**
- If a player chose **Skip**, no projectile is fired.

**Simultaneous resolution detail:** All shots are calculated based on everyone's **post-movement positions**, before any damage is applied. This means if Player A and Player B shoot each other, **both take damage** — one shot does not cancel the other.

**Host animation:** Projectiles animate sequentially (one player at a time) for visual clarity, each projectile traveling at ~0.3s per tile. Hit effects (flash, HP decrement) are shown upon impact.

### 5.5 Zone Phase (Resolution)

Three things happen in order:

1. **Activation:** All cells currently in **Warning** (orange) state become **Danger** (red).
2. **New warnings:** A set of new cells are marked as **Warning** (orange).
3. **Zone damage:** Any alive player standing on a **Danger** (red) cell takes **1 HP** damage.

**Zone shrink pattern:**

The zone shrinks inward from the borders, simulating a battle royale ring:

- The number of cells turned to warning each round depends on arena size: **6** (Small 8×8), **9** (Medium 10×10), **13** (Large 12×12). See Section 3.1 for the full table.
- The algorithm selects cells from the outermost ring of remaining safe cells.
- "Outermost ring" = the safe cells that are closest to any grid edge or to an existing danger cell.
- Cells are picked **randomly** from the outermost ring. If fewer cells are available in the outermost ring than needed, remaining picks come from the next ring inward.
- This guarantees the playable area shrinks consistently toward the center.

**Edge case:** If fewer safe cells remain than the shrink count, all of them become warning cells. The game will resolve naturally as players run out of safe space.

### 5.6 End-of-Round Check

After the Zone Phase:

1. **Eliminate** all players with 0 HP. Show elimination announcement on host screen.
2. **Win check:**
   - If exactly 1 player remains alive → that player **wins**.
   - If 0 players remain alive (mutual elimination) → the game is a **draw**.
   - If 2+ players remain → **next round** begins.

---

## 6. Detailed Mechanics

### 6.1 Damage Sources

| Source         | Damage | When applied                             |
|----------------|--------|------------------------------------------|
| Projectile hit | 1 HP   | Shoot Phase (after all shots calculated) |
| Danger zone    | 1 HP   | Zone Phase (after zone update)           |

Damage stacks: a player can take projectile damage AND zone damage in the same round, losing 2 HP total.

### 6.2 Elimination

- A player is eliminated when their HP reaches **0**.
- Elimination takes effect **at the end of the round** (after zone damage), not mid-phase.
- An eliminated player's token is removed from the grid and they become a **spectator**.
- Eliminated players can still watch the game on their phone (read-only grid view).

### 6.3 Movement Rules

| Scenario                                     | Result                              |
|----------------------------------------------|-------------------------------------|
| Move into a safe cell                        | Player moves there                  |
| Move into a warning (orange) cell            | Player moves there (no damage yet)  |
| Move into a danger (red) cell                | Player moves there (damage at end)  |
| Move off the grid edge                       | Player stays in place               |
| Two players move into the same cell           | Both occupy it (no collision)       |
| Player chooses "Stay"                        | Player does not move                |

### 6.4 Shooting Rules

| Scenario                                           | Result                              |
|----------------------------------------------------|-------------------------------------|
| Shoot in a direction with a player in line of sight | First player in path takes 1 HP    |
| Shoot in a direction with no player in path         | Projectile exits grid, no effect   |
| Two players shoot each other simultaneously         | Both take 1 HP damage              |
| Player chooses "Skip"                              | No projectile fired                |
| Eliminated player (0 HP this round)                 | Their shot still resolves this round|

---

## 7. Landing Page (`/games/mindshot`)

The landing page follows the standard Lesury game page layout (same pattern as The Line, Guessio, etc.):

- **Hero section (left):**
  - Animated visual: a small grid with colored tokens moving and a shrinking red border (subtle motion graphics).
  - Title: "Mindshot".
  - Tagline: "Move, shoot, survive. Last player standing wins on a shrinking battlefield."
  - **Buttons** (order depends on device detection — desktop prioritizes Host, mobile prioritizes Join):
    - "Host Mindshot" → links to `/host?game=mindshot`.
    - "Join a Game" → links to `/join`.

- **How to Play section (right):**
  1. The host picks arena size and round timer, then starts the game.
  2. Each round, secretly choose 2 moves and 1 shot direction on your phone.
  3. Watch the action unfold on the TV — moves, shots, and zone damage resolve automatically.
  4. Avoid the shrinking red danger zone — it costs 1 HP per round!
  5. Last player with HP remaining wins the match.

---

## 8. Host Screen (TV) — UX Specification

The host screen is the main visual display, shown on a TV or laptop screen visible to all players.

### 8.1 Lobby State

Standard Lesury lobby layout:

- Room code displayed prominently.
- QR code for quick join.
- List of connected players with their chosen colors.
- "Start Game" button (enabled when 2–4 players connected).
- Game settings panel:
  - **Timer:** 15 / 20 / 30 seconds (default: 20s).
  - **Arena:** Small 8×8 / Medium 10×10 / Large 12×12 (default: Medium).

### 8.2 Game — Planning State

- **Grid:** Board displayed centrally (8×8 / 10×10 / 12×12 depending on the chosen arena size). Each cell shows its state (safe = neutral, warning = orange pulsing, danger = red).
- **Player tokens:** Colored circles (or icons) on the grid showing each player's position.
- **Player HUD:** A bar along the bottom or side showing each player's: name, color, HP (as hearts or pips), and ready status (checkmark when locked in).
- **Timer:** Large countdown timer visible to all. When it reaches 5 seconds, it turns red and pulses.
- **Round counter:** "Round 3" displayed in a corner.
- **Phase label:** "Planning Phase — Pick your moves!" displayed prominently.

### 8.3 Game — Resolution State

- **Phase label** updates to show the current phase: "Move 1", "Move 2", "Shoot", "Zone".
- **Move animations:** Player tokens slide smoothly to new positions (~0.5s per tile). All players animate simultaneously.
- **Shoot animations:** One player's shot at a time. A projectile (small colored dot/line) travels from the shooter in the chosen direction. On hit: target flashes, damage number appears (-1), HP updates in the HUD. On miss: projectile fades at grid edge.
- **Zone animations:** Orange cells pulse and glow. Red cells have a solid red fill with a subtle dark pattern. New orange cells fade in with a warning animation.
- **Damage announcements:** Floating text: "Player hit by Player!" or "Player caught in the zone!"
- **Elimination announcement:** Dramatic effect — "Player ELIMINATED!" in large text with the player's token fading out.

### 8.4 Game Over State

- **Winner announcement:** "Player WINS!" with celebratory animation (confetti or similar).
- **Draw announcement:** "DRAW — No survivors!" if all remaining players die simultaneously.
- **Final stats panel:**
  - Each player's: name, placement (1st–4th), rounds survived, damage dealt, damage taken.
- **Buttons (host only):** "Play Again" (resets game state, same players stay connected, new random positions) and "Back to Lobby".

---

## 9. Player Screen (Phone) — UX Specification

The player screen is a mobile-optimized controller view on each player's phone.

### 9.1 Lobby State

Standard Lesury player lobby — "Waiting for host to start..."

### 9.2 Game — Planning State

The player uses a **"Command Queue"** interaction pattern: a single D-pad used three times in sequence to program their entire turn. This avoids the clutter of three separate controls and feels intuitive — like programming your moves step by step.

#### Layout (top to bottom):

```
┌──────────────────────────────┐
│  ❤️❤️❤️  Round 3      00:14  │  ← status bar + timer
│                              │
│ [→ Move1] [↑ Move2] [? Shoot] │  ← command queue slots
│                        ▲     │
│                   active slot │
│                              │
│         [ ↑ ]                │
│     [←] [STAY] [→]          │  ← single D-pad
│         [ ↓ ]                │
│                              │
│      [ 🔒 LOCK IN ]         │  ← confirm button
└──────────────────────────────┘
```

#### Components:

1. **Status bar:** Player name, HP (as hearts), round number, countdown timer. Timer turns red and pulses when under 5 seconds.

2. **Command queue** — three slots in a horizontal row:
   - **Slot 1:** labeled "Move 1" (with a 🏃 icon).
   - **Slot 2:** labeled "Move 2" (with a 🏃 icon).
   - **Slot 3:** labeled "Shoot" (with a 🎯 icon).
   - **Slot states:**
     - *Empty:* grey background with `?` placeholder.
     - *Active (currently being selected):* highlighted border, subtle pulse animation.
     - *Filled:* shows a directional arrow icon (↑↓←→) or "STAY"/"SKIP" in the player's color, with a subtle "pop" scale animation on fill.
   - Tapping a filled slot re-activates it for editing — the D-pad will overwrite that slot's value, then auto-advance to the next unfilled slot.

3. **D-pad** — a single cross-shaped controller, centered on screen:
   - Four directional buttons: Up, Down, Left, Right.
   - Center button changes label based on the active slot:
     - For Move slots: **"STAY"**.
     - For Shoot slot: **"SKIP"**.
   - When the player taps a direction (or center):
     1. The active slot fills with the chosen direction.
     2. A brief "pop" animation plays on the slot.
     3. The D-pad auto-advances focus to the next empty slot.
     4. If all slots are filled, focus moves to the Lock In button.
   - The D-pad is large and touch-friendly — buttons are at least 48×48px tap targets.

4. **Lock In button:**
   - Full-width button at the bottom of the screen.
   - **Disabled** (greyed out) until all three slots are filled.
   - **Enabled** state: prominent accent color, reads "LOCK IN".
   - On tap: changes to "LOCKED IN ✓" with a green checkmark, D-pad and slots become non-interactive (dimmed).
   - **Unlock:** tapping the "LOCKED IN ✓" button again reverts to editable state (only if the timer hasn't expired). All slots remain filled and can be re-edited.

#### Interaction flow example:

1. Player opens the planning screen. Slot "Move 1" is active (pulsing border). D-pad center reads "STAY".
2. Player taps Right → Slot "Move 1" fills with `→` (pop animation), auto-advances to "Move 2".
3. Player taps Up → Slot "Move 2" fills with `↑`, auto-advances to "Shoot". D-pad center label changes to "SKIP".
4. Player taps Left → Slot "Shoot" fills with `←`. All slots filled → Lock In button activates.
5. Player taps Lock In → Actions submitted to server, UI dims to read-only.
6. (Optional) Player taps "LOCKED IN ✓" to unlock, taps Slot "Move 2" to re-select it, picks a new direction, re-locks.

#### Default behavior on timer expiry:

- Unfilled slots default to: **Stay** (moves) / **Skip** (shoot).
- Filled but unlocked actions are auto-submitted as-is.

### 9.3 Game — Resolution State

The player's phone switches to a **spectator view** during resolution:

- Text log of events: "You moved Up", "You shot Left — hit Player!", "Zone damage: -1 HP".
- Player cannot interact during this phase.

### 9.4 Eliminated State

- Message: "You have been eliminated! (Xth place)"
- Read-only event log continues showing game events as they happen.
- Player remains connected and can watch until the game ends.

### 9.5 Game Over State

- Shows placement: "You finished 2nd!"
- Final stats (same as host screen).
- "Back to Lobby" button.

---

## 10. Visual Design Guidelines

### 10.1 Grid

- Clean, square cells with subtle borders.
- **Safe cells:** Light/neutral background (`bg-card` or similar).
- **Warning cells:** Animated orange pulse (`bg-orange-400` with CSS animation).
- **Danger cells:** Solid red with a subtle hazard pattern (`bg-red-600`).

### 10.2 Player Tokens

- Colored circles with the player's initial letter.
- Colors: Blue (`#3B82F6`), Green (`#22C55E`), Purple (`#A855F7`), Yellow (`#EAB308`).
- Dead players: grayscale token, faded out.

### 10.3 Projectiles

- Small glowing dot in the shooter's color.
- Trail effect behind the projectile.
- Hit effect: brief flash on the target cell.

### 10.4 Theme

- Follows the existing Lesury design system (Tailwind + shadcn/ui).
- Dark theme for the game board (better contrast for colored elements).
- Uses Framer Motion for all animations.

---

## 11. Game State Shape

This defines the structure stored in `packages/game-logic` and synced via PartyKit.

```typescript
type Phase =
  | 'lobby'
  | 'planning'
  | 'resolution-move1'
  | 'resolution-move2'
  | 'resolution-shoot'
  | 'resolution-zone'
  | 'round-summary'
  | 'game-over';

type Direction = 'up' | 'down' | 'left' | 'right';

type CellState = 'safe' | 'warning' | 'danger';

type ArenaSize = 'small' | 'medium' | 'large';

interface ArenaConfig {
  size: ArenaSize;
  boardSize: 8 | 10 | 12;
  shrinkCount: 6 | 9 | 13;
  minStartDistance: 2 | 3 | 4;
}

interface PlayerActions {
  move1: Direction | 'stay';
  move2: Direction | 'stay';
  shoot: Direction | 'skip';
}

interface MindshotPlayer {
  id: string;
  name: string;
  color: 'blue' | 'green' | 'purple' | 'yellow';
  position: { row: number; col: number };
  hp: number;
  maxHp: number;
  status: 'alive' | 'eliminated';
  actions: PlayerActions | null;    // null = not yet submitted
  lockedIn: boolean;
  stats: {
    damageDealt: number;
    damageTaken: number;
    roundsSurvived: number;
    eliminations: number;
  };
}

interface MindshotGameState {
  phase: Phase;
  round: number;
  arena: ArenaConfig;                  // chosen arena size & derived params
  grid: CellState[][];                 // boardSize × boardSize array
  players: MindshotPlayer[];
  planningTimer: number;               // seconds remaining
  planningDuration: 15 | 20 | 30;     // configurable
  roundEvents: RoundEvent[];           // events from last resolution
  placements: string[];                // player IDs in elimination order
  winner: string | null;               // player ID or null if draw/ongoing
}

type RoundEvent =
  | { type: 'move'; playerId: string; direction: Direction | 'stay'; phase: 'move1' | 'move2'; from: Position; to: Position }
  | { type: 'shoot'; playerId: string; direction: Direction | 'skip'; hit: string | null }
  | { type: 'damage'; playerId: string; source: 'projectile' | 'zone'; amount: number; newHp: number }
  | { type: 'elimination'; playerId: string; placement: number }
  | { type: 'zone-warning'; cells: Position[] }
  | { type: 'zone-activate'; cells: Position[] };

interface Position {
  row: number;
  col: number;
}
```

---

## 12. Message Protocol

Messages sent between client and server via PartyKit WebSocket.

### Player → Server

| Message                        | When                    |
|-------------------------------|-------------------------|
| `{ type: 'submit_actions', actions: PlayerActions }` | Player locks in during planning |
| `{ type: 'unlock_actions' }`  | Player unlocks before timer expires |

### Server → All Clients (via `sync`)

The server broadcasts the full `MindshotGameState` after every state change, following the existing `{ type: 'sync', room, game }` pattern.

### Server → Server (internal triggers)

| Trigger                                | Action                                    |
|---------------------------------------|------------------------------------------|
| All players locked in                 | End planning early, start resolution     |
| Planning timer expires                | Default missing actions, start resolution |
| Resolution animation complete (timed) | Advance to next resolution phase         |
| All resolution phases done            | Check eliminations, advance round or end |

**Resolution timing is server-driven:** the server advances through resolution phases on a timer (giving clients enough time to animate), rather than waiting for client ACKs. Suggested delays:

| Phase transition         | Delay  |
|--------------------------|--------|
| Planning → Move 1        | 0.5s   |
| Move 1 → Move 2         | 1.5s   |
| Move 2 → Shoot          | 1.5s   |
| Shoot → Zone             | 2.5s (depends on number of shots) |
| Zone → Round Summary     | 2.0s   |
| Round Summary → Planning | 3.0s   |

---

## 13. Technical Integration

### 13.1 File Structure

```
packages/game-logic/src/games/mindshot/
  types.ts          # MindshotGameState, messages, etc.
  logic.ts          # createInitialMindshotState(), applyMindshotMessage()
  zone.ts           # Zone shrink algorithm
  resolution.ts     # Turn resolution logic (move, shoot, damage)
  index.ts          # Re-exports

apps/web/app/games/mindshot/
  page.tsx           # Landing/info page
  host/page.tsx      # Host route
  player/page.tsx    # Player route

apps/web/components/games/mindshot/
  MindshotHost.tsx    # Main host component
  MindshotPlayer.tsx  # Main player component
  Grid.tsx                # Dynamic grid renderer (8×8 / 10×10 / 12×12)
  PlayerToken.tsx         # Animated player token on grid
  Projectile.tsx          # Animated projectile
  CommandQueue.tsx         # "Command Queue" planning UI (3 slots + D-pad)
  DPad.tsx                # Reusable D-pad cross controller
  PlayerHUD.tsx           # HP and status bar
  RoundSummary.tsx        # End-of-round event summary
  GameOver.tsx            # Final results screen

apps/server/src/games/
  mindshot.ts  # Server-side message handler
```

### 13.2 Integration Points

- **Server:** Add `mindshot` to the `gameType` union. Add `handleMindshotMessage` handler in `server.ts`. Server manages the planning timer and resolution phase progression.
- **Game logic:** Pure functions in `@lesury/game-logic`. Server calls `applyMindshotMessage()` for player actions and `advanceMindshotPhase()` for phase transitions.
- **Client:** Uses `usePartyRoom<MindshotGameState>` hook. Host renders grid + animations. Player renders the Command Queue (D-pad + slots) during planning, event log during resolution.
- **Lobby:** Uses the standard `/host?game=mindshot` → `RoomHost` → redirect flow.

---

## 14. Edge Cases & Rules Clarifications

| Scenario | Resolution |
|----------|-----------|
| Player tries to move off the grid | Move is ignored; player stays in place. |
| Two players move to the same cell | Both occupy it; no collision or damage. |
| Player shoots but is eliminated this round | Their shot still resolves (shots are simultaneous). |
| Two players eliminate each other with shots | Both are eliminated. If they were the last two, it's a draw. |
| All remaining players die to zone damage | Draw (no winner). |
| Player disconnects mid-game | Player is treated as AFK; defaults to Stay/Stay/Skip each round. After 2 consecutive AFK rounds, player is auto-eliminated. |
| Only 1 player remains before resolution | Game ends immediately; that player wins. |
| Player on warning cell at end of round | No damage (warning is informational only). |
| Player takes projectile + zone damage in same round | Both apply; player loses 2 HP. |
| Multiple projectiles hit the same player | Each deals 1 HP independently. A player can lose up to 3 HP from shots in one round (max 3 opponents). |
| Player shoots in a direction with multiple players in line | Only the **nearest** player is hit. The projectile does not pass through. |
| Timer expires with no actions selected | Defaults to Stay, Stay, Skip. |
| Timer expires with partial actions | Missing actions default to Stay (moves) or Skip (shoot). |

---

## 15. Game Balance Notes

- **HP = 3** keeps games short. A player can survive at most 3 zone ticks or 3 shots.
- **2 moves + 1 shot** gives enough mobility to dodge without making shots impossible.
- **Zone shrink scales with arena size** (6 / 9 / 13 cells per round) keeping the board fully dangerous in ~11 rounds across all sizes. With 3 HP, the absolute maximum game length is ~14 rounds.
- **Stay** as a move option adds bluffing — opponents might overshoot if they expect movement.
- **Skip** as a shot option is rarely optimal but exists for situations where no good shot is available.
- **No diagonal movement or shooting** keeps the game simple and predictable enough for strategic planning.

