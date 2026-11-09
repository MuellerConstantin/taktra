import type { Activity, ActivityInput, ActivityWithTags } from '../model/activities'
import type { Client, ClientInput } from '../model/clients'
import type {
  CustomField,
  CustomFieldInput,
  CustomFieldOption,
  CustomFieldScope,
  CustomFieldWithOptions,
  FieldValue,
  FieldValueInput
} from '../model/customFields'
import type { ErrorCode } from '../model/errors'
import type {
  ExportColumn,
  ExportFormat,
  ExportLayout,
  ExportPreview,
  ExportTemplate,
  ExportTemplateInput
} from '../model/export'
import type { ProfilesState } from '../model/profiles'
import type { Project, ProjectInput } from '../model/projects'
import type { AggregateRow, Grouping, TimeFilter } from '../model/reports'
import type { Settings } from '../model/settings'
import type { Tag, TagInput } from '../model/tags'
import type {
  ActivityDetails,
  TimeEntry,
  TimeEntryDetails,
  TimeEntryFilter,
  TimeEntryInput
} from '../model/timeEntries'
import type { AppInfo } from './about'
import type { ShortcutStatus } from './shortcuts'
import type { UpdateStatus } from './updates'

export type IpcResponse<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: { readonly code: ErrorCode } }

/**
 * What the renderer can invoke in the main process, one entry per channel. The preload derives
 * its functions from it and `handle()` checks each handler against it, so both sides agree on
 * the arguments and the result of every channel.
 */
export interface IpcContract {
  'settings:get': () => Settings
  'settings:update': (patch: Partial<Settings>) => Settings

  'profiles:get': () => ProfilesState
  'profiles:create': (name: string, path: string) => ProfilesState
  'profiles:createSample': () => ProfilesState
  'profiles:setActive': (path: string) => ProfilesState
  'profiles:rename': (path: string, name: string) => ProfilesState
  'profiles:delete': (path: string) => ProfilesState
  'profiles:remove': (path: string) => ProfilesState
  'profiles:open': () => ProfilesState | null
  'profiles:defaultPath': (name: string) => string
  'profiles:choosePath': (defaultPath: string) => string | null

  'projects:list': (options?: { readonly includeArchived?: boolean }) => Project[]
  'projects:get': (id: number) => Project
  'projects:create': (input: ProjectInput) => Project
  'projects:update': (id: number, patch: Partial<ProjectInput>) => Project
  'projects:setArchived': (id: number, archived: boolean) => Project
  'projects:delete': (id: number) => void

  'clients:list': (options?: { readonly includeArchived?: boolean }) => Client[]
  'clients:get': (id: number) => Client
  'clients:create': (input: ClientInput) => Client
  'clients:update': (id: number, patch: Partial<ClientInput>) => Client
  'clients:setArchived': (id: number, archived: boolean) => Client
  'clients:delete': (id: number) => void

  'tags:list': () => Tag[]
  'tags:get': (id: number) => Tag
  'tags:create': (input: TagInput) => Tag
  'tags:update': (id: number, patch: Partial<TagInput>) => Tag
  'tags:delete': (id: number) => void

  'activities:list': (options?: {
    readonly projectId?: number
    readonly includeArchived?: boolean
  }) => ActivityWithTags[]
  'activities:get': (id: number) => ActivityDetails
  'activities:create': (input: ActivityInput) => Activity
  'activities:rename': (id: number, name: string) => Activity
  'activities:move': (id: number, projectId: number, name: string) => Activity
  'activities:setArchived': (id: number, archived: boolean) => Activity
  'activities:setClient': (id: number, clientId: number | null) => Activity
  'activities:setTags': (id: number, tagIds: readonly number[]) => void
  'activities:merge': (id: number, targetId: number) => void
  'activities:delete': (id: number) => void

  'customFields:list': (options?: {
    readonly scope?: CustomFieldScope
    readonly includeArchived?: boolean
  }) => CustomFieldWithOptions[]
  'customFields:create': (input: CustomFieldInput) => CustomField
  'customFields:rename': (id: number, name: string) => CustomField
  'customFields:setArchived': (id: number, archived: boolean) => CustomField
  'customFields:delete': (id: number) => void
  'customFields:createOption': (fieldId: number, name: string) => CustomFieldOption
  'customFields:renameOption': (id: number, name: string) => CustomFieldOption
  'customFields:setOptionArchived': (id: number, archived: boolean) => CustomFieldOption
  'customFields:deleteOption': (id: number) => void
  'customFields:values': (scope: CustomFieldScope, ownerId: number) => FieldValue[]
  'customFields:setValues': (
    scope: CustomFieldScope,
    ownerId: number,
    values: readonly FieldValueInput[]
  ) => FieldValue[]

  'reports:aggregate': (filter: TimeFilter, groupBy: readonly Grouping[]) => AggregateRow[]

  'export:preview': (
    filter: TimeFilter,
    columns?: readonly ExportColumn[],
    layout?: ExportLayout
  ) => ExportPreview
  'export:file': (
    filter: TimeFilter,
    format: ExportFormat,
    columns?: readonly ExportColumn[],
    layout?: ExportLayout
  ) => string | null

  'exportTemplates:list': () => ExportTemplate[]
  'exportTemplates:get': (id: number) => ExportTemplate
  'exportTemplates:create': (input: ExportTemplateInput) => ExportTemplate
  'exportTemplates:update': (id: number, input: ExportTemplateInput) => ExportTemplate
  'exportTemplates:delete': (id: number) => void

  'timeEntries:list': (filter: TimeEntryFilter) => TimeEntryDetails[]
  'timeEntries:create': (input: TimeEntryInput) => TimeEntry
  'timeEntries:update': (id: number, input: TimeEntryInput) => TimeEntry
  'timeEntries:moveToDay': (id: number, date: string) => TimeEntry
  'timeEntries:note': (id: number, note: string) => void
  'timeEntries:delete': (id: number) => void

  'timer:get': () => TimeEntryDetails | null
  'timer:start': (activityId: number, note?: string) => TimeEntryDetails
  'timer:setStart': (startedAt: Date) => TimeEntryDetails
  'timer:stop': () => void
  'timer:discard': () => void
  'timer:recent': (limit: number) => ActivityDetails[]

  'updates:status': () => UpdateStatus
  'updates:check': () => void
  'updates:install': () => void

  'shortcuts:status': () => ShortcutStatus
  'shortcuts:setQuickStart': (accelerator: string) => Settings
  'shortcuts:setRecording': (recording: boolean) => void

  'quick:hide': () => void
  'quick:toggle': () => void
  'quick:resize': (height: number) => void

  'donation:hint': () => boolean
  'donation:snooze': () => void
  'donation:dismiss': () => void

  'app:showMainWindow': () => void
  'app:quit': () => void
  'app:info': () => AppInfo
  'app:openDataFolder': () => void
  'app:setMainVisible': (visible: boolean) => void
}

export type InvokeChannel = keyof IpcContract

/**
 * The messages the main process sends to windows. A changed state is named after the signal of
 * the core that reports it; the others come from the GUI itself.
 */
export type WindowMessage =
  | `${'timer' | 'data' | 'profiles' | 'settings' | 'donation' | 'updates'}:changed`
  | 'quick:shown'
  | 'about:show'
