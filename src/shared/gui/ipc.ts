import type { ErrorCode } from '../model/errors'

export type IpcResponse<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: { readonly code: ErrorCode } }

/**
 * The channels the renderer invokes and the main process handles. Both sides are typed against
 * this list, so a channel renamed on one side fails the typecheck on the other.
 */
export type InvokeChannel =
  | `activities:${'list' | 'get' | 'create' | 'rename' | 'move' | 'setArchived' | 'setClient' | 'setTags' | 'merge' | 'delete'}`
  | `apiAccess:${'state' | 'createKey'}`
  | `app:${'info' | 'openDataFolder' | 'quit' | 'setMainVisible' | 'showMainWindow'}`
  | `clients:${'list' | 'get' | 'create' | 'update' | 'setArchived' | 'delete'}`
  | `customFields:${'list' | 'create' | 'rename' | 'setArchived' | 'delete' | 'createOption' | 'renameOption' | 'setOptionArchived' | 'deleteOption' | 'values' | 'setValues'}`
  | `donation:${'hint' | 'snooze' | 'dismiss'}`
  | `export:${'preview' | 'file'}`
  | `exportTemplates:${'list' | 'get' | 'create' | 'update' | 'delete'}`
  | `profiles:${'get' | 'create' | 'createSample' | 'setActive' | 'rename' | 'delete' | 'remove' | 'open' | 'defaultPath' | 'choosePath'}`
  | `projects:${'list' | 'get' | 'create' | 'update' | 'setArchived' | 'delete'}`
  | `quick:${'hide' | 'toggle' | 'resize'}`
  | `reports:${'aggregate'}`
  | `settings:${'get' | 'update'}`
  | `shortcuts:${'status' | 'setQuickStart' | 'setRecording'}`
  | `tags:${'list' | 'get' | 'create' | 'update' | 'delete'}`
  | `timeEntries:${'list' | 'create' | 'update' | 'note' | 'delete'}`
  | `timer:${'get' | 'start' | 'stop' | 'discard' | 'recent'}`
  | `updates:${'status' | 'check' | 'install'}`

/**
 * The messages the main process sends to windows. A changed state is named after the signal of
 * the core that reports it; the others come from the GUI itself.
 */
export type WindowMessage =
  | `${'timer' | 'data' | 'profiles' | 'settings' | 'donation' | 'apiAccess' | 'updates'}:changed`
  | 'quick:shown'
  | 'about:show'
