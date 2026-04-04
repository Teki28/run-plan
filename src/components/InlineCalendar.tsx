import { useState } from 'react'
import { toDateString, isSelectable, weeksToGoLabel, daysInMonth } from '../utils/dates'

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]
const DAY_LABELS = ['Mo','Tu','We','Th','Fr','Sa','Su']

function startDayOffset(year: number, month: number): number {
  // Monday-first: getDay() returns 0=Sun, so shift
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1
}

interface InlineCalendarProps {
  value: string | null
  onChange: (date: string) => void
}

export function InlineCalendar({ value, onChange }: InlineCalendarProps) {
  const today = toDateString(new Date())
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [month, setMonth] = useState(() => new Date().getMonth())

  const days = daysInMonth(year, month)
  const offset = startDayOffset(year, month)

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Month navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={prevMonth}
          style={{
            background: 'none',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            color: 'var(--color-muted)',
            width: '32px',
            height: '32px',
            cursor: 'pointer',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ‹
        </button>

        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: '18px',
            color: 'var(--color-text)',
            letterSpacing: '0.04em',
          }}
        >
          {MONTH_NAMES[month]} {year}
        </span>

        <button
          onClick={nextMonth}
          style={{
            background: 'none',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            color: 'var(--color-muted)',
            width: '32px',
            height: '32px',
            cursor: 'pointer',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ›
        </button>
      </div>

      {/* Day-of-week headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
        {DAY_LABELS.map((d) => (
          <div
            key={d}
            style={{
              textAlign: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--color-muted)',
              paddingBottom: '4px',
            }}
          >
            {d}
          </div>
        ))}

        {/* Empty cells for offset */}
        {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}

        {/* Day cells */}
        {days.map((d) => {
          const dateStr = toDateString(d)
          const selectable = isSelectable(dateStr, today)
          const isSelected = value === dateStr
          const isPast = dateStr < today

          return (
            <button
              key={dateStr}
              onClick={() => selectable && onChange(dateStr)}
              disabled={!selectable}
              style={{
                aspectRatio: '1',
                borderRadius: '50%',
                border: isSelected ? '2px solid var(--color-ember)' : '2px solid transparent',
                background: isSelected ? 'var(--color-ember)' : 'transparent',
                color: isSelected
                  ? 'var(--color-canvas)'
                  : isPast || !selectable
                  ? 'var(--color-border)'
                  : 'var(--color-text)',
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                fontSize: '13px',
                cursor: selectable ? 'pointer' : 'default',
                transition: 'background 150ms ease, color 150ms ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => {
                if (selectable && !isSelected)
                  e.currentTarget.style.background = 'var(--color-surface)'
              }}
              onMouseLeave={(e) => {
                if (selectable && !isSelected)
                  e.currentTarget.style.background = 'transparent'
              }}
            >
              {d.getDate()}
            </button>
          )
        })}
      </div>

      {/* Weeks to go badge */}
      {value && (
        <div style={{ textAlign: 'center', marginTop: '4px' }}>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: '22px',
              color: 'var(--color-gold)',
              letterSpacing: '0.08em',
            }}
          >
            {weeksToGoLabel(value, today)}
          </span>
        </div>
      )}
    </div>
  )
}
