export const profileFileExtension = 'taktra'

export interface ProfileSummary {
  readonly path: string
  readonly name: string | null
  readonly isAvailable: boolean
}

export interface ProfilesState {
  readonly profiles: readonly ProfileSummary[]
  readonly activePath: string | null
}
