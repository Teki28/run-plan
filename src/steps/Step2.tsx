import { ThreeStopSelector } from '../components/ThreeStopSelector'
import { StepLayout } from '../components/StepLayout'
import type { ExperienceLevel, PlanData } from '../types/plan'

const STOPS: [
  { value: ExperienceLevel; label: string; description: string },
  { value: ExperienceLevel; label: string; description: string },
  { value: ExperienceLevel; label: string; description: string },
] = [
  { value: 'beginner',     label: 'Beginner',     description: 'New to running or returning after a long break' },
  { value: 'intermediate', label: 'Intermediate', description: 'Running regularly, ready to push further' },
  { value: 'advanced',     label: 'Advanced',     description: 'Experienced runner chasing a PB' },
]

interface Step2Props {
  planData: PlanData
  onUpdate: (patch: Partial<PlanData>) => void
  onNext: () => void
  onBack: () => void
}

export function Step2({ planData, onUpdate, onNext, onBack }: Step2Props) {
  return (
    <StepLayout
      question="What's your experience level?"
      helper="Be honest — the right plan starts with the right baseline."
      onNext={onNext}
      onBack={onBack}
      nextDisabled={!planData.experienceLevel}
    >
      <ThreeStopSelector
        stops={STOPS}
        value={planData.experienceLevel}
        onChange={(v) => onUpdate({ experienceLevel: v as ExperienceLevel })}
      />
    </StepLayout>
  )
}
