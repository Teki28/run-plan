import { ProgressBar } from './ProgressBar'

interface AppShellProps {
  currentStep: number
  totalSteps: number
  leftPanel: React.ReactNode
  rightPanel: React.ReactNode
}

export function AppShell({ currentStep, totalSteps, leftPanel, rightPanel }: AppShellProps) {
  const isSplash = currentStep === 0

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col" style={{ background: 'var(--color-canvas)' }}>
      {/* Top bar — hidden on splash */}
      {!isSplash && (
        <header
          className="flex items-center px-8 shrink-0"
          style={{ height: '56px', borderBottom: '1px solid var(--color-border)' }}
        >
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: '20px',
              color: 'var(--color-ember)',
              letterSpacing: '0.2em',
            }}
          >
            STRIDE
          </span>

          <div className="flex-1 mx-8">
            <ProgressBar current={currentStep} total={totalSteps} />
          </div>

          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--color-muted)',
            }}
          >
            {String(currentStep).padStart(2, '0')} / {String(totalSteps - 1).padStart(2, '0')}
          </span>
        </header>
      )}

      {/* Content area */}
      <div className="content-area flex flex-1 min-h-0">
        {isSplash ? (
          <div className="flex-1">{leftPanel}</div>
        ) : (
          <>
            {/* Left panel — question area */}
            <div
              className="panel-left flex flex-col overflow-hidden"
              style={{ borderRight: '1px solid var(--color-border)' }}
            >
              {leftPanel}
            </div>

            {/* Right panel — live preview (full on desktop, strip on tablet, hidden on mobile) */}
            <div className="panel-right flex flex-col overflow-hidden">
              {rightPanel}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
