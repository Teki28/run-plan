export type RaceGoal = '5k' | '10k' | 'half' | 'full' | 'fitness'

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced'

export type InjuryType = 'knee' | 'itband' | 'hip' | 'shin' | 'plantar' | 'none'

export interface PlanData {
  raceGoal: RaceGoal | null
  targetFinishTime: number | null  // seconds; null = no target
  experienceLevel: ExperienceLevel | null
  weeklyMileage: number
  unit: 'km' | 'mi'
  trainingDays: number[]
  raceDate: string | null
  injuries: InjuryType[]
}
