import { describe, it, expect } from 'vitest'
import { kmToMi, miToKm, clampMileage, toDisplayUnit, toStorageKm } from './units'

describe('kmToMi', () => {
  it('converts 0', () => expect(kmToMi(0)).toBe(0))
  it('converts 10km', () => expect(kmToMi(10)).toBe(6))
  it('converts 100km', () => expect(kmToMi(100)).toBe(62))
  it('converts 200km', () => expect(kmToMi(200)).toBe(124))
})

describe('miToKm', () => {
  it('converts 0', () => expect(miToKm(0)).toBe(0))
  it('converts 10mi', () => expect(miToKm(10)).toBe(16))
  it('converts 62mi', () => expect(miToKm(62)).toBe(100))
})

describe('clampMileage', () => {
  it('clamps below min', () => expect(clampMileage(-5, 'km')).toBe(0))
  it('clamps above km max', () => expect(clampMileage(250, 'km')).toBe(200))
  it('clamps above mi max', () => expect(clampMileage(200, 'mi')).toBe(125))
  it('passes through valid km', () => expect(clampMileage(50, 'km')).toBe(50))
  it('passes through valid mi', () => expect(clampMileage(60, 'mi')).toBe(60))
  it('rounds to integer', () => expect(clampMileage(20.7, 'km')).toBe(21))
})

describe('toDisplayUnit', () => {
  it('returns km unchanged', () => expect(toDisplayUnit(40, 'km')).toBe(40))
  it('converts to mi', () => expect(toDisplayUnit(40, 'mi')).toBe(25))
})

describe('toStorageKm', () => {
  it('returns km unchanged', () => expect(toStorageKm(40, 'km')).toBe(40))
  it('converts mi to km', () => expect(toStorageKm(25, 'mi')).toBe(40))
})
