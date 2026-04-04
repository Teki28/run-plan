import { ChipGrid } from '../components/ChipGrid'
import { StepLayout } from '../components/StepLayout'
import type { InjuryType, PlanData } from '../types/plan'

const CHIPS = [
  { value: 'knee',     label: 'Knee' },
  { value: 'itband',   label: 'IT Band' },
  { value: 'hip',      label: 'Hip' },
  { value: 'shin',     label: 'Shin Splints' },
  { value: 'plantar',  label: 'Plantar Fasciitis' },
  { value: 'none',     label: 'No injuries' },
]

const REASSURANCE = "We'll reduce high-impact sessions and add extra recovery days around these areas."

interface Step6Props {
  planData: PlanData
  onUpdate: (patch: Partial<PlanData>) => void
  onNext: () => void
  onBack: () => void
}

export function Step6({ planData, onUpdate, onNext, onBack }: Step6Props) {
  return (
    <StepLayout
      question="Any injury history?"
      helper="Optional — but it helps us protect you. Select all that apply."
      onNext={onNext}
      onBack={onBack}
      nextLabel="Build my plan →"
    >
      <ChipGrid
        chips={CHIPS}
        selected={planData.injuries as string[]}
        onChange={(vals) => onUpdate({ injuries: vals as InjuryType[] })}
        onSkip={onNext}
        reassuranceNote={REASSURANCE}
      />
    </StepLayout>
  )
}
