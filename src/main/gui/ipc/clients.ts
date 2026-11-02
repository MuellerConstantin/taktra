import { z } from 'zod'
import { clientInput, id, listOptions } from '../../../shared/validation'
import {
  createClient,
  deleteClient,
  findClient,
  listClients,
  setClientArchived,
  updateClient
} from '../../core/domain/clients'
import { handle } from './handle'

export function initClients(): void {
  handle('clients:list', z.tuple([listOptions]), (_, options) => listClients(options))
  handle('clients:get', z.tuple([id]), (_, clientId) => findClient(clientId))
  handle('clients:create', z.tuple([clientInput]), (_, input) => createClient(input))
  handle('clients:update', z.tuple([id, clientInput.partial()]), (_, clientId, patch) =>
    updateClient(clientId, patch)
  )
  handle('clients:setArchived', z.tuple([id, z.boolean()]), (_, clientId, archived) =>
    setClientArchived(clientId, archived)
  )
  handle('clients:delete', z.tuple([id]), (_, clientId) => deleteClient(clientId))
}
