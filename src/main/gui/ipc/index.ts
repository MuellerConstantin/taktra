import { initActivities } from './activities'
import { initClients } from './clients'
import { initCustomFields } from './customFields'
import { initDonation } from './donation'
import { initExport } from './export'
import { initExportTemplates } from './exportTemplates'
import { initProfiles } from './profiles'
import { initProjects } from './projects'
import { initReports } from './reports'
import { initSettings } from './settings'
import { initTags } from './tags'
import { initTimeEntries } from './timeEntries'
import { initTimer } from './timer'

export function initIpc(): void {
  initSettings()
  initProfiles()
  initClients()
  initProjects()
  initTags()
  initActivities()
  initCustomFields()
  initTimeEntries()
  initTimer()
  initReports()
  initExport()
  initExportTemplates()
  initDonation()
}
