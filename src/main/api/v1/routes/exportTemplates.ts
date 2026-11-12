import { createRoute, z, type OpenAPIHono } from '@hono/zod-openapi'
import { exportFormats, type ExportFormat } from '@/shared/model/export'
import { exportTemplateInput } from '@/shared/validation'
import { dataExport, exportTemplates } from '@/main/core'
import { ExportRowV1, ExportTemplateV1, toExportTemplate } from '@/main/api/v1/dto/exportTemplates'
import { json, jsonBody, noContent } from '@/main/api/openapi'
import { errors } from '@/main/api/v1/errors'
import { idParams, timeFilterQuery } from '@/main/api/v1/params'

const tags = ['Export templates']

const list = createRoute({
  method: 'get',
  path: '/export-templates',
  tags,
  summary: 'List export templates',
  responses: { 200: json(z.array(ExportTemplateV1), 'The templates, sorted by name'), ...errors() }
})

const get = createRoute({
  method: 'get',
  path: '/export-templates/{id}',
  tags,
  summary: 'Get an export template',
  request: { params: idParams },
  responses: { 200: json(ExportTemplateV1, 'The template'), ...errors(400, 404) }
})

const create = createRoute({
  method: 'post',
  path: '/export-templates',
  tags,
  summary: 'Create an export template',
  request: { body: jsonBody(exportTemplateInput) },
  responses: { 201: json(ExportTemplateV1, 'The new template'), ...errors(400, 409) }
})

const replace = createRoute({
  method: 'put',
  path: '/export-templates/{id}',
  tags,
  summary: 'Replace an export template',
  description: 'A template is replaced as a whole, columns included.',
  request: { params: idParams, body: jsonBody(exportTemplateInput) },
  responses: { 200: json(ExportTemplateV1, 'The changed template'), ...errors(400, 404, 409) }
})

const remove = createRoute({
  method: 'delete',
  path: '/export-templates/{id}',
  tags,
  summary: 'Delete an export template',
  request: { params: idParams },
  responses: { 204: noContent, ...errors(400, 404) }
})

const mediaTypes: Record<ExportFormat, string> = {
  csv: 'text/csv',
  json: 'application/json',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
}

const file = createRoute({
  method: 'get',
  path: '/export-templates/{id}/file',
  tags,
  summary: 'Export with a template',
  description:
    'Writes the completed entries of a period, filtered, with the columns and layout of the template: the same file the app exports. Lists are comma-separated, such as projectIds=1,2.',
  request: {
    params: idParams,
    query: z.object({
      ...timeFilterQuery,
      format: z
        .enum(exportFormats)
        .optional()
        .openapi({ description: 'The format of the file; by default the one of the template.' })
    })
  },
  responses: {
    200: {
      description: 'The file, named in Content-Disposition',
      content: {
        [mediaTypes.json]: { schema: z.array(ExportRowV1) },
        [mediaTypes.csv]: {
          schema: z.string().openapi({ description: 'RFC 4180: comma, CRLF, no BOM.' })
        },
        [mediaTypes.xlsx]: { schema: z.string().openapi({ format: 'binary' }) }
      }
    },
    ...errors(400, 404, 409)
  }
})

export function registerExportTemplateRoutes(v1: OpenAPIHono): void {
  v1.openapi(list, (c) => c.json(exportTemplates.list().map(toExportTemplate), 200))
  v1.openapi(get, (c) =>
    c.json(toExportTemplate(exportTemplates.get(c.req.valid('param').id)), 200)
  )
  v1.openapi(create, (c) =>
    c.json(toExportTemplate(exportTemplates.create(c.req.valid('json'))), 201)
  )
  v1.openapi(replace, (c) =>
    c.json(
      toExportTemplate(exportTemplates.update(c.req.valid('param').id, c.req.valid('json'))),
      200
    )
  )
  v1.openapi(file, async (c) => {
    const template = exportTemplates.get(c.req.valid('param').id)
    const { format = template.format, ...filter } = c.req.valid('query')
    const exported = await dataExport.buildFile(filter, format, template.columns, template.layout)
    const isText = typeof exported.content === 'string'
    return c.body(
      typeof exported.content === 'string' ? exported.content : new Uint8Array(exported.content),
      200,
      {
        'content-type': isText ? `${mediaTypes[format]}; charset=utf-8` : mediaTypes[format],
        'content-disposition': `attachment; filename="${exported.fileName}"`
      }
    )
  })
  v1.openapi(remove, (c) => {
    exportTemplates.delete(c.req.valid('param').id)
    return c.body(null, 204)
  })
}
