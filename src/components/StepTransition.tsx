interface StepTransitionProps {
  stepKey: number
  children: React.ReactNode
}

export function StepTransition({ stepKey, children }: StepTransitionProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div key={stepKey} className="step-enter flex flex-col h-full">
        {children}
      </div>
    </div>
  )
}
