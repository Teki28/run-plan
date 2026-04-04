import { useState } from 'react'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface DayPillsProps {
  selected: number[]
  onChange: (days: number[]) => void
}

export function DayPills({ selected, onChange }: DayPillsProps) {
  const [shaking, setShaking] = useState(false)

  function toggle(index: number) {
    const isSelected = selected.includes(index)

    if (isSelected && selected.length <= 2) {
      if (shaking) return
      setShaking(true)
      return
    }

    if (isSelected) {
      onChange(selected.filter((d) => d !== index))
    } else {
      onChange([...selected, index].sort((a, b) => a - b))
    }
  }

  return (
    <div
      className={shaking ? 'shake' : ''}
      onAnimationEnd={() => setShaking(false)}
      style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}
    >
      {DAYS.map((day, i) => {
        const active = selected.includes(i)
        return (
          <button
            key={day}
            onClick={() => toggle(i)}
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
              fontSize: '13px',
              padding: '10px 16px',
              borderRadius: '24px',
              border: `1px solid ${active ? 'var(--color-ember)' : 'var(--color-border)'}`,
              background: active ? 'var(--color-ember)' : 'var(--color-surface)',
              color: active ? 'var(--color-canvas)' : 'var(--color-muted)',
              cursor: 'pointer',
              transition: 'background 150ms ease, border-color 150ms ease, color 150ms ease, transform 120ms ease',
            }}
            onMouseEnter={(e) => {
              if (!active) e.currentTarget.style.borderColor = 'var(--color-muted)'
            }}
            onMouseLeave={(e) => {
              if (!active) e.currentTarget.style.borderColor = 'var(--color-border)'
            }}
          >
            {day}
          </button>
        )
      })}
    </div>
  )
}
