export type UpdateStatus =
  | { readonly state: 'unsupported' }
  | { readonly state: 'idle' }
  | { readonly state: 'checking' }
  | { readonly state: 'upToDate' }
  | { readonly state: 'downloading'; readonly version: string; readonly percent: number }
  | { readonly state: 'ready'; readonly version: string }
  | { readonly state: 'available'; readonly version: string }
  | { readonly state: 'error' }
