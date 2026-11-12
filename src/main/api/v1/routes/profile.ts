import { createRoute, type OpenAPIHono } from '@hono/zod-openapi'
import { AppError } from '@/shared/model/errors'
import { profiles } from '@/main/core'
import { json } from '@/main/api/openapi'
import { errors } from '@/main/api/v1/errors'
import { ProfileV1 } from '@/main/api/v1/dto/profile'

const get = createRoute({
  method: 'get',
  path: '/profile',
  tags: ['Profile'],
  summary: 'Get the active profile',
  description: 'Every other route works on this profile. It is chosen in the app only.',
  responses: { 200: json(ProfileV1, 'The active profile'), ...errors(409) }
})

export function registerProfileRoutes(v1: OpenAPIHono): void {
  v1.openapi(get, (c) => {
    const { profiles: known, activePath } = profiles.getState()
    const active = known.find((profile) => profile.path === activePath && profile.isAvailable)
    if (!active) throw new AppError('NO_ACTIVE_PROFILE')
    return c.json({ name: active.name }, 200)
  })
}
