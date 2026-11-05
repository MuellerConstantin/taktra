import { screen, type BrowserWindow, type Rectangle } from 'electron'
import { z } from 'zod'
import { events, lazyStore, settings, timer } from '@/main/core'
import { handle } from './ipc/handle'
import { createRendererWindow, showMainWindow } from './windows'

const WIDTH = 300
const HEIGHT = 64
const MARGIN = 16

interface Position {
  readonly x: number
  readonly y: number
}

const store = lazyStore<{ position: Position | null }>('mini-timer', {
  position: {
    type: ['object', 'null'],
    properties: { x: { type: 'integer' }, y: { type: 'integer' } },
    required: ['x', 'y'],
    default: null
  }
})

let mainWindow: BrowserWindow | null = null
let miniWindow: BrowserWindow | null = null
let isMiniReady = false
let isMainVisible = true

function contains(area: Rectangle, { x, y }: Position): boolean {
  return (
    x >= area.x &&
    y >= area.y &&
    x + WIDTH <= area.x + area.width &&
    y + HEIGHT <= area.y + area.height
  )
}

function initialPosition(): Position {
  const saved = store().get('position')
  if (
    saved &&
    contains(screen.getDisplayMatching({ ...saved, width: WIDTH, height: HEIGHT }).workArea, saved)
  )
    return saved

  const area = screen.getPrimaryDisplay().workArea
  return {
    x: area.x + area.width - WIDTH - MARGIN,
    y: area.y + area.height - HEIGHT - MARGIN
  }
}

function createMiniWindow(): BrowserWindow {
  const window = createRendererWindow(
    {
      ...initialPosition(),
      width: WIDTH,
      height: HEIGHT,
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
    'mini'
  )

  window.setAlwaysOnTop(true, 'floating')
  window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  window.once('ready-to-show', () => {
    isMiniReady = true
    updateMiniTimer()
  })
  window.on('moved', () => {
    const [x, y] = window.getPosition()
    store().set('position', { x, y })
  })
  window.on('closed', () => {
    miniWindow = null
    isMiniReady = false
  })

  return window
}

function updateMiniTimer(): void {
  if (!mainWindow || mainWindow.isDestroyed()) return

  const isMainHidden = mainWindow.isMinimized() || !isMainVisible
  const shouldShow = settings.get().miniTimer && isMainHidden && timer.isRunning()
  if (!shouldShow) {
    miniWindow?.hide()
    return
  }

  miniWindow ??= createMiniWindow()
  if (isMiniReady && !miniWindow.isVisible()) miniWindow.showInactive()
}

export function attachMiniTimer(window: BrowserWindow): void {
  mainWindow = window
  window.on('minimize', updateMiniTimer)
  window.on('restore', updateMiniTimer)
  window.on('show', updateMiniTimer)
  window.on('focus', updateMiniTimer)
  window.on('closed', () => {
    miniWindow?.destroy()
    mainWindow = null
  })
}

export function initMiniTimer(): void {
  events.on('signal:timer', updateMiniTimer)
  handle('app:showMainWindow', z.tuple([]), () => showMainWindow())
  handle('app:setMainVisible', z.tuple([z.boolean()]), (event, visible) => {
    if (event.sender !== mainWindow?.webContents) return
    isMainVisible = visible
    updateMiniTimer()
  })
}
