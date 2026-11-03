import type { OpenAPIHono } from '@hono/zod-openapi'
import { registerActivityRoutes } from './activities'
import { registerClientRoutes } from './clients'
import { registerCustomFieldRoutes } from './customFields'
import { registerEventRoutes } from './events'
import { registerExportTemplateRoutes } from './exportTemplates'
import { registerProfileRoutes } from './profile'
import { registerProjectRoutes } from './projects'
import { registerReportRoutes } from './reports'
import { registerTagRoutes } from './tags'
import { registerTimeEntryRoutes } from './timeEntries'
import { registerTimerRoutes } from './timer'

export function registerRoutes(v1: OpenAPIHono): void {
  registerProfileRoutes(v1)
  registerProjectRoutes(v1)
  registerActivityRoutes(v1)
  registerClientRoutes(v1)
  registerCustomFieldRoutes(v1)
  registerTagRoutes(v1)
  registerTimeEntryRoutes(v1)
  registerReportRoutes(v1)
  registerTimerRoutes(v1)
  registerExportTemplateRoutes(v1)
  registerEventRoutes(v1)
}
