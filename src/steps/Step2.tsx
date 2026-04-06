import { FinishTimeInput } from '../components/FinishTimeInput'
import { StepLayout } from '../components/StepLayout'
import type { PlanData } from '../types/plan'

interface Step2Props {
  planData: PlanData
  onUpdate: (patch: Partial<PlanData>) => void
  onNext: () => void
  onBack: () => void
}

export function Step2({ planData, onUpdate, onNext, onBack }: Step2Props) {
  return (
    <StepLayout
      question="Do you have a target finish time?"
      helper="Optional — set a goal time and we'll calibrate your training paces accordingly."
      onNext={onNext}
      onBack={onBack}
    >
      <FinishTimeInput
        valueSec={planData.targetFinishTime}
        raceGoal={planData.raceGoal}
        onChange={(sec) => onUpdate({ targetFinishTime: sec })}
      />
    </StepLayout>
  )
}
