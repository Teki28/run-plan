import { InlineCalendar } from '../components/InlineCalendar'
import { StepLayout } from '../components/StepLayout'
import type { PlanData } from '../types/plan'

interface Step6Props {
  planData: PlanData
  onUpdate: (patch: Partial<PlanData>) => void
  onNext: () => void
  onBack: () => void
}

export function Step6({ planData, onUpdate, onNext, onBack }: Step6Props) {
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
