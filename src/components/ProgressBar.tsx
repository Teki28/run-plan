interface ProgressBarProps {
  current: number
  total: number
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const percent = Math.round((current / (total - 1)) * 100)

  return (
    <div
      className="w-full rounded-full overflow-hidden"
      style={{ height: '3px', background: 'var(--color-border)' }}
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={0}
      aria-valuemax={total - 1}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${percent}%`,
          background: 'var(--color-ember)',
          transition: 'width 300ms ease-out',
        }}
      />
    </div>
  )
}
