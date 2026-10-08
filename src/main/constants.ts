export const APPLICATION_ID = 0x54414b54

export const RESERVED_FILE_NAMES = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/

export const SQLITE_SIDECAR_SUFFIXES = ['-wal', '-shm', '-journal'] as const

/** Starts the app in the tray only, e.g. when an MCP client needs it in the background. */
export const START_HIDDEN_ARG = '--hidden'
