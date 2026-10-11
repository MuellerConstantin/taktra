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

function significantWords(name: string): Set<string> {
  return new Set(
    toNameKey(name)
      .split(/[\s\p{P}\p{S}]+/u)
      .filter((word) => word !== '' && !/^\d+$/.test(word))
  )
}

/** True when every word of one name occurs in the other, ignoring numbers: "Workshop X 2" ~ "Workshop X". */
export function isSimilarName(a: string, b: string): boolean {
  const [wordsA, wordsB] = [significantWords(a), significantWords(b)]
  const [fewer, more] = wordsA.size <= wordsB.size ? [wordsA, wordsB] : [wordsB, wordsA]
  return fewer.size > 0 && [...fewer].every((word) => more.has(word))
}
