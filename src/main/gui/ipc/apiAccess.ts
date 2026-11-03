import { z } from 'zod'
import { apiAccess } from '../../core'
import { handle } from './handle'

export function registerApiAccessHandlers(): void {
  handle('apiAccess:state', z.tuple([]), () => apiAccess.getState())
  handle('apiAccess:createKey', z.tuple([]), () => apiAccess.createKey())
}
