import type { TrainingWeek } from '../utils/generatePlan'
import { SessionTile } from './SessionTile'

const DAY_NAMES = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

interface WeekRowProps {
  week: TrainingWeek
  rowIndex: number   // for cascade stagger
}

export function WeekRow({ week, rowIndex }: WeekRowProps) {
  const sessionsByDay = new Map(week.sessions.map(s => [s.day, s]))
  const staggerDelay = rowIndex * 50

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '48px repeat(7, 1fr)',
        gap: '6px',
        alignItems: 'stretch',
        animation: `week-row-enter 320ms cubic-bezier(0.25,0.46,0.45,0.94) ${staggerDelay}ms both`,
      }}
    >
      {/* Week label */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingRight: '8px',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--color-muted)',
          letterSpacing: '0.06em',
          flexShrink: 0,
        }}
      >
        W{String(week.weekNumber).padStart(2, '0')}
      </div>

      {/* 7 day slots */}
      {DAY_NAMES.map((_, dayIndex) => {
        const session = sessionsByDay.get(dayIndex)
        return (
          <SessionTile
            key={dayIndex}
            type={session ? session.type : 'rest'}
            distanceKm={session?.distanceKm}
            targetPaceSec={session?.targetPaceSec}
          />
        )
      })}
    </div>
  )
}
