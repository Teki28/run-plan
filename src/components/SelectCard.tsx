import { useRef, useState } from 'react'

interface SelectCardProps {
  label: string
  description?: string
  icon?: React.ReactNode
  selected: boolean
  onSelect: () => void
}

export function SelectCard({ label, description, icon, selected, onSelect }: SelectCardProps) {
  const cardRef = useRef<HTMLButtonElement>(null)
  const [floodOrigin, setFloodOrigin] = useState<{ x: number; y: number } | null>(null)
  const [flooding, setFlooding] = useState(false)

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (selected) return

    const rect = cardRef.current!.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    setFloodOrigin({ x, y })
    setFlooding(true)
    onSelect()
  }

  function handleFloodEnd() {
    setFlooding(false)
  }

  return (
    <button
      ref={cardRef}
      onClick={handleClick}
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: selected ? 'var(--color-ember)' : 'var(--color-surface)',
        border: `1px solid ${selected ? 'var(--color-ember)' : 'var(--color-border)'}`,
        borderRadius: '10px',
        padding: '24px 20px',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        transition: 'border-color 120ms ease, transform 120ms ease',
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = 'var(--color-muted)'
          e.currentTarget.style.transform = 'translateY(-2px)'
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = 'var(--color-border)'
          e.currentTarget.style.transform = 'translateY(0)'
        }
      }}
    >
      {/* Flood fill layer */}
      {flooding && floodOrigin && (
        <span
          onAnimationEnd={handleFloodEnd}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'var(--color-ember)',
            animation: 'flood-fill 300ms ease-out forwards',
            pointerEvents: 'none',
            ['--ox' as string]: `${floodOrigin.x}%`,
            ['--oy' as string]: `${floodOrigin.y}%`,
          }}
        />
      )}

      {/* Content */}
      <span style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {icon && (
          <span
            style={{
              fontSize: '24px',
              color: selected ? 'var(--color-canvas)' : 'var(--color-ember)',
              marginBottom: '4px',
            }}
          >
            {icon}
          </span>
        )}
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: '22px',
            color: selected ? 'var(--color-canvas)' : 'var(--color-text)',
            letterSpacing: '0.02em',
          }}
        >
          {label}
        </span>
        {description && (
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 300,
              fontSize: '13px',
              color: selected ? 'rgba(17,17,16,0.7)' : 'var(--color-muted)',
            }}
          >
            {description}
          </span>
        )}
      </span>
    </button>
  )
}
