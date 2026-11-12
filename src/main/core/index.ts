import * as apiAccessModule from './app/apiAccess'
import * as donationModule from './app/donation'
import * as profilesModule from './app/profiles'
import * as settingsModule from './app/settings'
import { closeActiveDatabase } from './db/database'
import * as activitiesModule from './domain/activities'
import * as clientsModule from './domain/clients'
import * as customFieldsModule from './domain/customFields'
import * as exportModule from './domain/export'
import * as exportTemplatesModule from './domain/exportTemplates'
import * as projectsModule from './domain/projects'
import * as reportsModule from './domain/reports'
import * as tagsModule from './domain/tags'
import * as timeEntriesModule from './domain/timeEntries'
import * as timerModule from './domain/timer'
import { setEnvironment, type CoreEnvironment } from './environment'
import * as eventsModule from './events'

/**
 * The public interface of the core: one service object per area. Presentations such as the GUI
 * import only from here; modules inside the core import each other directly, never this file.
 */

export type { CoreEnvironment } from './environment'
export type { AppEvent, Signal } from './events'
export type { ExportFile } from './domain/export'
export { lazyStore } from './app/store'

export function startCore(environment: CoreEnvironment): void {
  setEnvironment(environment)
  profilesModule.openActiveProfile()
}

export function stopCore(): void {
  closeActiveDatabase()
}

/**
 * Wraps a write, so every presentation reloads after it, also after writes it did not make
 * itself, such as those through the local API.
 */
function notifying<Args extends unknown[], Result>(
  write: (...args: Args) => Result
): (...args: Args) => Result {
  return (...args) => {
    const result = write(...args)
    eventsModule.emit('signal:data')
    return result
  }
}

export const events = {
  signals: eventsModule.signals,
  on: eventsModule.on
} as const

export const settings = {
  get: settingsModule.getSettings,
  update: settingsModule.updateSettings
} as const

export const apiAccess = {
  getState: apiAccessModule.getApiState,
  setStatus: apiAccessModule.setApiStatus,
  createKey: apiAccessModule.createApiKey,
  verifyKey: apiAccessModule.verifyApiKey
} as const

export const profiles = {
  getState: profilesModule.getProfilesState,
  create: profilesModule.createProfile,
  createSample: profilesModule.createSampleProfile,
  add: profilesModule.addProfile,
  rename: profilesModule.renameProfile,
  setActive: profilesModule.setActiveProfile,
  remove: profilesModule.removeProfile,
  delete: profilesModule.deleteProfile,
  defaultPath: profilesModule.getDefaultProfilePath,
  directory: profilesModule.profilesDirectory
} as const

export const donation = {
  recordUsageDay: donationModule.recordUsageDay,
  isHintDue: donationModule.isHintDue,
  snoozeHint: donationModule.snoozeHint,
  dismissHint: donationModule.dismissHint
} as const

export const clients = {
  list: clientsModule.listClients,
  get: clientsModule.findClient,
  create: notifying(clientsModule.createClient),
  update: notifying(clientsModule.updateClient),
  setArchived: notifying(clientsModule.setClientArchived),
  delete: notifying(clientsModule.deleteClient)
} as const

export const projects = {
  list: projectsModule.listProjects,
  get: projectsModule.findProject,
  create: notifying(projectsModule.createProject),
  update: notifying(projectsModule.updateProject),
  setArchived: notifying(projectsModule.setProjectArchived),
  delete: notifying(projectsModule.deleteProject)
} as const

export const tags = {
  list: tagsModule.listTags,
  get: tagsModule.findTag,
  create: notifying(tagsModule.createTag),
  update: notifying(tagsModule.updateTag),
  delete: notifying(tagsModule.deleteTag)
} as const

export const activities = {
  list: activitiesModule.listActivities,
  get: activitiesModule.getActivityDetails,
  create: notifying(activitiesModule.createActivity),
  rename: notifying(activitiesModule.renameActivity),
  move: notifying(activitiesModule.moveActivity),
  setArchived: notifying(activitiesModule.setActivityArchived),
  setClient: notifying(activitiesModule.setActivityClient),
  setTags: notifying(activitiesModule.setActivityTags),
  merge: notifying(activitiesModule.mergeActivity),
  delete: notifying(activitiesModule.deleteActivity)
} as const

export const customFields = {
  list: customFieldsModule.listCustomFields,
  create: notifying(customFieldsModule.createCustomField),
  rename: notifying(customFieldsModule.renameCustomField),
  setArchived: notifying(customFieldsModule.setCustomFieldArchived),
  delete: notifying(customFieldsModule.deleteCustomField),
  createOption: notifying(customFieldsModule.createCustomFieldOption),
  renameOption: notifying(customFieldsModule.renameCustomFieldOption),
  setOptionArchived: notifying(customFieldsModule.setCustomFieldOptionArchived),
  deleteOption: notifying(customFieldsModule.deleteCustomFieldOption),
  getValues: customFieldsModule.getFieldValues,
  listValues: customFieldsModule.listFieldValues,
  setValues: notifying(customFieldsModule.setFieldValues)
} as const

export const timeEntries = {
  list: timeEntriesModule.listTimeEntries,
  get: timeEntriesModule.getTimeEntryDetails,
  create: notifying(timeEntriesModule.createTimeEntry),
  update: notifying(timeEntriesModule.updateTimeEntry),
  moveToDay: notifying(timeEntriesModule.moveTimeEntryToDay),
  setNote: notifying(timeEntriesModule.setTimeEntryNote),
  delete: notifying(timeEntriesModule.deleteTimeEntry)
} as const

export const timer = {
  get: timerModule.getRunningTimer,
  isRunning: timerModule.hasRunningTimer,
  start: notifying(timerModule.startTimer),
  setStart: notifying(timerModule.setTimerStart),
  stop: notifying(timerModule.stopTimer),
  discard: notifying(timerModule.discardTimer),
  recentActivities: timerModule.listRecentActivities
} as const

export const reports = {
  aggregate: reportsModule.aggregate
} as const

export const dataExport = {
  preview: exportModule.previewExport,
  buildFile: exportModule.buildExportFile
} as const

export const exportTemplates = {
  list: exportTemplatesModule.listExportTemplates,
  get: exportTemplatesModule.getExportTemplate,
  create: notifying(exportTemplatesModule.createExportTemplate),
  update: notifying(exportTemplatesModule.updateExportTemplate),
  delete: notifying(exportTemplatesModule.deleteExportTemplate)
} as const
