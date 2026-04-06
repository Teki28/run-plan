import { describe, it, expect } from 'vitest'
import type { PlanData } from '../types/plan'

// Test the pure step-clamping logic extracted from the store
const TOTAL_STEPS = 9

function nextStep(current: number) {
  return Math.min(current + 1, TOTAL_STEPS - 1)
}

function prevStep(current: number) {
  return Math.max(current - 1, 0)
}

function applyPatch(prev: PlanData, patch: Partial<PlanData>): PlanData {
  return { ...prev, ...patch }
}

const base: PlanData = {
  raceGoal: null,
  targetFinishTime: null,
  experienceLevel: null,
  weeklyMileage: 20,
  unit: 'km',
  trainingDays: [],
  raceDate: null,
  injuries: [],
}

describe('step navigation', () => {
  it('goNext increments step', () => {
    expect(nextStep(0)).toBe(1)
    expect(nextStep(3)).toBe(4)
  })

  it('goNext clamps at last step', () => {
    expect(nextStep(8)).toBe(8)
    expect(nextStep(9)).toBe(8)
  })

  it('goBack decrements step', () => {
    expect(prevStep(3)).toBe(2)
    expect(prevStep(1)).toBe(0)
  })

  it('goBack clamps at 0', () => {
    expect(prevStep(0)).toBe(0)
  })
})

describe('updatePlanData', () => {
  it('merges partial update into plan data', () => {
    const result = applyPatch(base, { raceGoal: '5k' })
    expect(result.raceGoal).toBe('5k')
    expect(result.weeklyMileage).toBe(20)
  })

  it('overwrites existing fields', () => {
    const withGoal = applyPatch(base, { raceGoal: '5k' })
    const updated = applyPatch(withGoal, { raceGoal: 'half' })
    expect(updated.raceGoal).toBe('half')
  })

  it('does not mutate previous state', () => {
    const result = applyPatch(base, { weeklyMileage: 40 })
    expect(base.weeklyMileage).toBe(20)
    expect(result.weeklyMileage).toBe(40)
  })

  it('updates training days', () => {
    const result = applyPatch(base, { trainingDays: [1, 3, 5] })
    expect(result.trainingDays).toEqual([1, 3, 5])
  })

  it('updates unit toggle', () => {
    const result = applyPatch(base, { unit: 'mi' })
    expect(result.unit).toBe('mi')
  })
})
