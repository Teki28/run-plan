# UI Design Rules

## Color & Style

- Avoid blue or purple as primary or accent colors. Do not use standard AI-product color schemes (e.g. gradients of blue/purple, glowing indigo buttons, ChatGPT-style UI patterns). Choose a distinct palette — warm neutrals, earthy tones, muted greens, or brand-specific colors are preferred.

---

# STRIDE — Visual & UI Design

## Concept: "Dusk Run"

A full-browser, immersive onboarding experience. Dark, warm, and athletic — a near-black canvas evoking the focused headspace of an evening run, lit by ember-orange accents. The app guides runners step by step through a split-screen layout: the active question lives on the left, while a live preview panel on the right updates in real time as the user makes choices.

**Core experience principle:** One decision at a time. No scrolling, no multi-field forms. The user always knows where they are and where they're going.

---

## Aesthetic Direction

| Attribute     | Direction                                                                 |
|---------------|---------------------------------------------------------------------------|
| Tone          | Athletic, warm, focused — charged but not aggressive                      |
| Layout        | Split-screen (question left / live preview right)                         |
| Inspiration   | Nike Run Club, Strava, editorial sports magazines                          |
| Key feeling   | "Something is being built *for* you"                                      |

---

## Color System

| Role             | Name       | Hex       | Usage                                      |
|------------------|------------|-----------|--------------------------------------------|
| Canvas           | Near Black | `#111110` | Full-page background                       |
| Surface          | Dark Stone | `#1C1B18` | Cards, panels, input fields                |
| Border           | Ash        | `#2E2D2A` | Subtle dividers, card borders              |
| Primary Accent   | Ember      | `#E07B39` | CTAs, selected states, active elements     |
| Secondary Accent | Gold       | `#F2C14E` | Highlights, metric callouts                |
| Primary Text     | Off-White  | `#E8E0D0` | Headings and body copy                     |
| Secondary Text   | Stone      | `#7A786E` | Labels, hints, inactive states             |
| Success          | Pulse      | `#5BAD7F` | Easy sessions, positive feedback           |
| Warning          | Effort     | `#C4655A` | Hard sessions, injury flags                |

---

## Typography

| Role          | Typeface              | Weight | Size (desktop) | Notes                          |
|---------------|-----------------------|--------|----------------|--------------------------------|
| Display       | Barlow Condensed      | 800    | 64–80px        | Hero headlines, splash screen  |
| Heading       | Barlow Condensed      | 600    | 28–40px        | Step questions                 |
| Body          | DM Sans               | 300    | 16–18px        | Descriptions, helper text      |
| Metric / Data | Barlow Condensed      | 800    | 48–72px        | Live numbers (mileage, weeks)  |
| Label / UI    | DM Sans               | 500    | 13–14px        | Buttons, tags, badges          |
| Mono / Step   | DM Mono               | 400    | 12px           | Step counters, field hints     |

---

## Layout Architecture

### Global Shell
- **Full-viewport** (`100vw × 100vh`), no scrolling
- **Top bar:** Logo left · Progress bar center · Step counter right (e.g. `03 / 07`)
- **Split-screen columns:** `50% / 50%` on desktop, collapsing to stacked on tablet
- **Sticky bottom CTA** anchored at the bottom of the left panel

### Left Panel — Question Area
- Large step question in Barlow Condensed
- Short helper copy in DM Sans Light beneath
- The interactive input component (cards, slider, dial, calendar)
- "← Back" ghost link + "Continue →" primary button

### Right Panel — Live Preview
- Shows the plan taking shape in real time as the user answers
- Starts sparse (just a distance badge) and fills up with each step
- Ambient radial glow (ember) behind the preview card
- Subtle noise texture overlay for warmth and depth
- On the final reveal, this panel becomes the full training calendar

---

## Key Animations

| Trigger         | Animation                    | Duration   | Details                                                   |
|-----------------|------------------------------|------------|-----------------------------------------------------------|
| App load        | Word-by-word type reveal     | 800ms      | Each word fades in + slides up 8px, 60ms stagger          |
| Card select     | Flood fill from center       | 300ms      | CSS clip-path circle expand from tap point                |
| Step transition | Slide + fade (left panel)    | 280ms      | New step slides in from right 30px, old exits left        |
| Progress bar    | Smooth width fill            | 300ms      | ease-out, updates after each step completion              |
| Milestone pulse | Ember ring pulse             | 400ms      | Step dot pulses once on completion — positive feedback    |
| Dial input      | Number count-up              | 150ms      | Live update with a subtle scale bounce on the digit       |
| Plan reveal     | Row cascade                  | ~800ms     | 16 rows × 50ms stagger, translateX from -20px             |
| Plan shimmer    | Shimmer sweep                | 600ms      | Gradient mask sweeps left → right after cascade           |
| Right panel     | Fade-in content pieces       | 200ms      | Each preview element fades in as corresponding step done  |
| Hover states    | Card border + subtle lift    | 120ms      | Border brightens, translateY(-2px) on interactive cards   |

---

## Component Inventory

| Component             | Used In          | Notes                                               |
|-----------------------|------------------|-----------------------------------------------------|
| Tap-to-select card    | Step 1           | Grid layout, clip-path flood on selection           |
| 3-stop selector       | Step 2           | Custom component, large touch targets               |
| Circular dial         | Step 3           | SVG-based, drag + click, live large number readout  |
| Unit toggle (km/mi)   | Step 3           | Sliding pill toggle, converts values on switch      |
| Day-of-week pills     | Step 4           | 7-button row, shake animation for < 2 selected      |
| Inline calendar       | Step 5           | Always visible, no popup, muted past/future dates   |
| Multi-chip selector   | Step 6           | Wrapping chip grid, multi-select, skip option       |
| Week row tile         | Step 7 (reveal)  | Effort-coded color, cascaded entrance               |
| Live preview panel    | All steps        | Right half, updates per step, ambient glow bg       |
| Progress bar          | Global top bar   | Smooth fill, shows step X of 7                      |
| Sticky CTA button     | Left panel base  | Anchored bottom, label changes per step context     |

---

## Responsive Behaviour

| Breakpoint    | Layout change                                                      |
|---------------|--------------------------------------------------------------------|
| ≥ 1280px      | Full split-screen 50/50, full preview panel visible               |
| 1024–1280px   | Split 55/45, preview panel slightly narrower                      |
| 768–1024px    | Stack: question on top, preview panel collapses to summary strip  |
| < 768px       | Single column, preview hidden until reveal step                   |

---

## Design Principles

1. **One decision at a time.** Never present two questions simultaneously.
2. **Show, don't tell.** The right panel visualises the plan being built — users see consequences of their choices immediately.
3. **Momentum over friction.** Every interaction should feel rewarding. Animations confirm choices and propel the user forward.
4. **Warmth through restraint.** The ember accent is used sparingly — reserved for the most important moments (selection, CTA, metric callouts). Overuse would dilute its impact.
5. **Keyboard-first accessibility.** All steps fully navigable by keyboard. Focus states use an ember ring outline.
