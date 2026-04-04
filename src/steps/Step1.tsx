import { SelectCard } from '../components/SelectCard'
import { StepLayout } from '../components/StepLayout'
import type { RaceGoal, PlanData } from '../types/plan'

const GOALS: { value: RaceGoal; label: string; description: string }[] = [
  { value: '5k',      label: '5K',              description: 'Short & sharp — great for speed' },
  { value: '10k',     label: '10K',             description: 'The sweet-spot distance' },
  { value: 'half',    label: 'Half Marathon',   description: '21.1 km — the perfect challenge' },
  { value: 'full',    label: 'Full Marathon',   description: '42.2 km — the ultimate goal' },
  { value: 'fitness', label: 'General Fitness', description: 'Stay active, run your own way' },
]

interface Step1Props {
  planData: PlanData
  onUpdate: (patch: Partial<PlanData>) => void
  onNext: () => void
  onBack: () => void
}

export function Step1({ planData, onUpdate, onNext, onBack }: Step1Props) {
  return (
    <StepLayout
      question="What's your race goal?"
      helper="Pick the distance or goal that best describes what you're training for."
      onNext={onNext}
      onBack={onBack}
      nextDisabled={!planData.raceGoal}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {GOALS.map(({ value, label, description }) => (
          <SelectCard
            key={value}
            label={label}
            description={description}
            selected={planData.raceGoal === value}
            onSelect={() => onUpdate({ raceGoal: value })}
          />
        ))}
      </div>
    </StepLayout>
  )
}
