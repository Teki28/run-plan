const MIN_WEEKS = 4

/** Return a date-only string YYYY-MM-DD from a Date */
export function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Number of whole weeks from today to a given date string (YYYY-MM-DD). Negative if in the past. */
export function weeksUntil(dateStr: string, today = toDateString(new Date())): number {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000
  const diff = new Date(dateStr).getTime() - new Date(today).getTime()
  return Math.floor(diff / msPerWeek)
}

/** A date is selectable if it is at least MIN_WEEKS from today */
export function isSelectable(dateStr: string, today = toDateString(new Date())): boolean {
  return weeksUntil(dateStr, today) >= MIN_WEEKS
}

/** Return "X WEEKS TO GO" label for a selected date */
export function weeksToGoLabel(dateStr: string, today = toDateString(new Date())): string {
  const w = weeksUntil(dateStr, today)
  return `${w} WEEK${w === 1 ? '' : 'S'} TO GO`
}

/** Return array of Date objects for all days in a given month (year, 0-indexed month) */
export function daysInMonth(year: number, month: number): Date[] {
  const days: Date[] = []
  const d = new Date(year, month, 1)
  while (d.getMonth() === month) {
    days.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return days
}
