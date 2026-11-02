import { EventEmitter } from 'node:events'

/** State that several consumers show; each of them reloads what it needs when it changes. */
export const appEvents = ['timer', 'profiles', 'settings', 'donation'] as const

export type AppEvent = (typeof appEvents)[number]

const emitter = new EventEmitter<Record<AppEvent, []>>()
// Consumers may add a listener per connection, so many listeners are expected, not a leak.
emitter.setMaxListeners(0)

/** Returns a function that removes the listener again. */
export function onChanged(event: AppEvent, listener: () => void): () => void {
  emitter.on(event, listener)
  return () => emitter.off(event, listener)
}

export function notifyChanged(event: AppEvent): void {
  emitter.emit(event)
}
