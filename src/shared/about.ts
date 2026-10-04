export const REPOSITORY_URL = 'https://github.com/MuellerConstantin/taktra'

export const RELEASES_URL = `${REPOSITORY_URL}/releases/latest`

export interface AppInfo {
  readonly version: string
  readonly author: string
  readonly electron: string
  readonly chrome: string
  readonly node: string
  readonly os: string
}
