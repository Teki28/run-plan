import { useEffect, useRef, useState } from 'react'

interface StepTransitionProps {
  stepKey: number
  children: React.ReactNode
}

export function StepTransition({ stepKey, children }: StepTransitionProps) {
  const [displayedKey, setDisplayedKey] = useState(stepKey)
  const [displayedChildren, setDisplayedChildren] = useState(children)
  const [phase, setPhase] = useState<'idle' | 'exiting' | 'entering'>('idle')
  const pendingRef = useRef<{ key: number; children: React.ReactNode } | null>(null)

  useEffect(() => {
    if (stepKey === displayedKey) return

    pendingRef.current = { key: stepKey, children }
    setPhase('exiting')
  }, [stepKey])

  function handleAnimationEnd() {
    if (phase === 'exiting' && pendingRef.current) {
      setDisplayedKey(pendingRef.current.key)
      setDisplayedChildren(pendingRef.current.children)
      pendingRef.current = null
      setPhase('entering')
    } else if (phase === 'entering') {
      setPhase('idle')
    }
  }

  const className =
    phase === 'exiting' ? 'step-exit' :
    phase === 'entering' ? 'step-enter' :
    ''

  return (
    <div
      className={`flex flex-col h-full ${className}`}
      onAnimationEnd={handleAnimationEnd}
    >
      {displayedChildren}
    </div>
  )
}
