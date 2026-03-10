#!/usr/bin/env bash
# Promotes all .received.txt files to .approved.txt for all game-logic tests.
# Run this after intentionally changing game logic and confirming the new behavior is correct.

set -e

GAME_LOGIC_DIR="/home/clickout/Projekty/lesury/packages/game-logic/src"
PROMOTED=0

for received in "$GAME_LOGIC_DIR"/**/__tests__/*.received.txt; do
    if [ -f "$received" ]; then
        approved="${received/.received.txt/.approved.txt}"
        echo "  Approving: $(basename "$approved")"
        cp "$received" "$approved"
        PROMOTED=$((PROMOTED + 1))
    fi
done

if [ "$PROMOTED" -eq 0 ]; then
    echo "No .received.txt files found. Tests are already in sync."
else
    echo ""
    echo "✓ Promoted $PROMOTED snapshot(s). Run 'npm test' to verify."
fi
