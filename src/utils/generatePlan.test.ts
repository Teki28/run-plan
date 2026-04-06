import { describe, it, expect } from 'vitest'
import {
  getGoalParams,
  computePaceZones,
  buildMileageArc,
  getWeekPhase,
  assignSessionTypes,
  distributeDistances,
  generatePlan,
} from './generatePlan'
import type { PlanData } from '../types/plan'

// ─── getGoalParams ──────────────────────────────────────────────────────────

describe('getGoalParams', () => {
  it('returns params for half/intermediate', () => {
    const p = getGoalParams('half', 'intermediate')
    expect(p).toEqual({ maxWeeklyKm: 90, peakLongRunKm: 30, taperWeeks: 2 })
  })

  it('full/advanced has 3 taper weeks', () => {
    expect(getGoalParams('full', 'advanced').taperWeeks).toBe(3)
  })

  it('fitness/beginner has low caps', () => {
    const p = getGoalParams('fitness', 'beginner')
    expect(p.maxWeeklyKm).toBe(35)
    expect(p.peakLongRunKm).toBe(12)
    expect(p.taperWeeks).toBe(1)
  })
})

// ─── computePaceZones ───────────────────────────────────────────────────────

describe('computePaceZones', () => {
  it('returns null when targetFinishTime is null', () => {
    expect(computePaceZones('half', null)).toBeNull()
  })

  it('returns null for fitness goal', () => {
    expect(computePaceZones('fitness', 7200)).toBeNull()
  })

  it('calculates correct pace for 5K in 25 min', () => {
    const zones = computePaceZones('5k', 25 * 60)
    expect(zones).not.toBeNull()
    // goalPace = 1500 / 5 = 300 sec/km = 5:00/km
    expect(zones!.hard).toBe(300)
    expect(zones!.tempo).toBe(Math.round(300 * 1.07))  // 321
    expect(zones!.easy).toBe(Math.round(300 * 1.30))   // 390
  })

  it('easy pace is slowest, hard pace is fastest', () => {
    const zones = computePaceZones('10k', 50 * 60)!
    expect(zones.easy).toBeGreaterThan(zones.tempo)
    expect(zones.tempo).toBeGreaterThan(zones.hard)
  })
})

// ─── buildMileageArc ────────────────────────────────────────────────────────

describe('buildMileageArc', () => {
  const params = getGoalParams('half', 'intermediate') // max 90, taper 2

  it('returns correct total length', () => {
    const arc = buildMileageArc(40, 12, params)
    expect(arc.length).toBe(12)
  })

  it('first week equals base km', () => {
    const arc = buildMileageArc(40, 12, params)
    expect(arc[0]).toBe(40)
  })

  it('increases ~10% in non-recovery build weeks', () => {
    const arc = buildMileageArc(40, 12, params)
    // Week 2 (index 1) should be ~44
    expect(arc[1]).toBe(Math.round(40 * 1.1))
  })

  it('every 4th week is a recovery week (lower volume)', () => {
    const arc = buildMileageArc(40, 16, params)
    // Week 4 (index 3) should be recovery
    expect(arc[3]).toBeLessThan(arc[2])
  })

  it('caps at maxWeeklyKm', () => {
    const arc = buildMileageArc(80, 16, params)
    arc.forEach(km => expect(km).toBeLessThanOrEqual(params.maxWeeklyKm))
  })

  it('last taper weeks are lower than peak', () => {
    const arc = buildMileageArc(40, 12, params)
    const peak = Math.max(...arc.slice(0, -2))
    expect(arc[arc.length - 1]).toBeLessThan(peak)
    expect(arc[arc.length - 2]).toBeLessThan(peak)
  })

  it('taper decreases progressively', () => {
    const arc = buildMileageArc(40, 12, params)
    expect(arc[arc.length - 1]).toBeLessThan(arc[arc.length - 2])
  })
})

// ─── getWeekPhase ───────────────────────────────────────────────────────────

describe('getWeekPhase', () => {
  it('last N weeks are taper', () => {
    expect(getWeekPhase(10, 12, 2)).toBe('taper')
    expect(getWeekPhase(11, 12, 2)).toBe('taper')
  })

  it('4th week is recovery', () => {
    expect(getWeekPhase(3, 16, 2)).toBe('recovery')
    expect(getWeekPhase(7, 16, 2)).toBe('recovery')
  })

  it('early weeks are build', () => {
    expect(getWeekPhase(0, 16, 2)).toBe('build')
    expect(getWeekPhase(1, 16, 2)).toBe('build')
  })

  it('weeks just before taper are peak', () => {
    // total 16, taper 2 → taper at 14,15; peak at 11,12,13
    expect(getWeekPhase(12, 16, 2)).toBe('peak')
    expect(getWeekPhase(13, 16, 2)).toBe('peak')
  })

  it('recovery takes priority over peak when week is 4th', () => {
    // index 11 → weekNum 12 → 12 % 4 === 0 → recovery
    expect(getWeekPhase(11, 16, 2)).toBe('recovery')
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

// ─── generatePlan ───────────────────────────────────────────────────────────

const basePlan: PlanData = {
  raceGoal: 'half',
  targetFinishTime: null,
  experienceLevel: 'intermediate',
  weeklyMileage: 40,
  unit: 'km',
  trainingDays: [1, 3, 5],
  raceDate: '2026-07-02',
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

  it('taper weeks have lower km than peak', () => {
    const plan = generatePlan(basePlan)
    const n = plan.length
    const peakKm = Math.max(...plan.slice(0, n - 2).map(w => w.totalKm))
    expect(plan[n - 1].totalKm).toBeLessThan(peakKm)
    expect(plan[n - 2].totalKm).toBeLessThan(peakKm)
  })

  it('weekly km never exceeds maxWeeklyKm cap', () => {
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

  it('every 4th week is a recovery week (all easy)', () => {
    const plan = generatePlan(basePlan)
    plan.forEach(week => {
      if (week.phase === 'recovery') {
        week.sessions.forEach(s => expect(s.type).toBe('easy'))
      }
    })
  })

  it('taper weeks have no hard sessions', () => {
    const plan = generatePlan(basePlan)
    plan.forEach(week => {
      if (week.phase === 'taper') {
        week.sessions.forEach(s => expect(s.type).not.toBe('hard'))
      }
    })
  })

  it('weeks have a phase property', () => {
    const plan = generatePlan(basePlan)
    const validPhases = ['build', 'recovery', 'peak', 'taper']
    plan.forEach(w => expect(validPhases).toContain(w.phase))
  })

  it('includes targetPaceSec when targetFinishTime is set', () => {
    const plan = generatePlan({ ...basePlan, targetFinishTime: 2 * 3600 }) // 2h half
    const firstWeek = plan[0]
    firstWeek.sessions.forEach(s => {
      expect(s.targetPaceSec).toBeDefined()
      expect(s.targetPaceSec).toBeGreaterThan(0)
    })
  })

  it('omits targetPaceSec when targetFinishTime is null', () => {
    const plan = generatePlan(basePlan)
    plan[0].sessions.forEach(s => {
      expect(s.targetPaceSec).toBeUndefined()
    })
  })
})
