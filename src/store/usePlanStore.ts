import { useState } from 'react'
import type { PlanData } from '../types/plan'

const TOTAL_STEPS = 9

const initialPlanData: PlanData = {
  raceGoal: null,
  targetFinishTime: null,
  experienceLevel: null,
  weeklyMileage: 20,
  unit: 'km',
  trainingDays: [],
  raceDate: null,
  injuries: [],
}

export function usePlanStore() {
  const [currentStep, setCurrentStep] = useState(0)
  const [planData, setPlanData] = useState<PlanData>(initialPlanData)

  function goNext() {
    setCurrentStep((s) => Math.min(s + 1, TOTAL_STEPS - 1))
  }

  function goBack() {
    setCurrentStep((s) => Math.max(s - 1, 0))
  }

  function updatePlanData(patch: Partial<PlanData>) {
    setPlanData((prev) => ({ ...prev, ...patch }))
  }

  return { currentStep, planData, goNext, goBack, updatePlanData }
}
