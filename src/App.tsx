import { usePlanStore } from './store/usePlanStore'
import { AppShell } from './components/AppShell'
import { StickyNav } from './components/StickyNav'
import { StepTransition } from './components/StepTransition'
import { SplashScreen } from './steps/SplashScreen'

const TOTAL_STEPS = 8

function App() {
  const { currentStep, goNext, goBack } = usePlanStore()

  return (
    <AppShell
      currentStep={currentStep}
      totalSteps={TOTAL_STEPS}
      leftPanel={
        currentStep === 0 ? (
          <SplashScreen onStart={goNext} />
        ) : (
          <StepTransition stepKey={currentStep}>
            <div className="flex-1 p-8" style={{ color: 'var(--color-text)', fontFamily: 'var(--font-body)' }}>
              Step {currentStep} content
            </div>
            <StickyNav
              onNext={goNext}
              onBack={goBack}
              canGoBack={currentStep > 0}
            />
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
