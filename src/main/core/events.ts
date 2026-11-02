/** State that several consumers show; each of them reloads what it needs when it changes. */
export const appEvents = ['timer', 'profiles', 'settings', 'donation'] as const

export type AppEvent = (typeof appEvents)[number]

const listeners: Record<AppEvent, Set<() => void>> = {
  timer: new Set(),
  profiles: new Set(),
  settings: new Set(),
  donation: new Set()
}

export function onChanged(event: AppEvent, listener: () => void): void {
  listeners[event].add(listener)
}

export function notifyChanged(event: AppEvent): void {
  for (const listener of listeners[event]) listener()
}
