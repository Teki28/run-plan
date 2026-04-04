import { describe, it, expect } from 'vitest'
import {
  getWeeklyKm,
  assignSessionTypes,
  distributeDistances,
  generatePlan,
} from './generatePlan'
import type { PlanData } from '../types/plan'

// ─── getWeeklyKm ────────────────────────────────────────────────────────────

describe('getWeeklyKm', () => {
  it('week 0 equals baseKm', () => {
    expect(getWeeklyKm(40, 0, 12, 120)).toBe(40)
  })

  it('increases ~10% each week', () => {
    const w1 = getWeeklyKm(40, 1, 12, 200)
    expect(w1).toBe(Math.round(40 * 1.1))
  })

  it('caps at maxKm', () => {
    expect(getWeeklyKm(40, 20, 24, 50)).toBeLessThanOrEqual(50)
  })

  it('tapers second-to-last week to ~70% of peak', () => {
    const total = 12
    const base = 40
    const max = 200
    const peakKm = Math.min(base * Math.pow(1.1, total - 3), max)
    const taper = getWeeklyKm(base, total - 2, total, max)
    expect(taper).toBe(Math.round(peakKm * 0.7))
  })

  it('tapers last week to ~50% of peak', () => {
    const total = 12
    const base = 40
    const max = 200
    const peakKm = Math.min(base * Math.pow(1.1, total - 3), max)
    const taper = getWeeklyKm(base, total - 1, total, max)
    expect(taper).toBe(Math.round(peakKm * 0.5))
  })

  it('last week < second-to-last week', () => {
    const t = 16
    expect(getWeeklyKm(50, t - 1, t, 150)).toBeLessThan(getWeeklyKm(50, t - 2, t, 150))
  })
})

// ─── assignSessionTypes ─────────────────────────────────────────────────────

describe('assignSessionTypes', () => {
  it('2 days: easy + tempo for beginner (no hard)', () => {
    const types = assignSessionTypes([1, 4], 'beginner', [])
    expect(types).toEqual(['easy', 'tempo'])
  })

  it('2 days: easy + hard for intermediate', () => {
    const types = assignSessionTypes([1, 4], 'intermediate', [])
    expect(types).toEqual(['easy', 'hard'])
  })

  it('3 days: easy + tempo + hard for intermediate', () => {
    const types = assignSessionTypes([1, 3, 5], 'intermediate', [])
    expect(types).toEqual(['easy', 'tempo', 'hard'])
  })

  it('last day is always hard for advanced', () => {
    const types = assignSessionTypes([0, 2, 4, 6], 'advanced', [])
    expect(types[types.length - 1]).toBe('hard')
  })

  it('advanced with 4+ days gets a second hard day', () => {
    const types = assignSessionTypes([0, 2, 4, 6], 'advanced', [])
    const hardCount = types.filter(t => t === 'hard').length
    expect(hardCount).toBe(2)
  })

  it('injuries downgrade hard → tempo', () => {
    const types = assignSessionTypes([1, 3, 5], 'advanced', ['knee'])
    expect(types.every(t => t !== 'hard')).toBe(true)
  })

  it('beginner never gets hard sessions', () => {
    const types = assignSessionTypes([0, 1, 2, 3, 4, 5, 6], 'beginner', [])
    expect(types.every(t => t !== 'hard')).toBe(true)
  })

  it('number of types matches number of days', () => {
    const days = [0, 2, 4]
    expect(assignSessionTypes(days, 'intermediate', []).length).toBe(days.length)
  })
})

// ─── distributeDistances ────────────────────────────────────────────────────

describe('distributeDistances', () => {
  it('returns same number of distances as types', () => {
    const d = distributeDistances(['easy', 'tempo', 'hard'], 60)
    expect(d.length).toBe(3)
  })

  it('sums approximately to totalKm (rounding tolerance)', () => {
    const d = distributeDistances(['easy', 'tempo', 'hard'], 60)
    const sum = d.reduce((a, b) => a + b, 0)
    expect(sum).toBeCloseTo(60, 0)
  })

  it('hard session gets more km than easy', () => {
    const d = distributeDistances(['easy', 'hard'], 50)
    expect(d[1]).toBeGreaterThan(d[0])
  })

  it('tempo gets more km than easy', () => {
    const d = distributeDistances(['easy', 'tempo'], 40)
    expect(d[1]).toBeGreaterThan(d[0])
  })

  it('handles all-easy distribution', () => {
    const d = distributeDistances(['easy', 'easy', 'easy'], 30)
    expect(d[0]).toBeCloseTo(d[1], 0)
    expect(d[1]).toBeCloseTo(d[2], 0)
  })
})

// ─── generatePlan ────────────────────────────────────────────────────────────

const basePlan: PlanData = {
  raceGoal: 'half',
  experienceLevel: 'intermediate',
  weeklyMileage: 40,
  unit: 'km',
  trainingDays: [1, 3, 5],
  raceDate: '2026-07-02',   // ~13 weeks from 2026-04-02
  injuries: [],
}

describe('generatePlan', () => {
  it('returns empty array if raceGoal missing', () => {
    expect(generatePlan({ ...basePlan, raceGoal: null })).toEqual([])
  })

  it('returns empty array if experienceLevel missing', () => {
    expect(generatePlan({ ...basePlan, experienceLevel: null })).toEqual([])
  })

  it('returns empty array if fewer than 2 training days', () => {
    expect(generatePlan({ ...basePlan, trainingDays: [1] })).toEqual([])
  })

  it('returns empty array if raceDate missing', () => {
    expect(generatePlan({ ...basePlan, raceDate: null })).toEqual([])
  })

  it('returns correct number of weeks', () => {
    const plan = generatePlan(basePlan)
    expect(plan.length).toBeGreaterThan(0)
    plan.forEach((w, i) => expect(w.weekNumber).toBe(i + 1))
  })

  it('each week has sessions for each training day', () => {
    const plan = generatePlan(basePlan)
    plan.forEach(week => {
      expect(week.sessions.length).toBe(basePlan.trainingDays.length)
    })
  })

  it('session days match training days', () => {
    const plan = generatePlan(basePlan)
    const sessionDays = plan[0].sessions.map(s => s.day).sort((a, b) => a - b)
    expect(sessionDays).toEqual([...basePlan.trainingDays].sort((a, b) => a - b))
  })

  it('all session distances are positive', () => {
    const plan = generatePlan(basePlan)
    plan.forEach(week => week.sessions.forEach(s => expect(s.distanceKm).toBeGreaterThan(0)))
  })

  it('last two weeks have lower km than peak (taper)', () => {
    const plan = generatePlan(basePlan)
    const n = plan.length
    const peakKm = Math.max(...plan.slice(0, n - 2).map(w => w.totalKm))
    expect(plan[n - 1].totalKm).toBeLessThan(peakKm)
    expect(plan[n - 2].totalKm).toBeLessThan(peakKm)
  })

  it('weekly km never exceeds maxKm cap', () => {
    const plan = generatePlan(basePlan)
    plan.forEach(w => expect(w.totalKm).toBeLessThanOrEqual(90))
  })

  it('mi unit converts to km internally', () => {
    const miPlan = generatePlan({ ...basePlan, weeklyMileage: 25, unit: 'mi' })
    const kmPlan = generatePlan({ ...basePlan, weeklyMileage: 40, unit: 'km' })
    expect(miPlan[0].totalKm).toBeCloseTo(kmPlan[0].totalKm, 0)
  })

  it('injury plan has no hard sessions', () => {
    const plan = generatePlan({ ...basePlan, injuries: ['knee'] })
    plan.forEach(week => week.sessions.forEach(s => expect(s.type).not.toBe('hard')))
  })

  it('beginner plan has no hard sessions', () => {
    const plan = generatePlan({ ...basePlan, experienceLevel: 'beginner' })
    plan.forEach(week => week.sessions.forEach(s => expect(s.type).not.toBe('hard')))
  })
})
