---
name: approve-tests
description: Use this skill to review and approve game-logic test snapshots after a behavior change. Run after any change to packages/game-logic that causes approval tests to produce new received files.
---

# Approve Tests Skill

Use this skill when:

- `npm run test` fails due to snapshot mismatches (`.received.txt` ≠ `.approved.txt`)
- You intentionally changed game logic and need to promote the new snapshots
- The developer has confirmed the new behavior is correct

## Step 1: Run tests and capture the diff

```bash
cd /home/clickout/Projekty/lesury/packages/game-logic && npm test 2>&1
```

Read the output carefully. The `nodediff` reporter prints a colored diff for each mismatch.

## Step 2: Decide — bug or intended change?

| Situation                                             | Action                                                 |
| ----------------------------------------------------- | ------------------------------------------------------ |
| The new output looks **correct** (intentional change) | Proceed to Step 3                                      |
| The new output looks **wrong** (regression/bug)       | Fix the code, DO NOT promote — go back to Step 1       |
| **Unsure**                                            | Ask the developer to review the diff before proceeding |

## Step 3: Promote received → approved

Run the promotion script:

```bash
/home/clickout/Projekty/lesury/.agents/skills/approve-tests/scripts/approve.sh
```

Or promote specific tests only (safer for targeted changes):

```bash
# Promote a single test
cp packages/game-logic/src/games/timeline/__tests__/<testname>.received.txt \
   packages/game-logic/src/games/timeline/__tests__/<testname>.approved.txt
```

## Step 4: Verify tests now pass

```bash
cd /home/clickout/Projekty/lesury/packages/game-logic && npm test 2>&1 | tail -8
```

All tests must show ✓ before finishing.

## Important rules

- **Never** promote snapshots without reading the diff first
- **Never** promote if you're unsure — ask the developer
- `.received.txt` files must never be committed to git (they're in `.gitignore`)
- `.approved.txt` files ARE committed — they're the source of truth
