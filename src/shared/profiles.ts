export const profileFileExtension = 'taktra'

export interface ProfileSummary {
  readonly path: string
  readonly name: string | null
  readonly isAvailable: boolean
  readonly isNewerVersion: boolean
}

export interface ProfilesState {
  readonly profiles: readonly ProfileSummary[]
  readonly activePath: string | null
}

export type OpenProfileResult =
  | { readonly status: 'opened'; readonly state: ProfilesState }
  | { readonly status: 'canceled' }
  | { readonly status: 'invalid' }
  | { readonly status: 'newerVersion' }
