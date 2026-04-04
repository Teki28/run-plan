import { describe, it, expect } from 'vitest'
import { weeksUntil, isSelectable, weeksToGoLabel, daysInMonth, toDateString } from './dates'

const TODAY = '2026-04-02'

describe('weeksUntil', () => {
  it('returns 0 for today', () => expect(weeksUntil(TODAY, TODAY)).toBe(0))
  it('returns 1 for 7 days ahead', () => expect(weeksUntil('2026-04-09', TODAY)).toBe(1))
  it('returns 4 for 28 days ahead', () => expect(weeksUntil('2026-04-30', TODAY)).toBe(4))
  it('returns negative for past date', () => expect(weeksUntil('2026-03-01', TODAY)).toBeLessThan(0))
  it('floors partial weeks', () => expect(weeksUntil('2026-04-10', TODAY)).toBe(1))
})

describe('isSelectable', () => {
  it('rejects today', () => expect(isSelectable(TODAY, TODAY)).toBe(false))
  it('rejects 3 weeks ahead', () => expect(isSelectable('2026-04-23', TODAY)).toBe(false))
  it('accepts exactly 4 weeks ahead', () => expect(isSelectable('2026-04-30', TODAY)).toBe(true))
  it('accepts far future', () => expect(isSelectable('2026-12-01', TODAY)).toBe(true))
  it('rejects past dates', () => expect(isSelectable('2025-01-01', TODAY)).toBe(false))
})

describe('weeksToGoLabel', () => {
  it('formats plural weeks', () => expect(weeksToGoLabel('2026-04-30', TODAY)).toBe('4 WEEKS TO GO'))
  it('formats singular week', () => expect(weeksToGoLabel('2026-04-09', TODAY)).toBe('1 WEEK TO GO'))
  it('formats 12 weeks', () => expect(weeksToGoLabel('2026-06-25', TODAY)).toBe('12 WEEKS TO GO'))
})

describe('daysInMonth', () => {
  it('returns 30 days for April', () => expect(daysInMonth(2026, 3).length).toBe(30))
  it('returns 28 days for Feb non-leap', () => expect(daysInMonth(2025, 1).length).toBe(28))
  it('returns 29 days for Feb leap year', () => expect(daysInMonth(2024, 1).length).toBe(29))
  it('first day is the 1st', () => expect(daysInMonth(2026, 3)[0].getDate()).toBe(1))
  it('last day matches month end', () => {
    const days = daysInMonth(2026, 3)
    expect(days[days.length - 1].getDate()).toBe(30)
  })
})

describe('toDateString', () => {
  it('formats date as YYYY-MM-DD', () => {
    expect(toDateString(new Date('2026-04-02'))).toBe('2026-04-02')
  })
})
