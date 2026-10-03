export const isMac = navigator.userAgent.includes('Mac')

const namedKeys: Record<string, string> = {
  Space: 'Space',
  Enter: 'Return',
  Tab: 'Tab',
  Backspace: 'Backspace',
  Delete: 'Delete',
  Insert: 'Insert',
  Home: 'Home',
  End: 'End',
  PageUp: 'PageUp',
  PageDown: 'PageDown',
  ArrowUp: 'Up',
  ArrowDown: 'Down',
  ArrowLeft: 'Left',
  ArrowRight: 'Right',
  Comma: ',',
  Period: '.',
  Minus: '-',
  Equal: '=',
  Slash: '/',
  Semicolon: ';',
  Quote: "'",
  BracketLeft: '[',
  BracketRight: ']',
  Backslash: '\\',
  Backquote: '`'
}

type KeyEvent = Pick<KeyboardEvent, 'code' | 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey'>

function keyFromCode(code: string): string | undefined {
  return (
    /^Key([A-Z])$/.exec(code)?.[1] ??
    /^Digit(\d)$/.exec(code)?.[1] ??
    (/^F\d{1,2}$/.test(code) ? code : namedKeys[code])
  )
}

export function acceleratorFromEvent(event: KeyEvent): string | null {
  const key = keyFromCode(event.code)
  const modifiers = [
    event.ctrlKey && 'Control',
    event.metaKey && (isMac ? 'Command' : 'Super'),
    event.altKey && 'Alt',
    event.shiftKey && 'Shift'
  ].filter((modifier): modifier is string => Boolean(modifier))

  if (!key || modifiers.length === 0 || (modifiers.length === 1 && event.shiftKey)) return null
  return [...modifiers, key].join('+')
}

export interface KeyLabels {
  readonly ctrl: string
  readonly space: string
}

export function formatAccelerator(accelerator: string, labels: KeyLabels): string[] {
  const symbols: Record<string, string> = isMac
    ? { CommandOrControl: '⌘', Command: '⌘', Control: '⌃', Alt: '⌥', Shift: '⇧' }
    : {
        CommandOrControl: labels.ctrl,
        Control: labels.ctrl,
        Super: 'Win',
        Alt: 'Alt',
        Shift: 'Shift'
      }
  const keys: Record<string, string> = {
    Space: labels.space,
    Return: 'Enter',
    Up: '↑',
    Down: '↓',
    Left: '←',
    Right: '→'
  }
  return accelerator.split('+').map((part) => symbols[part] ?? keys[part] ?? part)
}

export const appShortcuts = {
  timer: 'CommandOrControl+1',
  entries: 'CommandOrControl+2',
  projects: 'CommandOrControl+3',
  tags: 'CommandOrControl+4',
  reports: 'CommandOrControl+5',
  settings: 'CommandOrControl+,',
  quickStart: 'CommandOrControl+K',
  stopTimer: 'CommandOrControl+Shift+Space',
  create: 'CommandOrControl+N',
  search: 'CommandOrControl+F',
  previousDay: 'Left',
  nextDay: 'Right',
  today: 'T'
} as const

export type AppShortcut = keyof typeof appShortcuts

export function matchesAccelerator(event: KeyEvent, accelerator: string): boolean {
  const parts = accelerator.split('+')
  const key = parts.pop()
  const wanted = { ctrl: false, meta: false, alt: false, shift: false }
  for (const part of parts) {
    if (part === 'CommandOrControl') wanted[isMac ? 'meta' : 'ctrl'] = true
    else if (part === 'Control') wanted.ctrl = true
    else if (part === 'Command' || part === 'Super') wanted.meta = true
    else if (part === 'Alt') wanted.alt = true
    else if (part === 'Shift') wanted.shift = true
  }
  return (
    keyFromCode(event.code) === key &&
    event.ctrlKey === wanted.ctrl &&
    event.metaKey === wanted.meta &&
    event.altKey === wanted.alt &&
    event.shiftKey === wanted.shift
  )
}
