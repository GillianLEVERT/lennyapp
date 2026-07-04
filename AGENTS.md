# Skadoush — Agent Rules

> Read this entire file before writing any code. It applies to Claude Code, Codex, and any other agent working on this repo.

---

## What this app is

**Skadoush** is a mobile-first PWA that gamifies the morning routine for children (~6 years old). Kids complete daily missions (get dressed, brush teeth, etc.) to earn points and unlock reward chests. Parents manage everything from a dedicated dashboard.

- Framework: **Next.js 16.2.4** (App Router), **React 19**
- Database: **Firebase Firestore** (real-time `onSnapshot`, no ORM)
- Auth: **Firebase Auth** (Google OAuth + Email/Password)
- Styling: **Tailwind CSS v4** (CSS-first config) for the parent dashboard, **inline `style={}` driven by `KidTheme` tokens** for the child view
- 3D: **Three.js v0.184** (direct, not React Three Fiber) in `blob-mascot-3d.tsx` and `chest-scene.tsx`
- Testing: **Vitest v4**, one test file: `lib/chest-draw.test.ts`
- Deployed on: **Vercel**

---

## File map

```
app/
  page.tsx                  — Root route → KidQuest (dynamic import, ssr: false)
  parent/page.tsx           — /parent route → ParentDashboard (dynamic import, ssr: false)
  layout.tsx                — Root layout: fonts, AuthProvider, PwaRegistration
  globals.css               — Tailwind v4 + CSS design tokens (:root) + keyframes
  fonts.ts                  — 5 Google Font families as CSS variables
  manifest.ts               — PWA manifest

components/
  kid-quest.tsx             — MAIN child view (~1800 lines): tabs, game logic, Firebase subs
  parent/parent-dashboard.tsx — MAIN parent view (~1700 lines): CRUD for children/missions/rewards
  skad-ui.tsx               — Theme-driven UI primitives (Pill, Card, ProgressBar, Btn, Counter…)
  blob-mascot.tsx           — SVG animated mascot with character hats
  blob-mascot-3d.tsx        — Three.js 3D version of mascot
  chest-scene.tsx           — Three.js 3D chest-opening animation (~900 lines)
  auth-provider.tsx         — Firebase Auth context + useAuth hook
  child-avatar.tsx          — Avatar display (photo dataURL or emoji fallback)
  confetti-burst.tsx        — CSS confetti explosion
  sound-picker.tsx          — Parent-facing sound selector (presets + mic recording)
  pwa-registration.tsx      — Service worker registration

lib/
  firebase.js               — Firebase app init (auth, db, googleProvider) — plain JS
  firestore-schema.js       — Firestore write helpers — plain JS (upsertParent, addChild, addMission, addReward, seedStarterKit, resetDailyMissions)
  firestore-data.ts         — Subscriptions + mutations + transactions — typed TS, re-exports from gamification + schema
  gamification.ts           — Pure business logic: streak tiers, chest costs, anti-repeat reward draw (NO Firebase dep)
  themes.ts                 — 3 themes (Jelly/Arcade/Cosmic), 4 characters, color utilities, resolveKidTheme()
  feedback.ts               — Web Audio API sound synthesis + Vibration API haptics
  media.ts                  — Browser image compression + blob-to-dataURL
  presets.ts                — Static suggested missions/rewards for onboarding

public/
  sw.js                     — Service worker (cache-first navigation, network-first assets)

DESIGN.md                   — Structured visual spec (colors, typography, components)
ClaudeDesign/               — Design reference prototypes — NOT bundled, not relevant to runtime
```

---

## Architecture rules (read carefully)

### 1. Firebase is 100% client-side — never import it server-side

Both `app/page.tsx` and `app/parent/page.tsx` use `dynamic(..., { ssr: false })`. `AuthProvider` lazy-imports Firebase via `Promise.all([import(...)])`. This is intentional and must be preserved.

**Never** add a Firebase import to a Server Component or to any file that runs during SSR.

### 2. Two parallel styling systems — intentional

| Area | System | Why |
|------|---------|-----|
| Parent dashboard | Tailwind CSS classes | Standard layout, no runtime theme switching |
| Child view (kid-quest + skad-ui) | Inline `style={}` from `KidTheme` token object | Runtime theme switching requires inline styles |

When modifying child UI, use `KidTheme` tokens passed as `ui` prop to `skad-ui` primitives.  
When modifying parent UI, use Tailwind classes + CSS variables from `globals.css`.  
Do not mix the two systems.

### 3. Data flow

1. `AuthProvider` → holds `User | null` from Firebase Auth
2. `KidQuest` / `ParentDashboard` → subscribe via `onSnapshot` from `lib/firestore-data.ts`
3. Mutations → always through `lib/firestore-data.ts` (uses Firestore transactions for atomicity)
4. Gamification logic → `lib/gamification.ts` (pure functions, no Firebase, tested in Vitest)
5. Theme → parent picks in dashboard → stored in Firestore → loaded by child → `resolveKidTheme()` → `KidTheme` object → passed as `ui` to all `skad-ui` primitives

### 4. No Next.js API Routes

There are no `app/api/` routes. All data access is direct client→Firestore. Do not add API routes without asking first.

### 5. RSC boundary — do not pass functions or components as props Server→Client

Only serializable props cross the RSC boundary: string, number, boolean, null, array, plain object, ReactNode (JSX).  
Never pass: functions, class instances, React components (ForwardRef), Symbols.

---

## Naming conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Files | `kebab-case` | `blob-mascot-3d.tsx` |
| Components | `PascalCase` named export | `export function KidQuest` |
| Hooks | `useCamelCase` | `useAuth`, `usePrefersReducedMotion` |
| Types/Interfaces | `PascalCase` | `Child`, `Mission`, `KidTheme` |
| Constants | `UPPER_SNAKE_CASE` | `CHEST_COSTS`, `THEME_ORDER` |
| CSS variables | `--kebab-case` | `--primary`, `--ink-soft` |

---

## TypeScript rules

- Strict mode is on — no `any`
- Named exports only — no anonymous default exports
- Explicit interfaces for every component's props
- `lib/firebase.js` and `lib/firestore-schema.js` are intentionally plain JS (legacy) — do not add type errors by importing them incorrectly

---

## Design tokens

Primary design tokens live in `app/globals.css` (`:root {}`) and `lib/themes.ts`.  
See `DESIGN.md` for the full spec.

Default theme (Jelly) palette:
- `--primary`: #2E5BFF (blue)
- `--secondary`: #FF4D63 (red/pink)
- `--tertiary`: #FFD447 (yellow)
- `--success`: #2CCB73 (green)
- `--surface`: #F8FBFF
- `--ink`: #15254B
- `--ink-soft`: #5F709C

**Never use arbitrary hex values.** Use CSS variables or Tailwind tokens from the project config.

---

## Known tech debt (do not fix without being asked)

- `kid-quest.tsx` (~1800 lines) and `parent-dashboard.tsx` (~1700 lines) are intentionally monolithic for now
- `lib/firebase.js` and `lib/firestore-schema.js` are plain JS in a TypeScript project — do not convert without explicit instruction
- `vercel.json` forces `npm install` while the project uses pnpm locally — both lockfiles coexist, this is a known deployment inconsistency
- Service worker cache name (`mission-heros-v1`) and localStorage key (`mission-heros-sound-v1`) are stale names from before the app was renamed to Skadoush
- `child-avatar.tsx` uses a raw `<img>` (ESLint disabled) because images are stored as dataURLs in Firestore — intentional

---

## What NOT to do

- Do not add `ssr: true` to any dynamic import that includes Firebase
- Do not import from `lib/firebase.js` in a Server Component
- Do not use arbitrary Tailwind values (`bg-[#1a2b3c]`, `w-[320px]`) — use design tokens
- Do not create new components that duplicate existing ones in `components/ui/` or `skad-ui.tsx`
- Do not add API routes without explicit instruction
- Do not commit `.env.local` or any Firebase credentials
- Do not `rm` files — if deletion is needed, use `trash` (or flag it for the developer)
- Do not over-engineer: minimal solution that works, no premature abstractions

---

## Next.js version note

This project uses Next.js 16.2.4 (App Router). If something about the APIs or file structure surprises you, check `node_modules/next/dist/docs/` before assuming your training data is correct for this version.
