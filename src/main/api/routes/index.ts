import type { Hono } from 'hono'
import { registerActivityRoutes } from './activities'
import { registerClientRoutes } from './clients'
import { registerProfileRoutes } from './profile'
import { registerProjectRoutes } from './projects'
import { registerReportRoutes } from './reports'
import { registerTagRoutes } from './tags'
import { registerTimeEntryRoutes } from './timeEntries'
import { registerTimerRoutes } from './timer'

export function registerRoutes(v1: Hono): void {
  registerProfileRoutes(v1)
  registerProjectRoutes(v1)
  registerActivityRoutes(v1)
  registerClientRoutes(v1)
  registerTagRoutes(v1)
  registerTimeEntryRoutes(v1)
  registerReportRoutes(v1)
  registerTimerRoutes(v1)
}
