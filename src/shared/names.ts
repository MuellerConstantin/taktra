/** Removes surrounding whitespace and collapses inner runs, which are hard to tell apart on screen. */
export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ')
}

/**
 * Key that makes names unique regardless of case. Computed here instead of with SQLite's
 * `lower()`, which only folds ASCII letters ("Ärger" and "ärger" would both be accepted).
 * Locale-independent on purpose: the key is stored and must not change with the app language.
 */
export function toNameKey(name: string): string {
  return normalizeName(name).normalize('NFC').toLowerCase()
}
