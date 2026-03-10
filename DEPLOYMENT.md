# Deployment Guide

This guide covers deploying the Lesury platform to production.

## Architecture

- **Next.js App** → Vercel
- **PartyKit Server** → PartyKit Cloud (Cloudflare Workers)

---

## Prerequisites

1. **Vercel Account** - [vercel.com](https://vercel.com)
2. **PartyKit Account** - Login via `npx partykit login`
3. **GitHub Repository** - Connected to Vercel

---

## Initial Setup

### 1. Deploy PartyKit Server

```bash
cd apps/server
npx partykit login
npx partykit deploy
```

This will output your PartyKit URL, e.g., `lesury-username.partykit.dev`

**Important:** Save this URL - you'll need it for Vercel.

---

### 2. Deploy Next.js to Vercel

#### Option A: Vercel UI (Recommended)

1. Go to [vercel.com](https://vercel.com) → Import Project
2. Connect your GitHub repository
3. **Root Directory:** `apps/web`
4. **Framework Preset:** Next.js
5. **Build Command:** `cd ../.. && npx turbo run test --filter=@lesury/game-logic && npx turbo run build --filter=@lesury/web`
6. Add environment variable:
    - **Name:** `NEXT_PUBLIC_PARTYKIT_HOST`
    - **Value:** `lesury-username.partykit.dev` (from step 1)
7. Click "Deploy"

#### Option B: Vercel CLI

```bash
cd apps/web
npx vercel --prod
# Follow prompts, add environment variable when asked
```

---

## Automatic Deployments

### Vercel (Automatic)

Once connected to GitHub, Vercel automatically deploys on every push to `main`.

### PartyKit (Manual or CI/CD)

#### Manual Deployment

```bash
npm run deploy
```

This runs `turbo run deploy`, which deploys the PartyKit server.

#### Automatic via GitHub Actions

Create `.github/workflows/deploy-partykit.yml`:

```yaml
name: Deploy PartyKit

on:
    push:
        branches: [main]
        paths:
            - 'apps/server/**'
            - 'packages/game-logic/**'

jobs:
    deploy:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4
            - uses: actions/setup-node@v4
              with:
                  node-version: '20'
            - run: npm install
            - run: npm run test
            - run: npm run deploy
              env:
                  PARTYKIT_TOKEN: \${{ secrets.PARTYKIT_TOKEN }}
```

**Setup:**

1. Get PartyKit token: `npx partykit token`
2. Add to GitHub Secrets: `PARTYKIT_TOKEN`

---

## Environment Variables

### Production

| Variable                    | Where  | Value                                                    |
| --------------------------- | ------ | -------------------------------------------------------- |
| `NEXT_PUBLIC_PARTYKIT_HOST` | Vercel | Your PartyKit URL (e.g., `lesury-username.partykit.dev`) |

### Local Development

No environment variables needed - defaults to `localhost:1999`.

---

## Verification

### Test Production Deployment

1. Open your Vercel URL
2. Navigate to `/demo`
3. Check connection status (should be green)
4. Open in second tab/device
5. Verify real-time sync

### Debugging

**Problem:** Demo page shows "connecting" forever

**Solution:**

- Check PartyKit deployment: `npx partykit list`
- Verify `NEXT_PUBLIC_PARTYKIT_HOST` in Vercel settings
- Check browser console for WebSocket errors

---

## Update Workflow

1. Make changes locally
2. Test with `npm run dev`
3. Run `npm run test` — fix any failures before pushing
4. Commit and push to `main`
5. **Vercel:** Auto-deploys Next.js (tests run as part of build command)
6. **PartyKit:** Run `npm run deploy` (tests run automatically via turbo) or wait for GitHub Actions

---

## Costs

- **Vercel:** Free tier includes 100GB bandwidth
- **PartyKit:** Free tier includes 1M requests/month

Both are more than sufficient for development and early production.
