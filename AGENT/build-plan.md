# STRIDE — Build Plan

## Context

Building the STRIDE "Dusk Run" running plan builder from scratch on top of a clean Vite + React 19 + TypeScript + Tailwind CSS v4 scaffold. The current `src/` contains only the default Vite boilerplate (counter demo, hero image, social links). Everything needs to be replaced.

The app is an 8-step onboarding wizard that collects runner inputs and generates a personalised training calendar. Key UX principles: one step at a time, full-viewport split-screen, live preview panel updates as the user progresses.

Reference files:
- `AGENT/design-visual.md` — full design spec (colors, fonts, layout, animations, components)
- `AGENT/design-flow.md` — 8-step flow with input types and behaviour per step
- `.claude/rules/ui-design.md` — active design rules

---

## Phase 1 — Foundation & Design System

Clear boilerplate and establish the design token layer everything else builds on.

**Tasks:**
1. **Clean up scaffold** — gut `src/App.tsx`, `src/App.css`; clear boilerplate from `src/index.css`
2. **Install fonts** — add Barlow Condensed (800, 600), DM Sans (300, 500), DM Mono (400) via Google Fonts link in `index.html`
3. **Design tokens** — rewrite `src/index.css` with the Dusk Run CSS variables:
   - Colors: `--color-canvas #111110`, `--color-surface #1C1B18`, `--color-border #2E2D2A`, `--color-ember #E07B39`, `--color-gold #F2C14E`, `--color-text #E8E0D0`, `--color-muted #7A786E`, `--color-success #5BAD7F`, `--color-warning #C4655A`
   - Font families: `--font-display`, `--font-body`, `--font-mono`
4. **Update `index.html`** — set title to "STRIDE", add font preconnects, set `<html>` background to `#111110`
5. **Global base styles** — full-viewport body reset, font rendering, selection color

**Files touched:** `index.html`, `src/index.css`, `src/App.tsx`, `src/App.css`

---

## Phase 2 — App Shell & State

The structural skeleton: layout, step state machine, top bar, navigation.

**Tasks:**
1. **Step state** — create `src/store/usePlanStore.ts` (useState/useReducer hook) holding:
   - `currentStep: number` (0–7)
   - `planData: PlanData` (collected answers)
   - `goNext()`, `goBack()` actions
2. **Types** — `src/types/plan.ts`: `RaceGoal`, `ExperienceLevel`, `PlanData` interfaces
3. **AppShell component** — `src/components/AppShell.tsx`:
   - Full-viewport layout (`100vw × 100vh`, `overflow: hidden`)
   - Top bar (logo left, progress bar center, step counter right) — hidden on step 0
   - Split-screen wrapper (50/50) — collapses to single column on step 0
4. **ProgressBar component** — `src/components/ProgressBar.tsx`: smooth width fill, `ease-out` 300ms
5. **StickyNav component** — `src/components/StickyNav.tsx`: Back ghost link + Continue primary button, locked to bottom of left panel
6. **Step transition** — CSS class-based slide+fade (new step slides in from right 30px, old exits left, 280ms)

**Files created:** `src/store/usePlanStore.ts`, `src/types/plan.ts`, `src/components/AppShell.tsx`, `src/components/ProgressBar.tsx`, `src/components/StickyNav.tsx`

---

## Phase 3 — Step 0: Welcome Splash

**Tasks:**
1. **SplashScreen component** — `src/steps/SplashScreen.tsx`:
   - Full-screen centered, no split
   - Radial amber glow behind icon (CSS radial-gradient)
   - SVG runner silhouette icon in ember color
   - Grain texture overlay (SVG noise filter or CSS `url(#noise)`)
2. **Headline animation** — word-by-word reveal: "YOUR RACE. YOUR RULES. YOUR PLAN." — each word fades in + slides up 8px, 60ms stagger, 800ms total
3. **CTA button** — "Build my plan →" — ember background, calls `goNext()`

**Files created:** `src/steps/SplashScreen.tsx`

---

## Phase 4 — Input Components (Steps 1–6)

Build each input component independently, then wire into step screens.

**Tasks:**
1. **SelectCard** (`src/components/SelectCard.tsx`) — tap-to-select card with clip-path circle flood animation on selection (Step 1)
2. **ThreeStopSelector** (`src/components/ThreeStopSelector.tsx`) — horizontal 3-option selector with icon + description, ember underline on active (Step 2)
3. **CircularDial** (`src/components/CircularDial.tsx`) — SVG-based, drag + click +/−, live large-number readout; `UnitToggle` pill inside (Step 3)
4. **DayPills** (`src/components/DayPills.tsx`) — 7 toggleable pills Mon–Sun, shake animation CSS class when < 2 selected (Step 4)
5. **InlineCalendar** (`src/components/InlineCalendar.tsx`) — always-visible, no popup; greyed past dates + too-soon dates; "X WEEKS TO GO" countdown in Gold on selection (Step 5)
6. **ChipGrid** (`src/components/ChipGrid.tsx`) — multi-select wrapping chips, reassurance note on injury selection, "Skip →" ghost link (Step 6)
7. **Step screens** — `src/steps/Step1.tsx` through `src/steps/Step6.tsx`, each wrapping the relevant input component with the question heading and helper copy

**Files created:** 6 components + 6 step screens

---

## Phase 5 — Right Panel Live Preview

The preview panel updates incrementally as the user completes each step.

**Tasks:**
1. **PreviewPanel component** — `src/components/PreviewPanel.tsx`:
   - Receives `planData` and `currentStep` as props
   - Ambient radial ember glow background + subtle noise texture overlay
   - Content fades in per step (200ms per element)
2. **Preview content per step:**
   - Step 1 → distance badge (race goal pill)
   - Step 2 → plan header text (e.g. "Intermediate Half Marathon Plan")
   - Step 3 → mini weekly mileage bar
   - Step 4 → weekly schedule grid with selected day markers
   - Step 5 → plan timeline span (X-week bar)
   - Step 6 → rest day highlights in the schedule
3. **PreviewPanel hidden** on step 0; collapses to summary strip on tablet; hidden until reveal on mobile

**Files created:** `src/components/PreviewPanel.tsx`, `src/components/preview/` (sub-components per step)

---

## Phase 6 — Plan Generation & Step 7 Reveal

**Tasks:**
1. **Plan generation logic** — `src/utils/generatePlan.ts`:
   - Input: `PlanData` (goal, level, base mileage, days, race date, injuries)
   - Output: array of weeks, each with session tiles `{ day, type: 'easy'|'tempo'|'hard'|'rest' }`
   - Rules: progressive mileage increase ~10%/week, taper last 2 weeks, distribute session types across selected days, reduce high-impact if injuries present
2. **WeekRow component** — `src/components/WeekRow.tsx`: row of session tiles, effort-coded colors (green/amber/red/grey), cascade entrance animation (`translateX(-20px)` → 0, 50ms stagger per row)
3. **SessionTile component** — `src/components/SessionTile.tsx`: effort type label + distance, color-coded background
4. **PlanReveal screen** — `src/steps/PlanReveal.tsx`:
   - Left panel: summary card (goal, weeks, days/week, base mileage)
   - Right panel: full training calendar (WeekRow × N)
   - Shimmer sweep animation runs once after all rows cascade in (600ms gradient mask sweep)
   - CTA changes to "Save my plan →"

**Files created:** `src/utils/generatePlan.ts`, `src/components/WeekRow.tsx`, `src/components/SessionTile.tsx`, `src/steps/PlanReveal.tsx`

---

## Phase 7 — Polish, Responsive & Accessibility

**Tasks:**
1. **Responsive breakpoints** (Tailwind classes):
   - `≥1280px` — full 50/50 split, preview visible
   - `1024–1280px` — 55/45 split
   - `768–1024px` — stacked, preview collapses to summary strip
   - `<768px` — single column, preview hidden until Step 7
2. **Keyboard navigation** — all interactive elements keyboard-accessible; focus states use ember ring outline (`outline: 2px solid #E07B39`)
3. **Milestone pulse** — ember ring pulse on step dot when step completes (400ms)
4. **Hover states** — card border brightens + `translateY(-2px)` on interactive cards (120ms)
5. **Final wiring** — connect all steps in `App.tsx` via `currentStep` switch, ensure back/forward nav updates `planData` correctly
6. **Cleanup** — remove unused assets (`hero.png`, `react.svg`, `vite.svg`, `icons.svg`), update favicon

---

## File Structure (end state)

```
src/
  index.css                    # Design tokens + global reset
  main.tsx                     # Unchanged
  App.tsx                      # Step router (switch on currentStep)
  types/
    plan.ts                    # PlanData, RaceGoal, etc.
  store/
    usePlanStore.ts            # Step state + planData
  utils/
    generatePlan.ts            # Training plan generation logic
  components/
    AppShell.tsx
    ProgressBar.tsx
    StickyNav.tsx
    PreviewPanel.tsx
    SelectCard.tsx
    ThreeStopSelector.tsx
    CircularDial.tsx
    DayPills.tsx
    InlineCalendar.tsx
    ChipGrid.tsx
    WeekRow.tsx
    SessionTile.tsx
    preview/                   # Per-step preview sub-components
  steps/
    SplashScreen.tsx
    Step1.tsx – Step6.tsx
    PlanReveal.tsx
index.html                     # Fonts, title, bg color
```

---

## Verification

- `npm run dev` — walk through all 8 steps end to end, check live preview updates per step
- `npm run build` — zero TypeScript errors
- `npm run lint` — zero ESLint errors
- Resize viewport to test all 4 responsive breakpoints
- Tab through every step to verify keyboard navigation
- Trigger shake animation on Step 4 by selecting < 2 days
- Complete full flow to Step 7, verify cascade + shimmer animations fire correctly
