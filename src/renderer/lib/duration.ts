const MAX_DURATION_SEC = 24 * 3600

const CLOCK = /^(\d+):([0-5]?\d)$/
const DECIMAL_HOURS = /^(\d+(?:[.,]\d+)?|[.,]\d+)$/
const UNITS = /^(?:(\d+(?:[.,]\d+)?)\s*h)?\s*(?:(\d+)\s*(?:m|min)?)?$/i

export function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60)
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`
}

export function elapsedSeconds(startedAt: Date, now: number): number {
  return Math.max(0, Math.floor((now - startedAt.getTime()) / 1000))
}

export function formatElapsed(seconds: number): string {
  const pad = (value: number): string => String(value).padStart(2, '0')
  return `${Math.floor(seconds / 3600)}:${pad(Math.floor(seconds / 60) % 60)}:${pad(seconds % 60)}`
}

function toSeconds(hours: number, minutes: number): number | null {
  const seconds = Math.round(hours * 60 + minutes) * 60
  return seconds > 0 && seconds <= MAX_DURATION_SEC ? seconds : null
}

export function parseDuration(text: string): number | null {
  const value = text.trim()
  if (!value) return null

  const clock = CLOCK.exec(value)
  if (clock) return toSeconds(Number(clock[1]), Number(clock[2]))

  if (DECIMAL_HOURS.test(value)) return toSeconds(Number(value.replace(',', '.')), 0)

  const units = UNITS.exec(value)
  if (!units || (!units[1] && !units[2])) return null
  const hours = units[1] ? Number(units[1].replace(',', '.')) : 0
  return toSeconds(hours, units[2] ? Number(units[2]) : 0)
}
