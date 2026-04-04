import { CircularDial } from '../components/CircularDial'
import { StepLayout } from '../components/StepLayout'
import type { PlanData } from '../types/plan'

interface Step3Props {
  planData: PlanData
  onUpdate: (patch: Partial<PlanData>) => void
  onNext: () => void
  onBack: () => void
}

export function Step3({ planData, onUpdate, onNext, onBack }: Step3Props) {
  return (
    <StepLayout
      question="How much do you run each week?"
      helper="Your current weekly mileage helps us build from where you are now."
      onNext={onNext}
      onBack={onBack}
    >
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '8px' }}>
        <CircularDial
          valueKm={planData.weeklyMileage}
          unit={planData.unit}
          onValueChange={(km) => onUpdate({ weeklyMileage: km })}
          onUnitChange={(unit) => onUpdate({ unit })}
        />
      </div>
    </StepLayout>
  )
}
