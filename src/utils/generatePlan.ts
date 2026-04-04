import type { PlanData, RaceGoal, ExperienceLevel, InjuryType } from '../types/plan'
import { toDateString, weeksUntil } from './dates'
import { miToKm } from './units'

export type SessionType = 'easy' | 'tempo' | 'hard' | 'rest'

export interface SessionTile {
  day: number         // 0 = Mon … 6 = Sun
  type: SessionType
  distanceKm: number
}

export interface TrainingWeek {
  weekNumber: number  // 1-based
  sessions: SessionTile[]
  totalKm: number
}

// Maximum weekly km cap by goal × level
const MAX_KM: Record<RaceGoal, Record<ExperienceLevel, number>> = {
  '5k':     { beginner: 40,  intermediate: 70,  advanced: 90  },
  '10k':    { beginner: 50,  intermediate: 80,  advanced: 100 },
  'half':   { beginner: 60,  intermediate: 90,  advanced: 120 },
  'full':   { beginner: 70,  intermediate: 100, advanced: 150 },
  'fitness':{ beginner: 35,  intermediate: 50,  advanced: 60  },
}

// Relative effort weight used to split weekly km across sessions
const EFFORT_WEIGHT: Record<SessionType, number> = {
  easy:  1.0,
  tempo: 1.3,
  hard:  1.7,
  rest:  0,
}

const HIGH_IMPACT: InjuryType[] = ['knee', 'itband', 'hip', 'shin', 'plantar']

/**
 * Weekly km for a given week index (0-based).
 * Progresses 10% per week up to maxKm, then tapers last 2 weeks.
 */
export function getWeeklyKm(
  baseKm: number,
  weekIndex: number,
  totalWeeks: number,
  maxKm: number,
): number {
  if (totalWeeks <= 2) return Math.round(baseKm)

  const peakIndex = totalWeeks - 3
  const peakKm = Math.min(baseKm * Math.pow(1.1, peakIndex), maxKm)

  if (weekIndex >= totalWeeks - 2) {
    const taperFactor = weekIndex === totalWeeks - 2 ? 0.7 : 0.5
    return Math.round(peakKm * taperFactor)
  }

  return Math.round(Math.min(baseKm * Math.pow(1.1, weekIndex), maxKm))
}

/**
 * Assign a session type to each training day (sorted ascending).
 * Last day = long run (hard); first day = easy; middles = tempo / hard for advanced.
 * Beginner and injury-affected plans downgrade hard → tempo.
 */
export function assignSessionTypes(
  sortedDays: number[],
  level: ExperienceLevel,
  injuries: InjuryType[],
): SessionType[] {
  const n = sortedDays.length
  const limitToTempo = level === 'beginner' || injuries.some(i => HIGH_IMPACT.includes(i))

  const raw: SessionType[] = sortedDays.map((_, pos) => {
    if (pos === n - 1) return 'hard'          // long run / hardest day
    if (pos === 0)     return 'easy'          // recovery / opener
    // For advanced with 4+ days give a second hard day (2nd from end)
    if (level === 'advanced' && n >= 4 && pos === n - 2) return 'hard'
    return pos % 2 === 1 ? 'tempo' : 'easy'  // alternate easy / tempo in middle
  })

  if (limitToTempo) return raw.map(t => (t === 'hard' ? 'tempo' : t))
  return raw
}

/**
 * Split totalKm across session types proportionally by effort weight.
 * Returns distances rounded to 1 decimal place.
 */
export function distributeDistances(types: SessionType[], totalKm: number): number[] {
  const totalWeight = types.reduce((s, t) => s + EFFORT_WEIGHT[t], 0)
  if (totalWeight === 0) return types.map(() => 0)
  return types.map(t => Math.round((EFFORT_WEIGHT[t] / totalWeight) * totalKm * 10) / 10)
}

/**
 * Generate the full training plan from PlanData.
 * Returns [] if required fields are missing or race is too soon.
 */
export function generatePlan(planData: PlanData): TrainingWeek[] {
  const { raceGoal, experienceLevel, weeklyMileage, unit, trainingDays, raceDate, injuries } = planData

  if (!raceGoal || !experienceLevel || !raceDate || trainingDays.length < 2) return []

  const today = toDateString(new Date())
  const totalWeeks = weeksUntil(raceDate, today)
  if (totalWeeks < 4) return []

  const baseKm     = unit === 'km' ? weeklyMileage : miToKm(weeklyMileage)
  const maxKm      = MAX_KM[raceGoal][experienceLevel]
  const sortedDays = [...trainingDays].sort((a, b) => a - b)
  const types      = assignSessionTypes(sortedDays, experienceLevel, injuries)

  return Array.from({ length: totalWeeks }, (_, i) => {
    const totalKm    = getWeeklyKm(baseKm, i, totalWeeks, maxKm)
    const distances  = distributeDistances(types, totalKm)

    const sessions: SessionTile[] = sortedDays.map((day, j) => ({
      day,
      type: types[j],
      distanceKm: distances[j],
    }))

    return { weekNumber: i + 1, sessions, totalKm }
  })
}
