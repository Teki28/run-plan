const KM_TO_MI = 0.621371
const MI_TO_KM = 1.60934

export function kmToMi(km: number): number {
  return Math.round(km * KM_TO_MI)
}

export function miToKm(mi: number): number {
  return Math.round(mi * MI_TO_KM)
}

export function clampMileage(value: number, unit: 'km' | 'mi'): number {
  const min = 0
  const max = unit === 'km' ? 200 : 125
  return Math.max(min, Math.min(max, Math.round(value)))
}

/** Convert a stored km value to the display unit */
export function toDisplayUnit(km: number, unit: 'km' | 'mi'): number {
  return unit === 'km' ? km : kmToMi(km)
}

/** Convert a display-unit value back to km for storage */
export function toStorageKm(displayValue: number, unit: 'km' | 'mi'): number {
  return unit === 'km' ? displayValue : miToKm(displayValue)
}
