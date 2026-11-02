import { z } from 'zod'
import { exportTemplateInput, id } from '../../../shared/validation'
import {
  createExportTemplate,
  deleteExportTemplate,
  getExportTemplate,
  listExportTemplates,
  updateExportTemplate
} from '../../core/domain/exportTemplates'
import { handle } from './handle'

export function initExportTemplates(): void {
  handle('exportTemplates:list', z.tuple([]), () => listExportTemplates())
  handle('exportTemplates:get', z.tuple([id]), (_, templateId) => getExportTemplate(templateId))
  handle('exportTemplates:create', z.tuple([exportTemplateInput]), (_, input) =>
    createExportTemplate(input)
  )
  handle('exportTemplates:update', z.tuple([id, exportTemplateInput]), (_, templateId, input) =>
    updateExportTemplate(templateId, input)
  )
  handle('exportTemplates:delete', z.tuple([id]), (_, templateId) =>
    deleteExportTemplate(templateId)
  )
}
