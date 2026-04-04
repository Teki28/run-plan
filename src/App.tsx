import { usePlanStore } from './store/usePlanStore'
import { AppShell } from './components/AppShell'
import { StepTransition } from './components/StepTransition'
import { SplashScreen } from './steps/SplashScreen'
import { Step1 } from './steps/Step1'
import { Step2 } from './steps/Step2'
import { Step3 } from './steps/Step3'
import { Step4 } from './steps/Step4'
import { Step5 } from './steps/Step5'
import { Step6 } from './steps/Step6'

const TOTAL_STEPS = 8

function App() {
  const { currentStep, planData, goNext, goBack, updatePlanData } = usePlanStore()

  function renderStep() {
    const props = { planData, onUpdate: updatePlanData, onNext: goNext, onBack: goBack }
    switch (currentStep) {
      case 1: return <Step1 {...props} />
      case 2: return <Step2 {...props} />
      case 3: return <Step3 {...props} />
      case 4: return <Step4 {...props} />
      case 5: return <Step5 {...props} />
      case 6: return <Step6 {...props} />
      default: return null
    }
  }

  return (
    <AppShell
      currentStep={currentStep}
      totalSteps={TOTAL_STEPS}
      leftPanel={
        currentStep === 0 ? (
          <SplashScreen onStart={goNext} />
        ) : (
          <StepTransition stepKey={currentStep}>
            {renderStep()}
          </StepTransition>
        )
      }
      rightPanel={
        <div className="flex items-center justify-center h-full" style={{ color: 'var(--color-muted)' }}>
          Preview
        </div>
      }
    />
  )
}

export default App
