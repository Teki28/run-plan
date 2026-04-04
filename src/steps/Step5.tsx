import { InlineCalendar } from '../components/InlineCalendar'
import { StepLayout } from '../components/StepLayout'
import type { PlanData } from '../types/plan'

interface Step5Props {
  planData: PlanData
  onUpdate: (patch: Partial<PlanData>) => void
  onNext: () => void
  onBack: () => void
}

export function Step5({ planData, onUpdate, onNext, onBack }: Step5Props) {
  return (
    <StepLayout
      question="When is your race?"
      helper="Pick your race date and we'll work backwards to build the perfect plan."
      onNext={onNext}
      onBack={onBack}
      nextDisabled={!planData.raceDate}
    >
      <InlineCalendar
        value={planData.raceDate}
        onChange={(date) => onUpdate({ raceDate: date })}
      />
    </StepLayout>
  )
}
