import { z } from 'zod'
import { exportTemplateInput, id } from '../../../shared/validation'
import { exportTemplates } from '../../core'
import { handle } from './handle'

export function registerExportTemplatesHandlers(): void {
  handle('exportTemplates:list', z.tuple([]), () => exportTemplates.list())
  handle('exportTemplates:get', z.tuple([id]), (_, templateId) => exportTemplates.get(templateId))
  handle('exportTemplates:create', z.tuple([exportTemplateInput]), (_, input) =>
    exportTemplates.create(input)
  )
  handle('exportTemplates:update', z.tuple([id, exportTemplateInput]), (_, templateId, input) =>
    exportTemplates.update(templateId, input)
  )
  handle('exportTemplates:delete', z.tuple([id]), (_, templateId) =>
    exportTemplates.delete(templateId)
  )
}
