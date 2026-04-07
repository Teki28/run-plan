import { useMemo, useRef, useState } from 'react'
import { WeekRow } from '../components/WeekRow'
import { SESSION_COLORS } from '../components/SessionTile'
import { generatePlan, computePaceZones } from '../utils/generatePlan'
import { exportPdf } from '../utils/exportPdf'
import type { SessionType, WeekPhase, TrainingWeek, PaceZones } from '../utils/generatePlan'
import type { PlanData } from '../types/plan'

// ─── Labels & constants ─────────────────────────────────────────────────────

const RACE_GOAL_LABELS: Record<string, string> = {
  '5k': '5K', '10k': '10K', 'half': 'Half Marathon',
  'full': 'Full Marathon', 'fitness': 'General Fitness',
}
const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced',
}
const SESSION_LEGEND: { type: SessionType; label: string }[] = [
  { type: 'easy',  label: 'Easy run' },
  { type: 'tempo', label: 'Tempo / threshold' },
  { type: 'hard',  label: 'Hard / long run' },
  { type: 'rest',  label: 'Rest day' },
]
const PHASE_LABELS: Record<WeekPhase, { label: string; color: string }> = {
  build:    { label: 'BUILD',    color: '#5BAD7F' },
  recovery: { label: 'RECOVERY', color: '#F2C14E' },
  peak:     { label: 'PEAK',     color: '#E07B39' },
  taper:    { label: 'TAPER',    color: '#C4655A' },
}
const DAY_NAMES_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const PHASE_EXPLANATIONS: Record<WeekPhase, string> = {
  build:    'Build your aerobic base with progressive mileage. Keep 80% of runs at easy pace.',
  recovery: 'Recovery week — volume drops ~20% to let your body adapt and grow stronger.',
  peak:     'Peak training block. Highest intensity and volume before the taper.',
  taper:    'Taper phase — reduce volume to arrive at race day fresh and ready.',
}

// Resolved hex colors for PDF (html2canvas can struggle with CSS variables)
const C = {
  canvas:  '#111110', surface: '#1C1B18', border: '#2E2D2A',
  ember:   '#E07B39', gold:    '#F2C14E', text:   '#E8E0D0',
  muted:   '#7A786E', success: '#5BAD7F', warning:'#C4655A',
}

const SESSION_HEX: Record<SessionType, { bg: string; border: string; text: string; label: string }> = {
  easy:  { bg: 'rgba(91,173,127,0.15)',  border: 'rgba(91,173,127,0.25)',  text: '#5BAD7F', label: 'Easy'  },
  tempo: { bg: 'rgba(224,123,57,0.15)',  border: 'rgba(224,123,57,0.25)',  text: '#E07B39', label: 'Tempo' },
  hard:  { bg: 'rgba(196,101,90,0.20)',  border: 'rgba(196,101,90,0.30)',  text: '#C4655A', label: 'Hard'  },
  rest:  { bg: 'transparent',            border: '#2E2D2A',               text: '#2E2D2A', label: 'Rest'  },
}

function formatPace(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatFinishTime(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

// ─── Shared style tokens ────────────────────────────────────────────────────

const sectionHeadingStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '11px',
  color: 'var(--color-muted)',
  letterSpacing: '0.12em',
}

const cardStyle: React.CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '12px',
}

// ─── Main export ────────────────────────────────────────────────────────────

interface PlanRevealProps {
  planData: PlanData
  onBack: () => void
  onSave: () => void
}

export function PlanReveal({ planData, onBack }: PlanRevealProps) {
  const plan = useMemo(() => generatePlan(planData), [planData])
  const paceZones = useMemo(
    () => planData.raceGoal ? computePaceZones(planData.raceGoal, planData.targetFinishTime) : null,
    [planData.raceGoal, planData.targetFinishTime],
  )
  const [shimmerDone, setShimmerDone] = useState(false)
  const [saving, setSaving] = useState(false)
  const shimmerRef = useRef<HTMLDivElement>(null)
  const pdfRef = useRef<HTMLDivElement>(null)
  const cascadeDurationMs = plan.length * 50 + 320

  const { raceGoal, experienceLevel } = planData
  const title = raceGoal && experienceLevel
    ? `${LEVEL_LABELS[experienceLevel]} ${RACE_GOAL_LABELS[raceGoal]} Plan`
    : 'Your Training Plan'
  const peakKm = plan.length > 0 ? Math.max(...plan.map(w => w.totalKm)) : 0

  async function handleSave() {
    if (!pdfRef.current || saving) return
    setSaving(true)
    try {
      const filename = `stride-${raceGoal ?? 'plan'}-${experienceLevel ?? 'custom'}.pdf`
      await exportPdf(pdfRef.current, filename)
    } finally {
      setSaving(false)
    }
  }

  if (plan.length === 0) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-body)' }}>
        Could not generate a plan. Please go back and check your inputs.
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--color-canvas)' }}>
      {/* Scrollable on-screen content */}
      <div className="flex-1 overflow-y-auto">
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '48px 32px 120px' }}>

          {/* ── Section 1: Hero header ────────────────────────────── */}
          <section style={{ marginBottom: '48px' }}>
            <span style={sectionHeadingStyle}>YOUR PLAN IS READY</span>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '52px',
              lineHeight: 1.05, color: 'var(--color-text)', letterSpacing: '0.01em', marginTop: '8px',
            }}>
              {title}
            </h1>

            <StatsGrid plan={plan} planData={planData} peakKm={peakKm} />
            <LegendAndPaces paceZones={paceZones} />
          </section>

          {/* ── Section 2: Calendar overview ──────────────────────── */}
          <section style={{ marginBottom: '48px' }}>
            <span style={sectionHeadingStyle}>CALENDAR OVERVIEW</span>
            <div style={{ ...cardStyle, marginTop: '12px', overflow: 'hidden' }}>
              <DayHeader />
              <div style={{ padding: '10px 16px 16px', position: 'relative' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {plan.map((week, i) => (
                    <WeekRow key={week.weekNumber} week={week} rowIndex={i} />
                  ))}
                </div>
                {!shimmerDone && (
                  <div
                    ref={shimmerRef}
                    onAnimationEnd={() => setShimmerDone(true)}
                    style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(90deg, transparent 0%, rgba(232,224,208,0.06) 50%, transparent 100%)',
                      backgroundSize: '200% 100%',
                      animation: `shimmer-sweep 600ms ease-out ${cascadeDurationMs}ms both`,
                      pointerEvents: 'none', borderRadius: '6px',
                    }}
                  />
                )}
              </div>
            </div>
          </section>

          {/* ── Section 3: Week-by-week detail ────────────────────── */}
          <section>
            <span style={sectionHeadingStyle}>WEEK-BY-WEEK BREAKDOWN</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
              {plan.map(week => (
                <WeekDetailCard key={week.weekNumber} week={week} />
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* ── Sticky footer ─────────────────────────────────────── */}
      <div style={{
        flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 32px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 12px))',
        borderTop: '1px solid var(--color-border)', background: 'var(--color-canvas)',
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: '14px', color: 'var(--color-muted)',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-muted)')}
        >
          ← Back
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: '14px',
            background: 'var(--color-ember)', color: 'var(--color-canvas)',
            border: 'none', borderRadius: '6px', padding: '12px 28px', cursor: saving ? 'wait' : 'pointer',
            transition: 'opacity 150ms ease', opacity: saving ? 0.6 : 1,
          }}
          onMouseEnter={e => { if (!saving) e.currentTarget.style.opacity = '0.88' }}
          onMouseLeave={e => { if (!saving) e.currentTarget.style.opacity = '1' }}
        >
          {saving ? 'Generating PDF…' : 'Save as PDF →'}
        </button>
      </div>

      {/* ── Hidden PDF-ready content (all weeks expanded, no animations) ── */}
      <div
        ref={pdfRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '-10000px',
          top: 0,
          width: '800px',
          background: C.canvas,
          color: C.text,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <PlanPdfContent
          plan={plan}
          planData={planData}
          title={title}
          peakKm={peakKm}
          paceZones={paceZones}
        />
      </div>
    </div>
  )
}

// ─── Shared sub-components (used by both screen and PDF) ────────────────────

function StatsGrid({ plan, planData, peakKm }: { plan: TrainingWeek[]; planData: PlanData; peakKm: number }) {
  const { weeklyMileage, unit, trainingDays, targetFinishTime, raceGoal } = planData
  const items = [
    { label: 'Duration',    value: `${plan.length}`, sub: 'weeks' },
    { label: 'Days / Week', value: `${trainingDays.length}`, sub: 'days' },
    { label: 'Base Volume', value: `${weeklyMileage}`, sub: `${unit}/wk` },
    { label: 'Peak Volume', value: `${peakKm}`, sub: 'km/wk' },
    ...(targetFinishTime ? [{ label: 'Target Time', value: formatFinishTime(targetFinishTime), sub: '' }] : []),
    { label: 'Goal', value: raceGoal ? RACE_GOAL_LABELS[raceGoal] : '—', sub: '' },
  ]
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: '12px', marginTop: '28px',
    }}>
      {items.map(({ label, value, sub }) => (
        <div key={label} style={{ ...cardStyle, padding: '18px 16px' }}>
          <span style={sectionHeadingStyle}>{label.toUpperCase()}</span>
          <div style={{ marginTop: '6px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '28px',
              lineHeight: 1, color: 'var(--color-ember)',
            }}>{value}</span>
            {sub && (
              <span style={{ fontFamily: 'var(--font-body)', fontWeight: 300, fontSize: '13px', color: 'var(--color-muted)' }}>{sub}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function LegendAndPaces({ paceZones }: { paceZones: PaceZones | null }) {
  return (
    <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', marginTop: '24px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <span style={sectionHeadingStyle}>SESSION TYPES</span>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '4px' }}>
          {SESSION_LEGEND.map(({ type, label }) => {
            const { bg, border, text } = SESSION_COLORS[type]
            return (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '24px', height: '16px', borderRadius: '3px', background: bg, border: `1px solid ${border}`, flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--font-body)', fontWeight: 300, fontSize: '13px', color: text }}>{label}</span>
              </div>
            )
          })}
        </div>
      </div>
      {paceZones && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={sectionHeadingStyle}>TARGET PACES</span>
          <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
            {([
              { label: 'Easy', pace: paceZones.easy, color: SESSION_COLORS.easy.text },
              { label: 'Tempo', pace: paceZones.tempo, color: SESSION_COLORS.tempo.text },
              { label: 'Race', pace: paceZones.hard, color: SESSION_COLORS.hard.text },
            ] as const).map(({ label, pace, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '16px', color }}>{formatPace(pace)}</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: C.muted }}>/km</span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300, fontSize: '12px', color: C.muted, marginLeft: '2px' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function DayHeader() {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '56px repeat(7, 1fr)', gap: '6px',
      padding: '14px 16px 10px', borderBottom: '1px solid var(--color-border)',
    }}>
      <div />
      {['Mo','Tu','We','Th','Fr','Sa','Su'].map(d => (
        <div key={d} style={{
          textAlign: 'center', fontFamily: 'var(--font-mono)',
          fontSize: '11px', color: 'var(--color-muted)', letterSpacing: '0.06em',
        }}>{d}</div>
      ))}
    </div>
  )
}

// ─── Interactive week detail card (screen — collapsible) ────────────────────

function WeekDetailCard({ week }: { week: TrainingWeek }) {
  const [open, setOpen] = useState(false)
  const { label: phaseLabel, color: phaseColor } = PHASE_LABELS[week.phase]
  const sessionCount = week.sessions.length

  return (
    <div style={{ ...cardStyle, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', textAlign: 'left',
        }}
      >
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '22px', color: 'var(--color-text)', minWidth: '48px' }}>
          W{String(week.weekNumber).padStart(2, '0')}
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.1em',
          padding: '3px 10px', borderRadius: '20px',
          background: `${phaseColor}18`, color: phaseColor, border: `1px solid ${phaseColor}40`, flexShrink: 0,
        }}>{phaseLabel}</span>
        <span style={{
          flex: 1, fontFamily: 'var(--font-body)', fontWeight: 300, fontSize: '13px',
          color: 'var(--color-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {sessionCount} sessions · {week.totalKm} km total
        </span>
        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
          {week.sessions.map((s, i) => (
            <div key={i} style={{
              width: '10px', height: '10px', borderRadius: '3px',
              background: SESSION_COLORS[s.type].bg, border: `1px solid ${SESSION_COLORS[s.type].border}`,
            }} />
          ))}
        </div>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--color-muted)',
          transition: 'transform 200ms ease', transform: open ? 'rotate(180deg)' : 'rotate(0)', flexShrink: 0,
        }}>▾</span>
      </button>

      {open && <WeekDetailBody week={week} />}
    </div>
  )
}

// Shared detail body (used by both screen card and PDF card)
function WeekDetailBody({ week }: { week: TrainingWeek }) {
  const sessionCount = week.sessions.length
  return (
    <div style={{ borderTop: `1px solid ${C.border}`, padding: '16px 20px 20px' }}>
      <p style={{
        fontFamily: "'DM Sans', sans-serif", fontWeight: 300, fontSize: '13px',
        color: C.muted, lineHeight: 1.6, marginBottom: '16px',
      }}>
        {PHASE_EXPLANATIONS[week.phase]}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {week.sessions.map((session, i) => {
          const sc = SESSION_HEX[session.type]
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px 14px', borderRadius: '8px',
              background: sc.bg, border: `1px solid ${sc.border}`,
            }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px', letterSpacing: '0.06em', color: C.text, minWidth: '80px' }}>
                {DAY_NAMES_FULL[session.day]}
              </span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', letterSpacing: '0.08em', fontWeight: 600, color: sc.text, minWidth: '48px' }}>
                {sc.label.toUpperCase()}
              </span>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '18px', color: sc.text, flex: 1 }}>
                {session.distanceKm}
                <span style={{ fontSize: '12px', fontWeight: 400, opacity: 0.7, marginLeft: '2px' }}>km</span>
              </span>
              {session.targetPaceSec !== undefined && (
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px', color: sc.text, opacity: 0.75 }}>
                  {formatPace(session.targetPaceSec)}/km
                </span>
              )}
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: '24px', marginTop: '14px', paddingTop: '12px', borderTop: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: C.muted, letterSpacing: '0.12em' }}>TOTAL</span>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '16px', color: C.ember }}>{week.totalKm} km</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: C.muted, letterSpacing: '0.12em' }}>SESSIONS</span>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '16px', color: C.text }}>{sessionCount}</span>
        </div>
      </div>
    </div>
  )
}

// ─── PDF-only content (all weeks expanded, no animations, resolved colors) ──

interface PlanPdfContentProps {
  plan: TrainingWeek[]
  planData: PlanData
  title: string
  peakKm: number
  paceZones: PaceZones | null
}

function PlanPdfContent({ plan, planData, title, peakKm, paceZones }: PlanPdfContentProps) {
  const { weeklyMileage, unit, trainingDays, targetFinishTime, raceGoal } = planData

  const pdfCard: React.CSSProperties = {
    background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px',
  }
  const pdfHeading: React.CSSProperties = {
    fontFamily: "'DM Mono', monospace", fontSize: '11px', color: C.muted, letterSpacing: '0.12em',
  }

  const statItems = [
    { label: 'Duration',    value: `${plan.length}`, sub: 'weeks' },
    { label: 'Days / Week', value: `${trainingDays.length}`, sub: 'days' },
    { label: 'Base Volume', value: `${weeklyMileage}`, sub: `${unit}/wk` },
    { label: 'Peak Volume', value: `${peakKm}`, sub: 'km/wk' },
    ...(targetFinishTime ? [{ label: 'Target Time', value: formatFinishTime(targetFinishTime), sub: '' }] : []),
    { label: 'Goal', value: raceGoal ? RACE_GOAL_LABELS[raceGoal] : '—', sub: '' },
  ]

  return (
    <div style={{ padding: '40px 32px 48px' }}>
      {/* ── Header + Stats + Legend (one section) ── */}
      <div data-pdf-section>
        <div style={pdfHeading}>YOUR PLAN IS READY</div>
        <h1 style={{
          fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: '44px',
          lineHeight: 1.05, color: C.text, letterSpacing: '0.01em', marginTop: '8px', marginBottom: 0,
        }}>
          {title}
        </h1>

        {/* Stats */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '24px' }}>
          {statItems.map(({ label, value, sub }) => (
            <div key={label} style={{ ...pdfCard, padding: '14px 16px', minWidth: '120px', flex: '1 1 120px' }}>
              <div style={pdfHeading}>{label.toUpperCase()}</div>
              <div style={{ marginTop: '4px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: '24px', lineHeight: 1, color: C.ember }}>{value}</span>
                {sub && <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300, fontSize: '12px', color: C.muted }}>{sub}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap', marginTop: '20px' }}>
          <div>
            <div style={pdfHeading}>SESSION TYPES</div>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '6px' }}>
              {SESSION_LEGEND.map(({ type, label }) => {
                const sc = SESSION_HEX[type]
                return (
                  <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '20px', height: '14px', borderRadius: '3px', background: sc.bg, border: `1px solid ${sc.border}` }} />
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300, fontSize: '12px', color: sc.text }}>{label}</span>
                  </div>
                )
              })}
            </div>
          </div>
          {paceZones && (
            <div>
              <div style={pdfHeading}>TARGET PACES</div>
              <div style={{ display: 'flex', gap: '14px', marginTop: '6px' }}>
                {([
                  { label: 'Easy', pace: paceZones.easy, color: SESSION_HEX.easy.text },
                  { label: 'Tempo', pace: paceZones.tempo, color: SESSION_HEX.tempo.text },
                  { label: 'Race', pace: paceZones.hard, color: SESSION_HEX.hard.text },
                ] as const).map(({ label, pace, color }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '14px', color }}>{formatPace(pace)}</span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', color: C.muted }}>/km {label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Calendar grid (own section) ── */}
      <div data-pdf-section style={{ marginTop: '32px' }}>
        <div style={pdfHeading}>CALENDAR OVERVIEW</div>
        <div style={{ ...pdfCard, marginTop: '10px', overflow: 'hidden' }}>
          {/* Day header */}
          <div style={{ display: 'flex', padding: '10px 14px 8px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ width: '44px', flexShrink: 0 }} />
            {['Mo','Tu','We','Th','Fr','Sa','Su'].map(d => (
              <div key={d} style={{
                flex: 1, textAlign: 'center', fontFamily: "'DM Mono', monospace",
                fontSize: '10px', color: C.muted, letterSpacing: '0.06em',
              }}>{d}</div>
            ))}
          </div>
          {/* Week rows (no animation) */}
          <div style={{ padding: '8px 14px 14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {plan.map(week => (
              <PdfWeekRow key={week.weekNumber} week={week} />
            ))}
          </div>
        </div>
      </div>

      {/* ── "WEEK-BY-WEEK BREAKDOWN" heading (own section so it sticks with first card) ── */}
      <div style={{ marginTop: '32px' }}>
        <div style={pdfHeading}>WEEK-BY-WEEK BREAKDOWN</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
          {plan.map(week => {
            const { label: phaseLabel, color: phaseColor } = PHASE_LABELS[week.phase]
            return (
              <div key={week.weekNumber} data-pdf-section style={{ ...pdfCard, overflow: 'hidden' }}>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px' }}>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: '20px', color: C.text, minWidth: '44px' }}>
                    W{String(week.weekNumber).padStart(2, '0')}
                  </span>
                  <span style={{
                    fontFamily: "'DM Mono', monospace", fontSize: '9px', letterSpacing: '0.1em',
                    padding: '2px 8px', borderRadius: '20px',
                    background: `${phaseColor}18`, color: phaseColor, border: `1px solid ${phaseColor}40`,
                  }}>{phaseLabel}</span>
                  <span style={{ flex: 1, fontFamily: "'DM Sans', sans-serif", fontWeight: 300, fontSize: '12px', color: C.muted }}>
                    {week.sessions.length} sessions · {week.totalKm} km total
                  </span>
                </div>
                {/* Always-open body */}
                <WeekDetailBody week={week} />
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer watermark */}
      <div data-pdf-section style={{ marginTop: '32px', textAlign: 'center' }}>
        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: '16px', color: C.ember, letterSpacing: '0.2em' }}>
          STRIDE
        </span>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300, fontSize: '11px', color: C.muted, marginLeft: '8px' }}>
          Training Plan
        </span>
      </div>
    </div>
  )
}

// ─── PDF-only mini week row (no animation, no CSS vars) ─────────────────────

function PdfWeekRow({ week }: { week: TrainingWeek }) {
  const sessionsByDay = new Map(week.sessions.map(s => [s.day, s]))

  return (
    <div style={{ display: 'flex', alignItems: 'stretch' }}>
      <div style={{
        width: '44px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        paddingRight: '6px', fontFamily: "'DM Mono', monospace", fontSize: '10px', color: C.muted, letterSpacing: '0.06em',
      }}>
        W{String(week.weekNumber).padStart(2, '0')}
      </div>
      {[0,1,2,3,4,5,6].map(dayIndex => {
        const session = sessionsByDay.get(dayIndex)
        const type = session ? session.type : 'rest'
        const sc = SESSION_HEX[type]
        const isRest = type === 'rest'
        return (
          <div key={dayIndex} style={{
            flex: 1, margin: '0 2px',
            background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: '4px',
            padding: '6px 2px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: '2px', minHeight: '40px', opacity: isRest ? 0.35 : 1,
          }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '8px', color: sc.text, fontWeight: 600, letterSpacing: '0.04em' }}>
              {sc.label.toUpperCase()}
            </span>
            {!isRest && session && (
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '11px', color: sc.text, lineHeight: 1 }}>
                {session.distanceKm}<span style={{ fontSize: '8px', fontWeight: 400, opacity: 0.7 }}>km</span>
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
