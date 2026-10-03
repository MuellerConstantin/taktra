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
