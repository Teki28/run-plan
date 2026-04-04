import { useMemo, useRef, useState } from 'react'
import { WeekRow } from '../components/WeekRow'
import { SESSION_COLORS } from '../components/SessionTile'
import { generatePlan } from '../utils/generatePlan'
import type { SessionType } from '../utils/generatePlan'
import type { PlanData } from '../types/plan'

const RACE_GOAL_LABELS: Record<string, string> = {
  '5k': '5K', '10k': '10K', 'half': 'Half Marathon',
  'full': 'Full Marathon', 'fitness': 'General Fitness',
}
const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced',
}
const SESSION_LEGEND: { type: SessionType; label: string }[] = [
  { type: 'easy',  label: 'Easy run' },
  { type: 'tempo', label: 'Tempo / moderate' },
  { type: 'hard',  label: 'Hard / long run' },
  { type: 'rest',  label: 'Rest day' },
]

// ─── Left panel: summary card ──────────────────────────────────────────────

interface PlanRevealProps {
  planData: PlanData
  totalWeeks: number
  onBack: () => void
  onSave: () => void
}

export function PlanReveal({ planData, totalWeeks, onBack, onSave }: PlanRevealProps) {
  const { raceGoal, experienceLevel, weeklyMileage, unit, trainingDays } = planData
  const title = raceGoal && experienceLevel
    ? `${LEVEL_LABELS[experienceLevel]} ${RACE_GOAL_LABELS[raceGoal]} Plan`
    : 'Your Training Plan'

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-8">

        {/* Title */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-muted)', letterSpacing: '0.1em' }}>
            YOUR PLAN IS READY
          </span>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: '40px',
            lineHeight: '1.05',
            color: 'var(--color-text)',
            letterSpacing: '0.01em',
          }}>
            {title}
          </h2>
        </div>

        {/* Stats grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
        }}>
          {[
            { label: 'Duration',  value: `${totalWeeks} weeks` },
            { label: 'Days/week', value: `${trainingDays.length} days` },
            { label: 'Base mileage', value: `${weeklyMileage} ${unit}/wk` },
            { label: 'Goal',      value: raceGoal ? RACE_GOAL_LABELS[raceGoal] : '—' },
          ].map(({ label, value }) => (
            <div key={label} style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '10px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-muted)', letterSpacing: '0.08em' }}>
                {label.toUpperCase()}
              </span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '24px', color: 'var(--color-ember)' }}>
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Session legend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-muted)', letterSpacing: '0.08em' }}>
            SESSION TYPES
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {SESSION_LEGEND.map(({ type, label }) => {
              const { bg, border, text } = SESSION_COLORS[type]
              return (
                <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '28px', height: '20px',
                    borderRadius: '4px',
                    background: bg,
                    border: `1px solid ${border}`,
                    flexShrink: 0,
                  }} />
                  <span style={{ fontFamily: 'var(--font-body)', fontWeight: 300, fontSize: '14px', color: text }}>
                    {label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Footer nav */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '24px 32px',
        borderTop: '1px solid var(--color-border)',
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: '14px',
            color: 'var(--color-muted)',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-muted)')}
        >
          ← Back
        </button>
        <button
          onClick={onSave}
          style={{
            fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: '14px',
            background: 'var(--color-ember)', color: 'var(--color-canvas)',
            border: 'none', borderRadius: '6px', padding: '12px 28px', cursor: 'pointer',
            transition: 'opacity 150ms ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          Save my plan →
        </button>
      </div>
    </div>
  )
}

// ─── Right panel: scrollable calendar with shimmer ─────────────────────────

interface PlanCalendarProps {
  planData: PlanData
}

export function PlanCalendar({ planData }: PlanCalendarProps) {
  const plan = useMemo(() => generatePlan(planData), [planData])
  const [shimmerDone, setShimmerDone] = useState(false)
  const shimmerRef = useRef<HTMLDivElement>(null)

  const cascadeDurationMs = plan.length * 50 + 320  // last row finishes at this point

  if (plan.length === 0) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-body)' }}>
        No plan generated yet.
      </div>
    )
  }

  return (
    <div className="relative flex flex-col h-full overflow-hidden" style={{ background: 'var(--color-canvas)' }}>
      {/* Day-of-week header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '48px repeat(7, 1fr)',
        gap: '6px',
        padding: '16px 20px 8px',
        borderBottom: '1px solid var(--color-border)',
        flexShrink: 0,
      }}>
        <div />
        {['Mo','Tu','We','Th','Fr','Sa','Su'].map(d => (
          <div key={d} style={{
            textAlign: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--color-muted)',
            letterSpacing: '0.06em',
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* Scrollable week rows */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '12px 20px 20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
          {plan.map((week, i) => (
            <WeekRow key={week.weekNumber} week={week} rowIndex={i} />
          ))}

          {/* Shimmer sweep overlay */}
          {!shimmerDone && (
            <div
              ref={shimmerRef}
              onAnimationEnd={() => setShimmerDone(true)}
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(90deg, transparent 0%, rgba(232,224,208,0.06) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: `shimmer-sweep 600ms ease-out ${cascadeDurationMs}ms both`,
                pointerEvents: 'none',
                borderRadius: '6px',
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
