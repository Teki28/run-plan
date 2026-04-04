# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Unit Test Rule

For every piece of functional (non-UI) code written or edited — utilities, logic, data transformations, store actions — write a corresponding unit test. Run the tests after each edit and ensure they all pass before considering the task done.

## Changelog Rule

After every task or edit, append a one-line summary to `AGENT/changelog` in the format:
`YYYY-MM-DD — <short description of what was done>`

## Commands

```bash
npm run dev       # Start dev server (http://localhost:5173)
npm run build     # Type-check and build for production
npm run lint      # Run ESLint
npm run preview   # Preview production build locally
```

## Architecture

Single-page React app scaffolded with Vite. Entry point is `src/main.tsx` → `src/App.tsx`.

**Stack:**
- React 19 + TypeScript
- Tailwind CSS v4 via `@tailwindcss/vite` plugin (no `tailwind.config` file needed)
- Vite 8 with `@vitejs/plugin-react`

**Tailwind setup:** Tailwind is imported at the top of `src/index.css` with `@import "tailwindcss"` and registered as a Vite plugin in `vite.config.ts`. Use utility classes directly in JSX.

---

## App: STRIDE — Running Plan Builder

An immersive, full-viewport onboarding flow ("Dusk Run" concept) that collects user inputs step by step and generates a personalised training plan.

### UX Model
- **Split-screen layout:** left panel = active question, right panel = live plan preview updating in real time
- **One step at a time** — no scrolling, no multi-field forms
- Full-viewport (`100vw × 100vh`), no page scroll; sticky bottom CTA on left panel

### Onboarding Steps (0–7)

| Step | Name             | Input Type                        | Key behaviour                                      |
|------|------------------|-----------------------------------|----------------------------------------------------|
| 0    | Welcome Splash   | Single CTA                        | Full-screen, word-by-word headline animation       |
| 1    | Race Goal        | 5 tap-to-select cards             | 5K / 10K / Half / Full / General Fitness           |
| 2    | Experience Level | 3-stop horizontal selector        | Beginner / Intermediate / Advanced                 |
| 3    | Weekly Mileage   | Circular dial + km/mi toggle      | Live large-number readout in Ember                 |
| 4    | Training Days    | 7 day-of-week pill toggles        | Min 2 days; shake animation if fewer selected      |
| 5    | Race Date        | Inline calendar (no popup)        | Shows "X WEEKS TO GO" in Gold on selection         |
| 6    | Injury History   | Multi-select chip grid (optional) | Knee / IT Band / Hip / Shin / Plantar / None       |
| 7    | Plan Reveal      | Display only                      | Full calendar, row cascade + shimmer, "Save" CTA   |

### Session tile color coding (Step 7)
- Green = Easy run · Amber = Tempo/moderate · Red = Hard/long run · Grey = Rest

---

## Design System (see `.claude/rules/ui-design.md` for full spec)

| Token            | Value     |
|------------------|-----------|
| Background       | `#111110` |
| Surface          | `#1C1B18` |
| Primary Accent   | `#E07B39` (Ember) |
| Secondary Accent | `#F2C14E` (Gold) |
| Primary Text     | `#E8E0D0` |

**Fonts:** Barlow Condensed (display/headings/metrics) · DM Sans (body/labels) · DM Mono (step counters)

**Rules:** No blue or purple. No standard AI color schemes. Full spec in `.claude/rules/ui-design.md`.

---

## Project Structure

```
src/
  main.tsx                        # Entry point
  App.tsx                         # Step router (switch on currentStep)
  App.css                         # Empty — styles live in index.css
  index.css                       # Tailwind import + design tokens + global reset + keyframes

  types/
    plan.ts                       # RaceGoal, ExperienceLevel, InjuryType, PlanData

  store/
    usePlanStore.ts               # Step state (currentStep, planData, goNext, goBack, updatePlanData)
    usePlanStore.test.ts

  utils/
    units.ts                      # kmToMi, miToKm, clampMileage, toDisplayUnit, toStorageKm
    units.test.ts
    dates.ts                      # weeksUntil, isSelectable, weeksToGoLabel, daysInMonth, toDateString
    dates.test.ts

  components/
    AppShell.tsx                  # Full-viewport shell: top bar (logo, progress, counter) + split-screen
    ProgressBar.tsx               # Ember fill bar with ARIA attributes
    StickyNav.tsx                 # Back ghost link + Continue ember button (locked to panel bottom)
    StepLayout.tsx                # Shared step wrapper: question heading + helper copy + StickyNav
    StepTransition.tsx            # Key-based remount with fade+lift enter animation
    SelectCard.tsx                # Tap-to-select card with clip-path flood-fill animation
    ThreeStopSelector.tsx         # Horizontal 3-option selector with ember underline
    CircularDial.tsx              # SVG arc dial with drag, +/− buttons, UnitToggle pill
    DayPills.tsx                  # Mon–Sun toggleable pills with shake on <2 selected
    InlineCalendar.tsx            # Always-visible calendar, greyed invalid dates, gold weeks badge
    ChipGrid.tsx                  # Multi-select chip grid with reassurance note and Skip link

  steps/
    SplashScreen.tsx              # Step 0: full-screen, logo, runner icon, word-by-word animation, CTA
    Step1.tsx                     # Race goal — 5 SelectCards
    Step2.tsx                     # Experience level — ThreeStopSelector
    Step3.tsx                     # Weekly mileage — CircularDial
    Step4.tsx                     # Training days — DayPills
    Step5.tsx                     # Race date — InlineCalendar
    Step6.tsx                     # Injury history — ChipGrid

  assets/
    hero.png, react.svg, vite.svg # Unused Vite boilerplate (not yet cleaned up)

index.html                        # Title: STRIDE, Google Fonts, html bg #111110
vite.config.ts                    # Vite + React + Tailwind plugins; Vitest test config
```
