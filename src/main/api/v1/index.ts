import { OpenAPIHono } from '@hono/zod-openapi'
import { bodyLimit } from 'hono/body-limit'
import { guard } from '../guard'
import { invalidRequest } from '../parse'
import { API_DESCRIPTION } from './description'
import { handleError, tooLarge } from './errors'
import { registerRoutes } from './routes'

export const V1_PATH = '/api/v1'

const MAX_BODY_BYTES = 64 * 1024

/**
 * Version 1 of the API, complete in itself: access, limits and the error format belong to the
 * version, so another version may change them. It describes itself at `openapi.json`.
 */
export function createV1(port: () => number): OpenAPIHono {
  const v1 = new OpenAPIHono({
    defaultHook: (result) => {
      if (!result.success) throw invalidRequest(result.error)
    }
  })
  v1.use(guard(port), bodyLimit({ maxSize: MAX_BODY_BYTES, onError: tooLarge }))
  v1.onError(handleError)
  registerRoutes(v1)

  v1.openAPIRegistry.registerComponent('securitySchemes', 'apiKey', {
    type: 'http',
    scheme: 'bearer',
    description: 'The API key from the integrations page of the app settings.'
  })
  v1.doc31('/openapi.json', {
    openapi: '3.1.0',
    info: { title: 'Taktra Local API', version: 'v1', description: API_DESCRIPTION },
    servers: [{ url: V1_PATH }],
    security: [{ apiKey: [] }]
  })
  return v1
}
