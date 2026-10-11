import type { Language } from '../../shared/settings'
import { getSettings } from '../settings'

const collators = new Map<Language, Intl.Collator>()

/** Compares names in the order of the app language, which SQLite cannot sort by. */
export function compareNames(a: string, b: string): number {
  const { language } = getSettings()
  const collator = collators.get(language) ?? new Intl.Collator(language)
  collators.set(language, collator)
  return collator.compare(a, b)
}

export function sortByName<T extends { readonly name: string }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => compareNames(a.name, b.name))
}
