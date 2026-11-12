import { z } from '@hono/zod-openapi'

export const ProfileV1 = z.object({ name: z.string().nullable() }).openapi('Profile')
