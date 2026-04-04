import { DayPills } from '../components/DayPills'
import { StepLayout } from '../components/StepLayout'
import type { PlanData } from '../types/plan'

interface Step4Props {
  planData: PlanData
  onUpdate: (patch: Partial<PlanData>) => void
  onNext: () => void
  onBack: () => void
}

export function Step4({ planData, onUpdate, onNext, onBack }: Step4Props) {
  return (
    <StepLayout
      question="Which days can you train?"
      helper="Select at least 2 days. Your plan will be built around your schedule."
      onNext={onNext}
      onBack={onBack}
      nextDisabled={planData.trainingDays.length < 2}
    >
      <DayPills
        selected={planData.trainingDays}
        onChange={(days) => onUpdate({ trainingDays: days })}
      />
    </StepLayout>
  )
}
