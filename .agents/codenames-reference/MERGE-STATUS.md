# Codenames Merge Status

This workspace is the new working base:
`/Users/tnguyen/Documents/Lesury_1/codenames-mvp/lesury-latest-merged`

## Base
- Latest repo snapshot from `lesury-main 2.zip`

## Carried over from the standalone Codenames MVP
- `apps/web/app/games/codenames/*`
- `apps/web/components/games/codenames/*`
- `packages/game-logic/src/games/codenames/*`

## Kept as reference only
- `.agents/codenames-reference/standalone-server.ts`
- `.agents/codenames-reference/usePartyRoom-standalone.ts`

## Important
The latest monorepo uses a shared PartyKit server and shared `usePartyRoom` hook.
The carried-over Codenames files still assume the standalone MVP message/device model.
So this merged workspace is the correct new base, but Codenames still needs proper monorepo integration before it will build and run here.
