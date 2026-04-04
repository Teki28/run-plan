import type { SessionType } from '../utils/generatePlan'

export const SESSION_COLORS: Record<SessionType, { bg: string; border: string; text: string; label: string }> = {
  easy:  { bg: 'rgba(91,173,127,0.15)',  border: 'rgba(91,173,127,0.25)',  text: '#5BAD7F', label: 'Easy'  },
  tempo: { bg: 'rgba(224,123,57,0.15)',  border: 'rgba(224,123,57,0.25)',  text: '#E07B39', label: 'Tempo' },
  hard:  { bg: 'rgba(196,101,90,0.20)',  border: 'rgba(196,101,90,0.30)',  text: '#C4655A', label: 'Hard'  },
  rest:  { bg: 'transparent',            border: 'var(--color-border)',    text: '#2E2D2A', label: 'Rest'  },
}

interface SessionTileProps {
  type: SessionType
  distanceKm?: number   // omit for rest tiles
}

export function SessionTile({ type, distanceKm }: SessionTileProps) {
  const { bg, border, text, label } = SESSION_COLORS[type]
  const isRest = type === 'rest'

  return (
    <div
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: '6px',
        padding: '8px 6px 6px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        minHeight: '56px',
        opacity: isRest ? 0.35 : 1,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: text,
          letterSpacing: '0.06em',
          fontWeight: 600,
        }}
      >
        {label.toUpperCase()}
      </span>

      {!isRest && distanceKm !== undefined && (
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '15px',
            lineHeight: 1,
            color: text,
          }}
        >
          {distanceKm}
          <span style={{ fontSize: '10px', fontWeight: 400, marginLeft: '1px', opacity: 0.7 }}>km</span>
        </span>
      )}
    </div>
  )
}
