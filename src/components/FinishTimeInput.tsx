import { useState } from 'react'
import type { RaceGoal } from '../types/plan'

interface FinishTimeInputProps {
  valueSec: number | null
  raceGoal: RaceGoal | null
  onChange: (sec: number | null) => void
}

const RACE_DEFAULTS: Partial<Record<RaceGoal, number>> = {
  '5k':   30 * 60,
  '10k':  60 * 60,
  'half': 2 * 3600,
  'full': 4 * 3600,
}

const REFS: Partial<Record<RaceGoal, { label: string; sec: number }[]>> = {
  '5k':   [{ label: '25:00', sec: 25*60 }, { label: '30:00', sec: 30*60 }, { label: '35:00', sec: 35*60 }],
  '10k':  [{ label: '50:00', sec: 50*60 }, { label: '1:00:00', sec: 3600 }, { label: '1:15:00', sec: 75*60 }],
  'half': [{ label: '1:45:00', sec: 6300 }, { label: '2:00:00', sec: 7200 }, { label: '2:30:00', sec: 9000 }],
  'full': [{ label: '3:30:00', sec: 12600 }, { label: '4:00:00', sec: 14400 }, { label: '5:00:00', sec: 18000 }],
}

function secToHMS(sec: number): [number, number, number] {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return [h, m, s]
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

interface SegmentProps {
  label: string
  value: number
  isActive: boolean
  onUp: () => void
  onDown: () => void
}

function Segment({ label, value, isActive, onUp, onDown }: SegmentProps) {
  const btnStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    color: isActive ? 'var(--color-muted)' : 'var(--color-border)',
    padding: '4px 10px',
    borderRadius: '4px',
    transition: 'color 150ms ease',
    lineHeight: 1,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <button
        style={btnStyle}
        onClick={onUp}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text)')}
        onMouseLeave={e => (e.currentTarget.style.color = isActive ? 'var(--color-muted)' : 'var(--color-border)')}
      >
        ▲
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          letterSpacing: '0.12em',
          color: 'var(--color-muted)',
        }}>
          {label}
        </span>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: '64px',
          lineHeight: 1,
          color: isActive ? 'var(--color-ember)' : 'var(--color-border)',
          transition: 'color 200ms ease',
          minWidth: '80px',
          textAlign: 'center',
          userSelect: 'none',
        }}>
          {pad(value)}
        </span>
      </div>

      <button
        style={btnStyle}
        onClick={onDown}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text)')}
        onMouseLeave={e => (e.currentTarget.style.color = isActive ? 'var(--color-muted)' : 'var(--color-border)')}
      >
        ▼
      </button>
    </div>
  )
}

function Colon({ isActive }: { isActive: boolean }) {
  return (
    <span style={{
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: '48px',
      lineHeight: 1,
      color: isActive ? 'var(--color-ember)' : 'var(--color-border)',
      transition: 'color 200ms ease',
      paddingBottom: '18px',
      userSelect: 'none',
    }}>
      :
    </span>
  )
}

export function FinishTimeInput({ valueSec, raceGoal, onChange }: FinishTimeInputProps) {
  const defaultSec = (raceGoal && RACE_DEFAULTS[raceGoal]) ?? 30 * 60
  const [localSec, setLocalSec] = useState<number>(valueSec ?? defaultSec)
  const [isActive, setIsActive] = useState<boolean>(valueSec !== null)

  const [h, m, s] = secToHMS(localSec)
  const refs = raceGoal ? REFS[raceGoal] : undefined

  // Fitness goal: no specific time target
  if (raceGoal === 'fitness') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        padding: '32px',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        textAlign: 'center',
      }}>
        <span style={{ fontSize: '28px' }}>🏃</span>
        <p style={{ fontFamily: 'var(--font-body)', fontWeight: 300, fontSize: '15px', color: 'var(--color-muted)', lineHeight: 1.6 }}>
          General fitness training doesn't have a fixed race distance,
          <br />so there's no finish time to target.
        </p>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-border)', letterSpacing: '0.08em' }}>
          WE'LL KEEP YOU MOVING — NO CLOCK REQUIRED
        </p>
      </div>
    )
  }

  function adjust(segment: 'h' | 'm' | 's', delta: number) {
    const [nh, nm, ns] = secToHMS(localSec)
    let newH = nh, newM = nm, newS = ns
    if (segment === 'h') newH = Math.max(0, nh + delta)
    if (segment === 'm') newM = (nm + delta + 60) % 60
    if (segment === 's') newS = (ns + delta + 60) % 60
    const newSec = newH * 3600 + newM * 60 + newS
    setLocalSec(newSec)
    setIsActive(true)
    onChange(newSec)
  }

  function handleRef(sec: number) {
    setLocalSec(sec)
    setIsActive(true)
    onChange(sec)
  }

  function handleSkip() {
    setIsActive(false)
    onChange(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px' }}>

      {/* HH : MM : SS segments */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Segment label="HR"  value={h} isActive={isActive} onUp={() => adjust('h', 1)} onDown={() => adjust('h', -1)} />
        <Colon isActive={isActive} />
        <Segment label="MIN" value={m} isActive={isActive} onUp={() => adjust('m', 1)} onDown={() => adjust('m', -1)} />
        <Colon isActive={isActive} />
        <Segment label="SEC" value={s} isActive={isActive} onUp={() => adjust('s', 1)} onDown={() => adjust('s', -1)} />
      </div>

      {/* Reference quick-pick chips */}
      {refs && refs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-muted)', letterSpacing: '0.1em' }}>
            COMMON TARGETS
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {refs.map(ref => {
              const active = isActive && localSec === ref.sec
              return (
                <button
                  key={ref.label}
                  onClick={() => handleRef(ref.sec)}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    letterSpacing: '0.04em',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    border: `1px solid ${active ? 'var(--color-ember)' : 'var(--color-border)'}`,
                    background: active ? 'rgba(224,123,57,0.12)' : 'transparent',
                    color: active ? 'var(--color-ember)' : 'var(--color-muted)',
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      e.currentTarget.style.borderColor = 'var(--color-muted)'
                      e.currentTarget.style.color = 'var(--color-text)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      e.currentTarget.style.borderColor = 'var(--color-border)'
                      e.currentTarget.style.color = 'var(--color-muted)'
                    }
                  }}
                >
                  {ref.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Skip link */}
      <button
        onClick={handleSkip}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'var(--font-body)',
          fontWeight: 300,
          fontSize: '13px',
          color: isActive ? 'var(--color-muted)' : 'var(--color-ember)',
          textDecoration: 'underline',
          textDecorationColor: 'transparent',
          transition: 'color 150ms ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text)')}
        onMouseLeave={e => (e.currentTarget.style.color = isActive ? 'var(--color-muted)' : 'var(--color-ember)')}
      >
        {isActive ? 'Clear — I\'ll run for fun →' : 'Skip — no time goal →'}
      </button>
    </div>
  )
}
