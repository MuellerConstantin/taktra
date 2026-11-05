import { z } from 'zod'
import {
  customFieldInput,
  customFieldListOptions,
  customFieldScope,
  fieldValueInput,
  id,
  name
} from '@/shared/validation'
import { customFields } from '@/main/core'
import { handle } from './handle'

export function registerCustomFieldsHandlers(): void {
  handle('customFields:list', z.tuple([customFieldListOptions]), (_, options) =>
    customFields.list(options)
  )
  handle('customFields:create', z.tuple([customFieldInput]), (_, input) =>
    customFields.create(input)
  )
  handle('customFields:rename', z.tuple([id, name]), (_, fieldId, newName) =>
    customFields.rename(fieldId, newName)
  )
  handle('customFields:setArchived', z.tuple([id, z.boolean()]), (_, fieldId, archived) =>
    customFields.setArchived(fieldId, archived)
  )
  handle('customFields:delete', z.tuple([id]), (_, fieldId) => customFields.delete(fieldId))
  handle('customFields:createOption', z.tuple([id, name]), (_, fieldId, optionName) =>
    customFields.createOption(fieldId, optionName)
  )
  handle('customFields:renameOption', z.tuple([id, name]), (_, optionId, newName) =>
    customFields.renameOption(optionId, newName)
  )
  handle('customFields:setOptionArchived', z.tuple([id, z.boolean()]), (_, optionId, archived) =>
    customFields.setOptionArchived(optionId, archived)
  )
  handle('customFields:deleteOption', z.tuple([id]), (_, optionId) =>
    customFields.deleteOption(optionId)
  )
  handle('customFields:values', z.tuple([customFieldScope, id]), (_, scope, ownerId) =>
    customFields.getValues(scope, ownerId)
  )
  handle(
    'customFields:setValues',
    z.tuple([customFieldScope, id, z.array(fieldValueInput)]),
    (_, scope, ownerId, values) => customFields.setValues(scope, ownerId, values)
  )
}
