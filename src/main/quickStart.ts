import { screen, type BrowserWindow } from 'electron'
import { AppError } from '../shared/errors'
import { handle } from './ipc'
import { createRendererWindow } from './windows'

const WIDTH = 560
const MIN_HEIGHT = 64
const MAX_HEIGHT = 520
const TOP_RATIO = 0.25
const REOPEN_GUARD_MS = 300

let quickWindow: BrowserWindow | null = null
let hiddenAt = 0

function createQuickWindow(): BrowserWindow {
  const window = createRendererWindow(
    {
      width: WIDTH,
      height: MIN_HEIGHT,
      frame: false,
      transparent: true,
      hasShadow: false,
      resizable: false,
      maximizable: false,
      minimizable: false,
      fullscreenable: false,
      skipTaskbar: true,
      alwaysOnTop: true,
      show: false
    },
    'quick'
  )

  window.setAlwaysOnTop(true, 'floating')
  window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  window.on('blur', hideQuickStart)
  window.on('closed', () => {
    quickWindow = null
  })

  return window
}

function center(window: BrowserWindow): void {
  const area = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea
  window.setPosition(
    Math.round(area.x + (area.width - WIDTH) / 2),
    Math.round(area.y + area.height * TOP_RATIO)
  )
}

export function hideQuickStart(): void {
  if (!quickWindow?.isVisible()) return
  quickWindow.hide()
  hiddenAt = Date.now()
}

export function toggleQuickStart(): void {
  if (quickWindow?.isVisible()) {
    hideQuickStart()
    return
  }
  if (Date.now() - hiddenAt < REOPEN_GUARD_MS) return

  quickWindow ??= createQuickWindow()
  center(quickWindow)
  quickWindow.webContents.send('quick:shown')
  quickWindow.show()
  quickWindow.focus()
}

export function initQuickStart(): void {
  quickWindow = createQuickWindow()

  handle('quick:hide', () => hideQuickStart())
  handle('quick:toggle', () => toggleQuickStart())
  handle('quick:resize', (event, height: number) => {
    if (!Number.isFinite(height)) throw new AppError('VALIDATION_FAILED', 'Invalid height')
    if (!quickWindow || event.sender !== quickWindow.webContents) return
    quickWindow.setSize(WIDTH, Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, Math.ceil(height))))
  })
}
