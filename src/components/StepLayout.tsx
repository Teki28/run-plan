import { StickyNav } from './StickyNav'

interface StepLayoutProps {
  question: string
  helper?: string
  onNext: () => void
  onBack: () => void
  nextLabel?: string
  nextDisabled?: boolean
  children: React.ReactNode
}

export function StepLayout({
  question,
  helper,
  onNext,
  onBack,
  nextLabel,
  nextDisabled,
  children,
}: StepLayoutProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-8">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: '36px',
              lineHeight: '1.1',
              color: 'var(--color-text)',
              letterSpacing: '0.01em',
            }}
          >
            {question}
          </h2>
          {helper && (
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 300,
                fontSize: '15px',
                color: 'var(--color-muted)',
                lineHeight: '1.5',
              }}
            >
              {helper}
            </p>
          )}
        </div>
        {children}
      </div>
      <StickyNav
        onNext={onNext}
        onBack={onBack}
        canGoBack
        nextLabel={nextLabel}
        disabled={nextDisabled}
      />
    </div>
  )
}
