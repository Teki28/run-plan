interface Stop {
  value: string
  label: string
  icon?: React.ReactNode
  description?: string
}

interface ThreeStopSelectorProps {
  stops: [Stop, Stop, Stop]
  value: string | null
  onChange: (value: string) => void
}

export function ThreeStopSelector({ stops, value, onChange }: ThreeStopSelectorProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1px',
        background: 'var(--color-border)',
        border: '1px solid var(--color-border)',
        borderRadius: '10px',
        overflow: 'hidden',
      }}
    >
      {stops.map((stop) => {
        const active = value === stop.value
        return (
          <button
            key={stop.value}
            onClick={() => onChange(stop.value)}
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              padding: '28px 16px 24px',
              background: active ? 'var(--color-surface)' : 'var(--color-canvas)',
              border: 'none',
              cursor: 'pointer',
              transition: 'background 150ms ease',
            }}
            onMouseEnter={(e) => {
              if (!active) e.currentTarget.style.background = 'var(--color-surface)'
            }}
            onMouseLeave={(e) => {
              if (!active) e.currentTarget.style.background = 'var(--color-canvas)'
            }}
          >
            {/* Ember underline indicator */}
            <span
              style={{
                position: 'absolute',
                bottom: 0,
                left: '20%',
                right: '20%',
                height: '2px',
                borderRadius: '1px',
                background: 'var(--color-ember)',
                transition: 'opacity 200ms ease, transform 200ms ease',
                opacity: active ? 1 : 0,
                transform: active ? 'scaleX(1)' : 'scaleX(0.4)',
              }}
            />

            {stop.icon && (
              <span
                style={{
                  fontSize: '28px',
                  color: active ? 'var(--color-ember)' : 'var(--color-muted)',
                  transition: 'color 150ms ease',
                }}
              >
                {stop.icon}
              </span>
            )}

            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: '18px',
                color: active ? 'var(--color-text)' : 'var(--color-muted)',
                letterSpacing: '0.04em',
                transition: 'color 150ms ease',
              }}
            >
              {stop.label}
            </span>

            {stop.description && (
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 300,
                  fontSize: '12px',
                  color: active ? 'var(--color-muted)' : 'var(--color-border)',
                  textAlign: 'center',
                  lineHeight: '1.4',
                  transition: 'color 150ms ease',
                }}
              >
                {stop.description}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
