import type { PlanData } from '../types/plan'

const RACE_GOAL_LABELS: Record<string, string> = {
  '5k': '5K',
  '10k': '10K',
  'half': 'Half Marathon',
  'full': 'Full Marathon',
  'fitness': 'General Fitness',
}

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

const DAY_NAMES = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

interface PreviewPanelProps {
  planData: PlanData
  currentStep: number
}

// Lit = real data; Ghost = placeholder
function Lit({ children, active, delay = 0 }: { children: React.ReactNode; active: boolean; delay?: number }) {
  return (
    <span
      style={{
        transition: 'opacity 300ms ease, color 300ms ease',
        opacity: active ? 1 : 1,
        animation: active ? `preview-fade-in 250ms ease-out ${delay}ms both` : undefined,
      }}
    >
      {children}
    </span>
  )
}

export function PreviewPanel({ planData, currentStep }: PreviewPanelProps) {
  const { raceGoal, targetFinishTime, experienceLevel, weeklyMileage, unit, trainingDays, raceDate, injuries } = planData

  const hasGoal        = currentStep >= 1 && !!raceGoal
  const hasLevel       = currentStep >= 3 && !!experienceLevel
  const hasTitle       = hasGoal && hasLevel
  const hasMileage     = currentStep >= 4
  const hasDays        = currentStep >= 5 && trainingDays.length >= 2
  const hasDate        = currentStep >= 6 && !!raceDate
  const hasInjuries    = currentStep >= 7 && injuries.some(i => i !== 'none')
  const hasFinishTime  = currentStep >= 2 && !!planData.targetFinishTime
  const stepsCompleted = [hasGoal, hasLevel, hasMileage, hasDays, hasDate].filter(Boolean).length
  const glowIntensity  = 0.06 + stepsCompleted * 0.03

  const goalLabel  = raceGoal ? RACE_GOAL_LABELS[raceGoal] : null
  const levelLabel = experienceLevel ? LEVEL_LABELS[experienceLevel] : null

  const weeksUntil = raceDate
    ? Math.max(0, Math.floor((new Date(raceDate).getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000)))
    : null

  const mileageMax = unit === 'km' ? 200 : 125
  const milagePct  = Math.min((weeklyMileage / mileageMax) * 100, 100)

  return (
    <div
      className="relative flex flex-col justify-center h-full overflow-hidden"
      style={{ background: 'var(--color-canvas)', padding: '0 40px' }}
    >
      {/* Noise texture */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id="preview-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
            <feBlend in="SourceGraphic" mode="overlay" />
          </filter>
        </defs>
      </svg>
      <div className="absolute inset-0 pointer-events-none" style={{ filter: 'url(#preview-grain)', opacity: 0.05 }} />

      {/* Ambient glow — grows as plan fills */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: '700px', height: '700px',
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(224,123,57,${glowIntensity}) 0%, rgba(224,123,57,${glowIntensity * 0.3}) 45%, transparent 70%)`,
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          transition: 'background 600ms ease',
        }}
      />

      {/* Plan card */}
      <div
        className="relative flex flex-col gap-7"
        style={{
          background: 'var(--color-surface)',
          border: `1px solid ${stepsCompleted > 0 ? 'var(--color-border)' : 'rgba(46,45,42,0.5)'}`,
          borderRadius: '14px',
          padding: '32px',
          transition: 'border-color 400ms ease',
        }}
      >
        {/* Header: goal badge + title */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Goal badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '0.12em',
                color: 'var(--color-muted)',
              }}
            >
              GOAL
            </span>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: '13px',
                letterSpacing: '0.06em',
                padding: '3px 14px',
                borderRadius: '20px',
                border: `1px solid ${hasGoal ? 'var(--color-ember)' : 'var(--color-border)'}`,
                background: hasGoal ? 'var(--color-ember)' : 'transparent',
                color: hasGoal ? 'var(--color-canvas)' : 'var(--color-border)',
                transition: 'all 300ms ease',
              }}
            >
              {goalLabel ?? '— — —'}
            </span>
          </div>

          {/* Plan title */}
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: '42px',
              lineHeight: '1.05',
              letterSpacing: '0.01em',
              color: hasTitle ? 'var(--color-text)' : 'var(--color-border)',
              transition: 'color 400ms ease',
            }}
          >
            {hasTitle
              ? <Lit active={hasTitle} delay={50}>{levelLabel} {goalLabel}<br />Plan</Lit>
              : <>Your Training<br />Plan</>
            }
          </p>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'var(--color-border)' }} />

        {/* Stats row */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* Base mileage */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-muted)', letterSpacing: '0.08em' }}>
                BASE MILEAGE
              </span>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '28px',
                lineHeight: 1,
                color: hasMileage && weeklyMileage > 0 ? 'var(--color-ember)' : 'var(--color-border)',
                transition: 'color 300ms ease',
              }}>
                {hasMileage && weeklyMileage > 0
                  ? <><Lit active delay={80}>{weeklyMileage}</Lit><span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--color-muted)', marginLeft: '4px' }}>{unit}/wk</span></>
                  : <span style={{ fontSize: '20px' }}>—</span>
                }
              </span>
            </div>
            <div style={{ height: '5px', background: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${hasMileage && weeklyMileage > 0 ? milagePct : 0}%`,
                background: 'var(--color-ember)',
                borderRadius: '3px',
                transition: 'width 400ms ease-out',
              }} />
            </div>
          </div>

          {/* Plan length */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-muted)', letterSpacing: '0.08em' }}>
                PLAN LENGTH
              </span>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '28px',
                lineHeight: 1,
                color: hasDate ? 'var(--color-gold)' : 'var(--color-border)',
                transition: 'color 300ms ease',
              }}>
                {hasDate && weeksUntil !== null
                  ? <><Lit active delay={80}>{weeksUntil}</Lit><span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--color-muted)', marginLeft: '4px' }}>weeks</span></>
                  : <span style={{ fontSize: '20px' }}>—</span>
                }
              </span>
            </div>
            <div style={{ height: '5px', background: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: hasDate && weeksUntil ? `${Math.min((weeksUntil / 24) * 100, 100)}%` : '0%',
                background: 'var(--color-gold)',
                borderRadius: '3px',
                transition: 'width 400ms ease-out',
              }} />
            </div>
          </div>
        </div>

        {/* Target finish time */}
        {hasFinishTime && targetFinishTime !== null && (() => {
          const h = Math.floor(targetFinishTime / 3600)
          const m = Math.floor((targetFinishTime % 3600) / 60)
          const s = targetFinishTime % 60
          const fmt = h > 0
            ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
            : `${m}:${String(s).padStart(2,'0')}`
          return (
            <div style={{ animation: 'preview-fade-in 250ms ease-out both' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-muted)', letterSpacing: '0.08em' }}>
                  TARGET TIME
                </span>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '28px', lineHeight: 1, color: 'var(--color-gold)' }}>
                  {fmt}
                </span>
              </div>
            </div>
          )
        })()}

        {/* Training days */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-muted)', letterSpacing: '0.08em' }}>
            TRAINING DAYS
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {DAY_NAMES.map((name, i) => {
              const active = hasDays && trainingDays.includes(i)
              return (
                <div
                  key={name}
                  style={{
                    flex: 1,
                    aspectRatio: '1',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: active ? 'var(--color-ember)' : 'transparent',
                    color: active ? 'var(--color-canvas)' : 'var(--color-border)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    fontWeight: active ? 600 : 400,
                    border: `1px solid ${active ? 'var(--color-ember)' : 'var(--color-border)'}`,
                    transition: 'all 200ms ease',
                  }}
                >
                  {name}
                </div>
              )
            })}
          </div>
        </div>

        {/* Injury note */}
        {hasInjuries && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(224,123,57,0.06)',
              border: '1px solid rgba(224,123,57,0.18)',
              animation: 'preview-fade-in 250ms ease-out both',
            }}
          >
            <span style={{ fontSize: '13px', marginTop: '1px' }}>⚡</span>
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 300, fontSize: '13px', color: 'var(--color-muted)', lineHeight: '1.5' }}>
              High-impact sessions adjusted for your injury history
            </span>
          </div>
        )}

        {/* Ghost hint when nothing filled yet */}
        {stepsCompleted === 0 && (
          <p style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 300,
            fontSize: '13px',
            color: 'var(--color-border)',
            textAlign: 'center',
            marginTop: '-8px',
            letterSpacing: '0.02em',
          }}>
            Your plan takes shape as you answer
          </p>
        )}
      </div>
    </div>
  )
}

/** Compact horizontal summary strip — shown on tablet instead of full panel */
export function PreviewStrip({ planData, currentStep }: PreviewPanelProps) {
  const { raceGoal, experienceLevel, weeklyMileage, unit, raceDate } = planData

  const items: { label: string; value: string; color?: string }[] = []

  if (currentStep >= 1 && raceGoal)
    items.push({ label: 'Goal', value: RACE_GOAL_LABELS[raceGoal], color: 'var(--color-ember)' })
  if (currentStep >= 3 && experienceLevel)
    items.push({ label: 'Level', value: LEVEL_LABELS[experienceLevel] })
  if (currentStep >= 4 && weeklyMileage > 0)
    items.push({ label: 'Base', value: `${weeklyMileage} ${unit}/wk` })
  if (currentStep >= 6 && raceDate) {
    const weeks = Math.max(0, Math.floor((new Date(raceDate).getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000)))
    items.push({ label: 'Length', value: `${weeks} wks`, color: 'var(--color-gold)' })
  }

  if (items.length === 0) return null

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '24px',
      padding: '10px 24px',
      borderTop: '1px solid var(--color-border)',
      background: 'var(--color-surface)',
      overflowX: 'auto',
    }}>
      {items.map(({ label, value, color }) => (
        <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '2px', flexShrink: 0 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-muted)', letterSpacing: '0.08em' }}>
            {label.toUpperCase()}
          </span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14px', color: color ?? 'var(--color-text)' }}>
            {value}
          </span>
        </div>
      ))}
    </div>
  )
}
