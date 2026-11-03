import type { Hono } from 'hono'
import { exportTemplateInput } from '../../../shared/validation'
import { exportTemplates } from '../../core'
import { toExportTemplate } from '../dto/exportTemplates'
import { idParam, parse, readBody } from '../parse'

export function registerExportTemplateRoutes(v1: Hono): void {
  v1.get('/export-templates', (c) => c.json(exportTemplates.list().map(toExportTemplate)))
  v1.get('/export-templates/:id', (c) => c.json(toExportTemplate(exportTemplates.get(idParam(c)))))
  v1.post('/export-templates', async (c) => {
    const template = exportTemplates.create(parse(exportTemplateInput, await readBody(c)))
    return c.json(toExportTemplate(template), 201)
  })
  // A template is replaced as a whole, columns included.
  v1.put('/export-templates/:id', async (c) => {
    const input = parse(exportTemplateInput, await readBody(c))
    return c.json(toExportTemplate(exportTemplates.update(idParam(c), input)))
  })
  v1.delete('/export-templates/:id', (c) => {
    exportTemplates.delete(idParam(c))
    return c.body(null, 204)
  })
}
