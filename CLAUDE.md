# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
