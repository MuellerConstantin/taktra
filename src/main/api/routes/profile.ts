import type { Hono } from 'hono'
import { AppError } from '../../../shared/model/errors'
import { profiles } from '../../core'

export function registerProfileRoutes(v1: Hono): void {
  v1.get('/profile', (c) => {
    const { profiles: known, activePath } = profiles.getState()
    const active = known.find((profile) => profile.path === activePath && profile.isAvailable)
    if (!active) throw new AppError('NO_ACTIVE_PROFILE')
    return c.json({ name: active.name })
  })
}
