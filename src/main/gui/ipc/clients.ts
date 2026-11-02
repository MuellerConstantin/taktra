import { z } from 'zod'
import { clientInput, id, listOptions } from '../../../shared/validation'
import { clients } from '../../core'
import { handle } from './handle'

export function registerClientsHandlers(): void {
  handle('clients:list', z.tuple([listOptions]), (_, options) => clients.list(options))
  handle('clients:get', z.tuple([id]), (_, clientId) => clients.get(clientId))
  handle('clients:create', z.tuple([clientInput]), (_, input) => clients.create(input))
  handle('clients:update', z.tuple([id, clientInput.partial()]), (_, clientId, patch) =>
    clients.update(clientId, patch)
  )
  handle('clients:setArchived', z.tuple([id, z.boolean()]), (_, clientId, archived) =>
    clients.setArchived(clientId, archived)
  )
  handle('clients:delete', z.tuple([id]), (_, clientId) => clients.delete(clientId))
}
