interface StickyNavProps {
  onNext: () => void
  onBack?: () => void
  nextLabel?: string
  canGoBack?: boolean
  disabled?: boolean
}

export function StickyNav({
  onNext,
  onBack,
  nextLabel = 'Continue →',
  canGoBack = false,
  disabled = false,
}: StickyNavProps) {
  return (
    <div
      className="shrink-0 flex items-center justify-between px-8 pt-6"
      style={{
        borderTop: '1px solid var(--color-border)',
        paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 12px))',
      }}
    >
      {canGoBack ? (
        <button
          onClick={onBack}
          className="transition-colors"
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 500,
            fontSize: '14px',
            color: 'var(--color-muted)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-muted)')}
        >
          ← Back
        </button>
      ) : (
        <span />
      )}

      <button
        onClick={onNext}
        disabled={disabled}
        style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 500,
          fontSize: '14px',
          background: disabled ? 'var(--color-border)' : 'var(--color-ember)',
          color: disabled ? 'var(--color-muted)' : 'var(--color-canvas)',
          border: 'none',
          borderRadius: '6px',
          padding: '12px 28px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'opacity 150ms ease',
        }}
        onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.opacity = '0.88' }}
        onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.opacity = '1' }}
      >
        {nextLabel}
      </button>
    </div>
  )
}
