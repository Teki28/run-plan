# STRIDE — Build Plan

---

## Training Plan Generator — Pseudo-Code Specification

This section defines the algorithm that converts user inputs (`PlanData`) into a structured weekly training calendar (`TrainingWeek[]`). It should guide any rewrite or update of `src/utils/generatePlan.ts`.

### User Inputs (`PlanData`)

| Field | Type | Meaning |
|---|---|---|
| `raceGoal` | `'5k' \| '10k' \| 'half' \| 'full' \| 'fitness'` | Distance target |
| `experienceLevel` | `'beginner' \| 'intermediate' \| 'advanced'` | Runner tier |
| `weeklyMileage` | `number` | Current base volume |
| `unit` | `'km' \| 'mi'` | Unit for display/input |
| `trainingDays` | `number[]` | Days 0=Mon…6=Sun the user runs |
| `raceDate` | `string \| null` | ISO date of race |
| `injuries` | `InjuryType[]` | Known injury flags |
| `targetFinishTime` | `number \| null` | Goal finish time in **seconds** (to be added to `PlanData`) |

#### How `targetFinishTime` is used

Once we know the user's goal pace (seconds/km), we can derive training zones:

| Zone | Derivation | Session type |
|---|---|---|
| Easy pace | goal pace × 1.25–1.35 | `easy` |
| Tempo pace | goal pace × 1.05–1.10 | `tempo` |
| Race pace | goal pace × 1.00 | `hard` |

Each `SessionTile` gains a `targetPaceSec` field (seconds/km), displayed in the UI when available.

### Output Shape

```
TrainingWeek[]  →  { weekNumber, totalKm, sessions: SessionTile[] }
SessionTile     →  { day, type: 'easy'|'tempo'|'hard'|'rest',
                      distanceKm, targetPaceSec?: number }
```

---

### Top-level Orchestrator

```
FUNCTION generatePlan(planData):
  IF raceGoal is null OR experienceLevel is null
    OR raceDate is null OR trainingDays.length < 2:
    RETURN []

  totalWeeks = weeksUntil(raceDate, today)
  IF totalWeeks < 4: RETURN []

  baseKm    = (unit == 'km') ? weeklyMileage : miToKm(weeklyMileage)
  params    = getGoalParams(raceGoal, experienceLevel)
  // params = { maxWeeklyKm, peakLongRunKm, taperWeeks }

  paceZones = computePaceZones(raceGoal, targetFinishTime)
  // paceZones = { easy, tempo, hard } in seconds/km
  // IF targetFinishTime is null → paceZones = null (pace not shown in UI)

  arc       = buildMileageArc(baseKm, totalWeeks, params)
  types     = assignSessionTypes(sortedDays, experienceLevel, injuries)
  // types is STATIC per week — same slot structure every week

  FOR weekIndex FROM 0 TO totalWeeks - 1:
    weekPhase = getWeekPhase(weekIndex, totalWeeks, params.taperWeeks)
    sessions  = buildSessions(sortedDays, types, weekPhase, arc[weekIndex], params, paceZones)
    weeks.push({ weekNumber: weekIndex+1, sessions, totalKm: arc[weekIndex] })

  RETURN weeks
```

---

### Pace Zone Calculator

```
FUNCTION computePaceZones(raceGoal, targetFinishTime):
  IF targetFinishTime is null: RETURN null

  RACE_DISTANCE_KM = { '5k': 5, '10k': 10, 'half': 21.1, 'full': 42.2, 'fitness': null }
  distKm = RACE_DISTANCE_KM[raceGoal]
  IF distKm is null: RETURN null  // 'fitness' has no fixed race distance

  goalPaceSec = targetFinishTime / distKm  // seconds per km

  RETURN {
    easy:  ROUND(goalPaceSec * 1.30),  // ~30% slower — aerobic base
    tempo: ROUND(goalPaceSec * 1.07),  // ~7% slower — lactate threshold
    hard:  ROUND(goalPaceSec * 1.00),  // goal/race pace
  }
  // Easy pace multiplier shifts by level:
  //   beginner × 1.40, intermediate × 1.30, advanced × 1.20
```

---

### Mileage Arc Builder

Implements the **10% rule** + **3-build / 1-recovery** cycle + **goal-specific taper**.

```
FUNCTION buildMileageArc(baseKm, totalWeeks, params):
  { maxWeeklyKm, taperWeeks } = params
  buildWeeks = totalWeeks - taperWeeks
  arc        = []
  current    = baseKm

  FOR i FROM 0 TO buildWeeks - 1:
    weekNum = i + 1
    IF weekNum % 4 == 0:             // Every 4th week = recovery week
      arc.push(ROUND(current * 0.80))
    ELSE:
      arc.push(ROUND(MIN(current, maxWeeklyKm)))
      current = MIN(current * 1.10, maxWeeklyKm)  // 10% rule

  // Taper from peak
  peakKm = MAX(arc)
  taperFactors = {
    3: [0.80, 0.60, 0.40],
    2: [0.70, 0.50],
    1: [0.50],
  }
  FOR t FROM 0 TO taperWeeks - 1:
    arc.push(ROUND(peakKm * taperFactors[taperWeeks][t]))

  RETURN arc  // length == totalWeeks
```

---

### Week Phase Classifier

```
FUNCTION getWeekPhase(weekIndex, totalWeeks, taperWeeks):
  IF weekIndex >= totalWeeks - taperWeeks:
    RETURN 'taper'
  IF (weekIndex + 1) % 4 == 0:
    RETURN 'recovery'
  IF weekIndex >= totalWeeks - taperWeeks - 3:
    RETURN 'peak'            // last 3 build weeks before taper
  RETURN 'build'
```

---

### Session Type Assignment (static per plan)

Called once; the resulting slot order is reused every week — only distances vary.

```
FUNCTION assignSessionTypes(sortedDays, level, injuries):
  n          = sortedDays.length
  highImpact = injuries contains any of [knee, itband, hip, shin, plantar]
  limitToTempo = (level == 'beginner') OR highImpact

  types[0]   = 'easy'     // First day = easy/recovery
  types[n-1] = 'hard'     // Last day  = long run

  FOR pos FROM 1 TO n-2:
    IF level == 'advanced' AND n >= 4 AND pos == n-2:
      types[pos] = 'hard'   // Second quality session for advanced
    ELIF pos % 2 == 1:
      types[pos] = 'tempo'
    ELSE:
      types[pos] = 'easy'

  IF limitToTempo:
    types = types.map(t => t == 'hard' ? 'tempo' : t)

  RETURN types
```

---

### Session Builder (per week)

```
FUNCTION buildSessions(sortedDays, baseTypes, weekPhase, totalKm, params, paceZones):
  // Adjust session types for the current phase
  IF weekPhase == 'recovery':
    weekTypes = all 'easy'
  ELIF weekPhase == 'taper':
    weekTypes = baseTypes.map(t => t == 'hard' ? 'tempo' : t)
  ELSE:  // 'build' or 'peak'
    weekTypes = baseTypes

  distances = distributeDistances(weekTypes, totalKm)

  // Cap the long run to peakLongRunKm; redistribute surplus to other sessions
  longRunIdx = weekTypes.lastIndexOf('hard')
  IF longRunIdx >= 0 AND distances[longRunIdx] > params.peakLongRunKm:
    surplus = distances[longRunIdx] - params.peakLongRunKm
    distances[longRunIdx] = params.peakLongRunKm
    // Add surplus proportionally to non-rest, non-long sessions

  RETURN sortedDays.map((day, i) => ({
    day,
    type:          weekTypes[i],
    distanceKm:    distances[i],
    targetPaceSec: paceZones ? paceZones[weekTypes[i]] : undefined,
  }))
```

---

### Distance Distributor (80/20 rule)

```
FUNCTION distributeDistances(types, totalKm):
  // Effort weights approximate the 80/20 rule
  EFFORT_WEIGHT = { easy: 1.0, tempo: 1.4, hard: 1.8, rest: 0 }

  totalWeight = SUM(EFFORT_WEIGHT[t] for t in types)
  IF totalWeight == 0: RETURN types.map(() => 0)

  RETURN types.map(t =>
    ROUND((EFFORT_WEIGHT[t] / totalWeight) * totalKm, 1)
  )
```

---

### Goal Parameter Table

```
FUNCTION getGoalParams(raceGoal, level):
  // maxWeeklyKm | peakLongRunKm | taperWeeks
  TABLE = {
    '5k':    { beginner: {40,  15, 2}, intermediate: {70,  20, 2}, advanced: {90,  25, 2} },
    '10k':   { beginner: {50,  20, 2}, intermediate: {80,  25, 2}, advanced: {100, 30, 2} },
    'half':  { beginner: {60,  25, 2}, intermediate: {90,  30, 2}, advanced: {120, 35, 3} },
    'full':  { beginner: {70,  30, 3}, intermediate: {100, 35, 3}, advanced: {150, 38, 3} },
    'fitness':{ beginner:{35,  12, 1}, intermediate: {50,  18, 1}, advanced: {60,  22, 1} },
  }
  RETURN TABLE[raceGoal][level]
```

---

### Key Design Principles (from `plan_reference.md`)

| Principle | How it's encoded |
|---|---|
| **10% rule** | `current * 1.10` cap in `buildMileageArc` |
| **80/20 rule** | Effort weights 1.0 / 1.4 / 1.8 in `distributeDistances` |
| **3-build + 1-recovery** | `weekNum % 4 == 0` → 80% of current volume |
| **Goal-specific taper** | 1–3 weeks from `getGoalParams`, factors in `buildMileageArc` |
| **Long run cap** | `peakLongRunKm` per goal × level; clamped in `buildSessions` |
| **Injury / beginner safety** | `limitToTempo` flag downgrades `hard` → `tempo` |
| **Pace zones** | `computePaceZones` derives easy/tempo/hard from `targetFinishTime` |

---

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
