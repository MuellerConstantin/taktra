import { registerActivitiesHandlers } from './activities'
import { registerApiAccessHandlers } from './apiAccess'
import { registerClientsHandlers } from './clients'
import { registerCustomFieldsHandlers } from './customFields'
import { registerDonationHandlers } from './donation'
import { registerExportHandlers } from './export'
import { registerExportTemplatesHandlers } from './exportTemplates'
import { registerProfilesHandlers } from './profiles'
import { registerProjectsHandlers } from './projects'
import { registerReportsHandlers } from './reports'
import { registerSettingsHandlers } from './settings'
import { registerTagsHandlers } from './tags'
import { registerTimeEntriesHandlers } from './timeEntries'
import { registerTimerHandlers } from './timer'

export function registerIpcHandlers(): void {
  registerSettingsHandlers()
  registerProfilesHandlers()
  registerClientsHandlers()
  registerProjectsHandlers()
  registerTagsHandlers()
  registerActivitiesHandlers()
  registerCustomFieldsHandlers()
  registerTimeEntriesHandlers()
  registerTimerHandlers()
  registerReportsHandlers()
  registerExportHandlers()
  registerExportTemplatesHandlers()
  registerDonationHandlers()
  registerApiAccessHandlers()
}
