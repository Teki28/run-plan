# STRIDE — Onboarding Flow & Training Plan Logic

## Onboarding Flow (8 Steps)

### Step 0 — Welcome Splash
- Full-screen dark canvas with a centered layout (no split yet)
- Large display type animates in word-by-word: **"YOUR RACE. YOUR RULES. YOUR PLAN."**
- Pulsing runner silhouette icon in ember
- Single CTA button: **"Build my plan →"**
- Subtle grain texture + radial amber glow emanating from behind the icon

---

### Step 1 — Race Goal
**Question:** "What are you training for?"

- **Input:** 5 tap-to-select cards in a 2-column grid
  - 5K · 10K · Half Marathon · Full Marathon · General Fitness
- Selected card floods with ember from center outward (clip-path circle animation)
- Right panel shows the selected distance badge appear

---

### Step 2 — Experience Level
**Question:** "How would you describe your running background?"

- **Input:** Horizontal 3-stop selector with large tap targets
  - Beginner · Intermediate · Advanced
- Each stop has an icon (shoe / medal / flame) and a one-line description
- Active stop highlighted with ember underline and label glow
- Right panel updates the plan header text accordingly

---

### Step 3 — Current Weekly Mileage
**Question:** "How many kilometres do you run each week right now?"

- **Input:** Large circular dial — click-drag or click +/− buttons
- The number renders huge in Barlow Condensed (Ember color) and updates live
- km/mi toggle slides smoothly (units convert on the fly)
- Helper copy reads: *"Be honest — we'll build up from here safely."*
- Right panel shows a "Starting base" bar appear on a mini weekly chart

---

### Step 4 — Training Days
**Question:** "Which days can you train?"

- **Input:** 7 pill buttons in a row (Mon · Tue · Wed · Thu · Fri · Sat · Sun)
- Toggle on/off. Selected days glow ember
- Minimum 2 days required — a subtle shake animation if fewer than 2 are active
- A soft counter below: *"3 days selected — good foundation"*
- Right panel shows a weekly schedule grid populate with selected days

---

### Step 5 — Target Race Date
**Question:** "When is your race?"

- **Input:** Inline minimal calendar component (no popup — lives in the panel)
- Past dates and dates too soon greyed out
- On date selection, a live counter appears in Barlow Condensed below: **"14 WEEKS TO GO"** in Gold
- Right panel shows the 14-week span lock in on the plan timeline

---

### Step 6 — Injury History
**Question:** "Any areas we should be careful with?"

- **Input:** Multi-select chip grid
  - Knee · IT Band · Hip · Shin Splints · Plantar · None
- Selecting any injury adds a reassuring note: *"We'll reduce high-impact sessions and add recovery days."*
- Optional step — user can skip with a ghost "Skip →" link
- Right panel highlights rest days in the preview schedule

---

### Step 7 — Plan Reveal
**No question — this is the payoff.**

- Left panel transitions to a summary card: goal, weeks, days/week, base mileage
- Right panel expands full-width with the generated training calendar
- Week rows cascade in from the left with 50ms stagger per row
- Each session tile is color-coded:
  - Green = Easy run · Amber = Tempo/moderate · Red = Hard/long run · Grey = Rest
- A shimmer sweep animation runs once across the entire plan after all rows appear
- Bottom CTA changes to: **"Save my plan →"**
