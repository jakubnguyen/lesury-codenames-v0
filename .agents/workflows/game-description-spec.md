---
description: Design specification for game landing/description pages on the Lesury platform
---

# Uniform Game Description Screen Specification

This specification defines the exact structure and layout for all game landing/description pages (e.g., `/games/the-line`, `/games/mindshot`).

Every game description page MUST follow this exact two-column layout to ensure a consistent experience across the Lesury platform.

## Layout Structure

The page uses a split two-column design on desktop (`flex-row`), stacking vertically on mobile (`flex-col`). 
The content lives inside a max-width container (`max-w-[1100px]`) with vertical padding (`py-12`) and a gap between columns (`gap-10 md:gap-16`).

---

## Left Column (Hero Section)

The left side of the screen focuses on selling the game and providing the primary Call-to-Action (CTA). All elements here animate in staggered using Framer Motion.

### 1. Animated Visual Header
- **Placement**: Top of the left column.
- **Content**: A custom, CSS/Motion-based abstract animation representing the game's core mechanic. Avoid heavy video files or generic images.
- **Reference**: *The Line* uses horizontal sliding blocks on an expanding line.

### 2. Game Title (`<h1>`)
- **Styling**: `text-4xl md:text-5xl font-bold mb-2`
- **Animation**: Fade in and slide up (`y: 10` to `y: 0`).

### 3. Short Description (`<p>`)
- **Styling**: `text-foreground text-lg mb-6`
- **Content**: 1–2 sentences explaining the hook of the game. Example: *"Place events in order by weight, speed, population, and more. Can you find the right spot on the line?"*

### 4. Call-to-Action Buttons
- The order of the buttons **depends on the user's device** (using `useDeviceDetection` hook).
- **Desktop Users**:
  1. Primary Button: **Host [Game Name]** (Solid Accent Color) → Links to `/games/[name]/host`
  2. Secondary Button: **Join a Game** (Outline Variant) → Links to `/join`
- **Mobile Users**:
  1. Primary Button: **Join a Game** (Solid Accent Color) → Links to `/join`
  2. Secondary Button: **Host [Game Name]** (Outline Variant) → Links to `/games/[name]/host`
- **Loading State**: While detecting device, show a centered spinning loader.

---

## Right Column (How to Play)

The right side provides clear, step-by-step instructions on how the game works.

### 1. Header
- **Styling**: `text-lg font-bold mb-4`
- **Text**: "How to Play"

### 2. Instruction Card
- **Styling**: `bg-card rounded-2xl p-7 shadow-md`
- **Content**: A vertical list of steps. 
- **Step Layout**:
  - Each step contains: an icon (custom SVG `lucide-react` style), a number badge (`w-7 h-7 rounded-full bg-accent`), and the instruction text.
  - Steps are separated by a `<Separator className="my-4" />` (except before the first step).
  - Text styling: `text-sm text-foreground leading-snug`.

### 3. Iconography
- Every step MUST have a unique, relevant 24x24 SVG icon matching the action described (e.g., Sliders for settings, Trophy for winning).

---

## Shared Dependencies & Imports

To build this page, you MUST use the following existing components and libraries:

```tsx
import { motion } from 'framer-motion';
import Link from 'next/link';
import Header from '@/app/components/Header';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
```
