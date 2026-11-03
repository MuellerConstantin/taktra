import { EventEmitter } from 'node:events'

/**
 * State that several consumers show; each of them reloads what it needs when it changes.
 * - `timer`: the running timer started, stopped or was discarded, or what it shows changed
 *   (the name, project, client or tags of its activity)
 * - `data`: a write of a service object changed the data of the active profile, sent after
 *   every one, whoever made it
 * - `profiles`: a profile was added, removed or renamed, or another one became active
 * - `settings`: the app settings changed
 * - `donation`: a usage day was counted, or the donation hint was snoozed or dismissed
 * - `apiAccess`: the local API started, stopped or found its port in use, or a new key was
 *   created
 */
export const signals = ['timer', 'profiles', 'settings', 'donation', 'apiAccess', 'data'] as const

export type Signal = (typeof signals)[number]

/**
 * Events are named by their kind: a `signal:<state>` carries no payload. Events about single
 * facts with a payload would get a kind of their own, such as `domain:<resource>.<action>`.
 */
type AppEventMap = { [S in Signal as `signal:${S}`]: [] }

export type AppEvent = keyof AppEventMap

const emitter = new EventEmitter<AppEventMap>()

/** Returns a function that removes the listener again. */
export function on(event: AppEvent, listener: () => void): () => void {
  emitter.on(event, listener)
  return () => emitter.off(event, listener)
}

export function emit(event: AppEvent): void {
  emitter.emit(event)
}
