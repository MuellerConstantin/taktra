export const apiStatuses = ['disabled', 'running', 'portInUse'] as const

export type ApiStatus = (typeof apiStatuses)[number]

export interface ApiState {
  readonly status: ApiStatus
  readonly hasKey: boolean
}
