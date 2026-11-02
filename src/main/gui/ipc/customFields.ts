import { z } from 'zod'
import {
  customFieldInput,
  customFieldListOptions,
  customFieldScope,
  fieldValueInput,
  id,
  name
} from '../../../shared/validation'
import {
  createCustomField,
  createCustomFieldOption,
  deleteCustomField,
  deleteCustomFieldOption,
  getFieldValues,
  listCustomFields,
  renameCustomField,
  renameCustomFieldOption,
  setCustomFieldArchived,
  setCustomFieldOptionArchived,
  setFieldValues
} from '../../core/domain/customFields'
import { handle } from './handle'

export function initCustomFields(): void {
  handle('customFields:list', z.tuple([customFieldListOptions]), (_, options) =>
    listCustomFields(options)
  )
  handle('customFields:create', z.tuple([customFieldInput]), (_, input) => createCustomField(input))
  handle('customFields:rename', z.tuple([id, name]), (_, fieldId, newName) =>
    renameCustomField(fieldId, newName)
  )
  handle('customFields:setArchived', z.tuple([id, z.boolean()]), (_, fieldId, archived) =>
    setCustomFieldArchived(fieldId, archived)
  )
  handle('customFields:delete', z.tuple([id]), (_, fieldId) => deleteCustomField(fieldId))
  handle('customFields:createOption', z.tuple([id, name]), (_, fieldId, optionName) =>
    createCustomFieldOption(fieldId, optionName)
  )
  handle('customFields:renameOption', z.tuple([id, name]), (_, optionId, newName) =>
    renameCustomFieldOption(optionId, newName)
  )
  handle('customFields:setOptionArchived', z.tuple([id, z.boolean()]), (_, optionId, archived) =>
    setCustomFieldOptionArchived(optionId, archived)
  )
  handle('customFields:deleteOption', z.tuple([id]), (_, optionId) =>
    deleteCustomFieldOption(optionId)
  )
  handle('customFields:values', z.tuple([customFieldScope, id]), (_, scope, ownerId) =>
    getFieldValues(scope, ownerId)
  )
  handle(
    'customFields:setValues',
    z.tuple([customFieldScope, id, z.array(fieldValueInput)]),
    (_, scope, ownerId, values) => setFieldValues(scope, ownerId, values)
  )
}
