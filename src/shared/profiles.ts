export const profileFileExtension = 'taktra'

export type UnavailableReason = 'missing' | 'newerVersion' | 'migrationFailed'

export interface ProfileSummary {
  readonly path: string
  readonly name: string | null
  readonly isAvailable: boolean
  readonly unavailableReason: UnavailableReason | null
}

export interface ProfilesState {
  readonly profiles: readonly ProfileSummary[]
  readonly activePath: string | null
}
