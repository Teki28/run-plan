import type { PlanData, RaceGoal, ExperienceLevel, InjuryType } from '../types/plan'
import { toDateString, weeksUntil } from './dates'
import { miToKm } from './units'

export type SessionType = 'easy' | 'tempo' | 'hard' | 'rest'
export type WeekPhase = 'build' | 'recovery' | 'peak' | 'taper'

export interface SessionTile {
  day: number         // 0 = Mon … 6 = Sun
  type: SessionType
  distanceKm: number
  targetPaceSec?: number  // seconds/km — present only when targetFinishTime is set
}

export interface TrainingWeek {
  weekNumber: number  // 1-based
  phase: WeekPhase
  sessions: SessionTile[]
  totalKm: number
}

// ─── Goal parameters ────────────────────────────────────────────────────────

interface GoalParams {
  maxWeeklyKm: number
  peakLongRunKm: number
  taperWeeks: number
}

const GOAL_PARAMS: Record<RaceGoal, Record<ExperienceLevel, GoalParams>> = {
  '5k': {
    beginner:     { maxWeeklyKm: 40,  peakLongRunKm: 15, taperWeeks: 2 },
    intermediate: { maxWeeklyKm: 70,  peakLongRunKm: 20, taperWeeks: 2 },
    advanced:     { maxWeeklyKm: 90,  peakLongRunKm: 25, taperWeeks: 2 },
  },
  '10k': {
    beginner:     { maxWeeklyKm: 50,  peakLongRunKm: 20, taperWeeks: 2 },
    intermediate: { maxWeeklyKm: 80,  peakLongRunKm: 25, taperWeeks: 2 },
    advanced:     { maxWeeklyKm: 100, peakLongRunKm: 30, taperWeeks: 2 },
  },
  'half': {
    beginner:     { maxWeeklyKm: 60,  peakLongRunKm: 25, taperWeeks: 2 },
    intermediate: { maxWeeklyKm: 90,  peakLongRunKm: 30, taperWeeks: 2 },
    advanced:     { maxWeeklyKm: 120, peakLongRunKm: 35, taperWeeks: 3 },
  },
  'full': {
    beginner:     { maxWeeklyKm: 70,  peakLongRunKm: 30, taperWeeks: 3 },
    intermediate: { maxWeeklyKm: 100, peakLongRunKm: 35, taperWeeks: 3 },
    advanced:     { maxWeeklyKm: 150, peakLongRunKm: 38, taperWeeks: 3 },
  },
  'fitness': {
    beginner:     { maxWeeklyKm: 35,  peakLongRunKm: 12, taperWeeks: 1 },
    intermediate: { maxWeeklyKm: 50,  peakLongRunKm: 18, taperWeeks: 1 },
    advanced:     { maxWeeklyKm: 60,  peakLongRunKm: 22, taperWeeks: 1 },
  },
}

export function getGoalParams(raceGoal: RaceGoal, level: ExperienceLevel): GoalParams {
  return GOAL_PARAMS[raceGoal][level]
}

// ─── Pace zone calculator ───────────────────────────────────────────────────

export interface PaceZones {
  easy: number   // seconds/km
  tempo: number
  hard: number
}

const RACE_DISTANCE_KM: Partial<Record<RaceGoal, number>> = {
  '5k': 5, '10k': 10, 'half': 21.1, 'full': 42.2,
}

export function computePaceZones(
  raceGoal: RaceGoal,
  targetFinishTime: number | null,
): PaceZones | null {
  if (targetFinishTime === null || targetFinishTime <= 0) return null

  const distKm = RACE_DISTANCE_KM[raceGoal]
  if (!distKm) return null  // 'fitness' has no race distance

  const goalPaceSec = targetFinishTime / distKm

  return {
    easy:  Math.round(goalPaceSec * 1.30),
    tempo: Math.round(goalPaceSec * 1.07),
    hard:  Math.round(goalPaceSec),
  }
}

// ─── Mileage arc builder ────────────────────────────────────────────────────

const TAPER_FACTORS: Record<number, number[]> = {
  1: [0.50],
  2: [0.70, 0.50],
  3: [0.80, 0.60, 0.40],
}

/**
 * Build the week-by-week total km array.
 * 10% rule + 3-build / 1-recovery cycle + goal-specific taper.
 */
export function buildMileageArc(
  baseKm: number,
  totalWeeks: number,
  params: GoalParams,
): number[] {
  const { maxWeeklyKm, taperWeeks } = params
  const buildWeeks = totalWeeks - taperWeeks
  const arc: number[] = []
  let current = baseKm

  for (let i = 0; i < buildWeeks; i++) {
    const weekNum = i + 1
    if (weekNum % 4 === 0) {
      // Recovery week: 80% of current volume
      arc.push(Math.round(current * 0.80))
    } else {
      arc.push(Math.round(Math.min(current, maxWeeklyKm)))
      current = Math.min(current * 1.10, maxWeeklyKm)
    }
  }

  // Taper from peak
  const peakKm = arc.length > 0 ? Math.max(...arc) : baseKm
  const factors = TAPER_FACTORS[taperWeeks] ?? TAPER_FACTORS[2]
  for (let t = 0; t < taperWeeks; t++) {
    arc.push(Math.round(peakKm * factors[t]))
  }

  return arc
}

// ─── Week phase classifier ──────────────────────────────────────────────────

export function getWeekPhase(
  weekIndex: number,
  totalWeeks: number,
  taperWeeks: number,
): WeekPhase {
  if (weekIndex >= totalWeeks - taperWeeks) return 'taper'
  if ((weekIndex + 1) % 4 === 0) return 'recovery'
  if (weekIndex >= totalWeeks - taperWeeks - 3) return 'peak'
  return 'build'
}

// ─── Session type assignment (static per plan) ──────────────────────────────

const HIGH_IMPACT: InjuryType[] = ['knee', 'itband', 'hip', 'shin', 'plantar']

/**
 * Assign session types to each training day slot.
 * Called once; reused every week — only distances and phase adjustments vary.
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
    if (level === 'advanced' && n >= 4 && pos === n - 2) return 'hard'
    return pos % 2 === 1 ? 'tempo' : 'easy'
  })

  if (limitToTempo) return raw.map(t => (t === 'hard' ? 'tempo' : t))
  return raw
}

// ─── Distance distributor (80/20 rule) ──────────────────────────────────────

const EFFORT_WEIGHT: Record<SessionType, number> = {
  easy:  1.0,
  tempo: 1.4,
  hard:  1.8,
  rest:  0,
}

/**
 * Split totalKm proportionally by effort weight.
 */
export function distributeDistances(types: SessionType[], totalKm: number): number[] {
  const totalWeight = types.reduce((s, t) => s + EFFORT_WEIGHT[t], 0)
  if (totalWeight === 0) return types.map(() => 0)
  return types.map(t => Math.round((EFFORT_WEIGHT[t] / totalWeight) * totalKm * 10) / 10)
}

// ─── Session builder (per week) ─────────────────────────────────────────────

function buildSessions(
  sortedDays: number[],
  baseTypes: SessionType[],
  phase: WeekPhase,
  totalKm: number,
  params: GoalParams,
  paceZones: PaceZones | null,
): SessionTile[] {
  // Adjust types for current phase
  let weekTypes: SessionType[]
  if (phase === 'recovery') {
    weekTypes = baseTypes.map(() => 'easy' as SessionType)
  } else if (phase === 'taper') {
    weekTypes = baseTypes.map(t => (t === 'hard' ? 'tempo' : t))
  } else {
    weekTypes = [...baseTypes]
  }

  const distances = distributeDistances(weekTypes, totalKm)

  // Cap long run at peakLongRunKm and redistribute surplus
  const longRunIdx = weekTypes.lastIndexOf('hard')
  if (longRunIdx >= 0 && distances[longRunIdx] > params.peakLongRunKm) {
    const surplus = distances[longRunIdx] - params.peakLongRunKm
    distances[longRunIdx] = params.peakLongRunKm

    // Redistribute surplus proportionally across other non-rest sessions
    const otherIndices = weekTypes
      .map((t, i) => (i !== longRunIdx && t !== 'rest') ? i : -1)
      .filter(i => i >= 0)
    const otherWeightSum = otherIndices.reduce((s, i) => s + EFFORT_WEIGHT[weekTypes[i]], 0)
    if (otherWeightSum > 0) {
      for (const i of otherIndices) {
        distances[i] += Math.round((EFFORT_WEIGHT[weekTypes[i]] / otherWeightSum) * surplus * 10) / 10
      }
    }
  }

  return sortedDays.map((day, i) => ({
    day,
    type: weekTypes[i],
    distanceKm: distances[i],
    ...(paceZones && weekTypes[i] !== 'rest'
      ? { targetPaceSec: paceZones[weekTypes[i] as keyof PaceZones] }
      : {}),
  }))
}

// ─── Top-level orchestrator ─────────────────────────────────────────────────

/**
 * Generate the full training plan from PlanData.
 * Returns [] if required fields are missing or race is too soon.
 */
export function generatePlan(planData: PlanData): TrainingWeek[] {
  const {
    raceGoal, experienceLevel, weeklyMileage, unit,
    trainingDays, raceDate, injuries, targetFinishTime,
  } = planData

  if (!raceGoal || !experienceLevel || !raceDate || trainingDays.length < 2) return []

  const today = toDateString(new Date())
  const totalWeeks = weeksUntil(raceDate, today)
  if (totalWeeks < 4) return []

  const baseKm     = unit === 'km' ? weeklyMileage : miToKm(weeklyMileage)
  const params     = getGoalParams(raceGoal, experienceLevel)
  const paceZones  = computePaceZones(raceGoal, targetFinishTime)
  const sortedDays = [...trainingDays].sort((a, b) => a - b)
  const baseTypes  = assignSessionTypes(sortedDays, experienceLevel, injuries)
  const arc        = buildMileageArc(baseKm, totalWeeks, params)

  return arc.map((weekKm, i) => {
    const phase    = getWeekPhase(i, totalWeeks, params.taperWeeks)
    const sessions = buildSessions(sortedDays, baseTypes, phase, weekKm, params, paceZones)

    return {
      weekNumber: i + 1,
      phase,
      sessions,
      totalKm: weekKm,
    }
  })
}
