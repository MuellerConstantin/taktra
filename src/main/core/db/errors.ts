export function isUniqueViolation(error: unknown): boolean {
  for (let current = error; current instanceof Error; current = current.cause) {
    if ((current as { code?: string }).code === 'SQLITE_CONSTRAINT_UNIQUE') return true
  }
  return false
}
