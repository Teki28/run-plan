import { useEffect, useRef } from 'react'
import { clampMileage, toDisplayUnit, toStorageKm } from '../utils/units'

// Dial geometry
const SIZE = 280
const CX = SIZE / 2
const CY = SIZE / 2
const RADIUS = 110
const STROKE = 10
const START_ANGLE = 135   // degrees, measured clockwise from 3 o'clock
const SWEEP = 270          // total sweep in degrees

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const s = polarToCartesian(cx, cy, r, startDeg)
  const e = polarToCartesian(cx, cy, r, endDeg)
  const large = endDeg - startDeg > 180 ? 1 : 0
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`
}

interface UnitToggleProps {
  unit: 'km' | 'mi'
  onChange: (u: 'km' | 'mi') => void
}

function UnitToggle({ unit, onChange }: UnitToggleProps) {
  return (
    <div
      style={{
        display: 'flex',
        background: 'var(--color-border)',
        borderRadius: '20px',
        padding: '2px',
        gap: '2px',
      }}
    >
      {(['km', 'mi'] as const).map((u) => (
        <button
          key={u}
          onClick={() => onChange(u)}
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 500,
            fontSize: '12px',
            padding: '4px 12px',
            borderRadius: '16px',
            border: 'none',
            cursor: 'pointer',
            background: unit === u ? 'var(--color-ember)' : 'transparent',
            color: unit === u ? 'var(--color-canvas)' : 'var(--color-muted)',
            transition: 'background 150ms ease, color 150ms ease',
          }}
        >
          {u}
        </button>
      ))}
    </div>
  )
}

interface CircularDialProps {
  valueKm: number
  unit: 'km' | 'mi'
  onValueChange: (km: number) => void
  onUnitChange: (unit: 'km' | 'mi') => void
}

export function CircularDial({ valueKm, unit, onValueChange, onUnitChange }: CircularDialProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const dragging = useRef(false)

  const displayValue = toDisplayUnit(valueKm, unit)
  const max = unit === 'km' ? 200 : 125
  const pct = max > 0 ? displayValue / max : 0
  const fillEnd = START_ANGLE + pct * SWEEP

  function angleToValue(angleDeg: number): number {
    // Normalize angle relative to start
    let rel = angleDeg - START_ANGLE
    if (rel < 0) rel += 360
    if (rel > SWEEP) rel = rel < SWEEP + (360 - SWEEP) / 2 ? SWEEP : 0
    const display = Math.round((rel / SWEEP) * max)
    return toStorageKm(clampMileage(display, unit), unit)
  }

  function getAngleFromEvent(e: MouseEvent | TouchEvent): number {
    const svg = svgRef.current!
    const rect = svg.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const x = ((clientX - rect.left) / rect.width) * SIZE - CX
    const y = ((clientY - rect.top) / rect.height) * SIZE - CY
    let deg = (Math.atan2(y, x) * 180) / Math.PI + 90
    if (deg < 0) deg += 360
    return deg
  }

  useEffect(() => {
    function onMove(e: MouseEvent | TouchEvent) {
      if (!dragging.current) return
      e.preventDefault()
      onValueChange(angleToValue(getAngleFromEvent(e)))
    }
    function onUp() { dragging.current = false }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onUp)
    }
  }, [unit, max])

  function step(delta: number) {
    const next = clampMileage(displayValue + delta, unit)
    onValueChange(toStorageKm(next, unit))
  }

  function handleUnitChange(u: 'km' | 'mi') {
    onUnitChange(u)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
      <div style={{ position: 'relative', width: SIZE, height: SIZE }}>
        <svg
          ref={svgRef}
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          style={{ cursor: 'grab', userSelect: 'none' }}
          onMouseDown={() => { dragging.current = true }}
          onTouchStart={() => { dragging.current = true }}
        >
          {/* Track */}
          <path
            d={arcPath(CX, CY, RADIUS, START_ANGLE, START_ANGLE + SWEEP)}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth={STROKE}
            strokeLinecap="round"
          />

          {/* Fill */}
          {pct > 0 && (
            <path
              d={arcPath(CX, CY, RADIUS, START_ANGLE, fillEnd)}
              fill="none"
              stroke="var(--color-ember)"
              strokeWidth={STROKE}
              strokeLinecap="round"
              style={{ transition: 'none' }}
            />
          )}

          {/* Thumb dot */}
          {(() => {
            const thumb = polarToCartesian(CX, CY, RADIUS, fillEnd)
            return (
              <circle
                cx={thumb.x}
                cy={thumb.y}
                r={STROKE * 0.9}
                fill="var(--color-ember)"
              />
            )
          })()}
        </svg>

        {/* Center readout */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: '64px',
              lineHeight: 1,
              color: 'var(--color-ember)',
              transition: 'transform 100ms ease',
            }}
          >
            {displayValue}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--color-muted)',
              letterSpacing: '0.1em',
            }}
          >
            {unit} / week
          </span>
        </div>
      </div>

      {/* +/- buttons and unit toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={() => step(-1)}
          aria-label="Decrease"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            fontSize: '20px',
            lineHeight: 1,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          −
        </button>

        <UnitToggle unit={unit} onChange={handleUnitChange} />

        <button
          onClick={() => step(1)}
          aria-label="Increase"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            fontSize: '20px',
            lineHeight: 1,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          +
        </button>
      </div>
    </div>
  )
}
