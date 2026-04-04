interface Chip {
  value: string
  label: string
}

interface ChipGridProps {
  chips: Chip[]
  selected: string[]
  onChange: (values: string[]) => void
  onSkip?: () => void
  reassuranceNote?: string
}

export function ChipGrid({ chips, selected, onChange, onSkip, reassuranceNote }: ChipGridProps) {
  const hasNonNone = selected.some((v) => v !== 'none')

  function toggle(value: string) {
    if (value === 'none') {
      onChange(selected.includes('none') ? [] : ['none'])
      return
    }

    const withoutNone = selected.filter((v) => v !== 'none')
    if (withoutNone.includes(value)) {
      onChange(withoutNone.filter((v) => v !== value))
    } else {
      onChange([...withoutNone, value])
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Chip grid */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {chips.map(({ value, label }) => {
          const active = selected.includes(value)
          return (
            <button
              key={value}
              onClick={() => toggle(value)}
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                fontSize: '14px',
                padding: '10px 20px',
                borderRadius: '24px',
                border: `1px solid ${active ? 'var(--color-ember)' : 'var(--color-border)'}`,
                background: active ? 'rgba(224,123,57,0.12)' : 'var(--color-surface)',
                color: active ? 'var(--color-ember)' : 'var(--color-muted)',
                cursor: 'pointer',
                transition: 'background 150ms ease, border-color 150ms ease, color 150ms ease',
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.borderColor = 'var(--color-muted)'
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.borderColor = 'var(--color-border)'
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Reassurance note */}
      {hasNonNone && reassuranceNote && (
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 300,
            fontSize: '13px',
            color: 'var(--color-muted)',
            lineHeight: '1.5',
            padding: '12px 14px',
            borderLeft: '2px solid var(--color-ember)',
            background: 'rgba(224,123,57,0.05)',
            borderRadius: '0 6px 6px 0',
          }}
        >
          {reassuranceNote}
        </p>
      )}

      {/* Skip link */}
      {onSkip && (
        <button
          onClick={onSkip}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            fontWeight: 500,
            fontSize: '13px',
            color: 'var(--color-muted)',
            textAlign: 'left',
            padding: 0,
            transition: 'color 150ms ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-muted)')}
        >
          Skip → No injuries to report
        </button>
      )}
    </div>
  )
}
