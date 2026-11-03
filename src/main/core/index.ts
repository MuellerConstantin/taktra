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
export type { AppEvent } from './events'
export type { ExportFile } from './domain/export'
export { lazyStore } from './app/store'

export function startCore(environment: CoreEnvironment): void {
  setEnvironment(environment)
  profilesModule.openActiveProfile()
}

export function stopCore(): void {
  closeActiveDatabase()
}

export const events = {
  names: eventsModule.appEvents,
  onChanged: eventsModule.onChanged
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
  create: clientsModule.createClient,
  update: clientsModule.updateClient,
  setArchived: clientsModule.setClientArchived,
  delete: clientsModule.deleteClient
} as const

export const projects = {
  list: projectsModule.listProjects,
  get: projectsModule.findProject,
  create: projectsModule.createProject,
  update: projectsModule.updateProject,
  setArchived: projectsModule.setProjectArchived,
  delete: projectsModule.deleteProject
} as const

export const tags = {
  list: tagsModule.listTags,
  get: tagsModule.findTag,
  create: tagsModule.createTag,
  update: tagsModule.updateTag,
  delete: tagsModule.deleteTag
} as const

export const activities = {
  list: activitiesModule.listActivities,
  get: activitiesModule.getActivityDetails,
  create: activitiesModule.createActivity,
  rename: activitiesModule.renameActivity,
  move: activitiesModule.moveActivity,
  setArchived: activitiesModule.setActivityArchived,
  setClient: activitiesModule.setActivityClient,
  setTags: activitiesModule.setActivityTags,
  merge: activitiesModule.mergeActivity,
  delete: activitiesModule.deleteActivity
} as const

export const customFields = {
  list: customFieldsModule.listCustomFields,
  create: customFieldsModule.createCustomField,
  rename: customFieldsModule.renameCustomField,
  setArchived: customFieldsModule.setCustomFieldArchived,
  delete: customFieldsModule.deleteCustomField,
  createOption: customFieldsModule.createCustomFieldOption,
  renameOption: customFieldsModule.renameCustomFieldOption,
  setOptionArchived: customFieldsModule.setCustomFieldOptionArchived,
  deleteOption: customFieldsModule.deleteCustomFieldOption,
  getValues: customFieldsModule.getFieldValues,
  listValues: customFieldsModule.listFieldValues,
  setValues: customFieldsModule.setFieldValues
} as const

export const timeEntries = {
  list: timeEntriesModule.listTimeEntries,
  create: timeEntriesModule.createTimeEntry,
  update: timeEntriesModule.updateTimeEntry,
  setNote: timeEntriesModule.setTimeEntryNote,
  delete: timeEntriesModule.deleteTimeEntry
} as const

export const timer = {
  get: timerModule.getRunningTimer,
  isRunning: timerModule.hasRunningTimer,
  start: timerModule.startTimer,
  stop: timerModule.stopTimer,
  discard: timerModule.discardTimer,
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
  create: exportTemplatesModule.createExportTemplate,
  update: exportTemplatesModule.updateExportTemplate,
  delete: exportTemplatesModule.deleteExportTemplate
} as const
