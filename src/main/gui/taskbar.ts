import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  app,
  Menu,
  nativeImage,
  type JumpListCategory,
  type JumpListItem,
  type MenuItemConstructorOptions,
  type NativeImage
} from 'electron'
import { isAppError } from '@/shared/model/errors'
import { events, settings, timer } from '@/main/core'
import { toLaunchArgs, type LaunchOptions } from '@/shared/model/launchOptions'
import { DOT_ICON_SIZE, colorDotPixels, icoFromPng } from './colorDot'
import {
  RECENT_IN_TASKBAR,
  taskbarItems,
  type TaskbarItem,
  type TaskbarItems
} from './taskbarItems'

/** Without an active profile there is no timer and nothing was used recently. */
function readItems(): TaskbarItems {
  const language = settings.get().language
  try {
    // One more than shown, as the running activity is left out of the list.
    return taskbarItems(language, timer.get(), timer.recentActivities(RECENT_IN_TASKBAR + 1))
  } catch (error) {
    if (isAppError(error, 'NO_ACTIVE_PROFILE')) return taskbarItems(language, null, [])
    throw error
  }
}

function colorDot(color: string, scaleFactor = 1): NativeImage {
  return nativeImage.createFromBitmap(colorDotPixels(color), {
    width: DOT_ICON_SIZE,
    height: DOT_ICON_SIZE,
    scaleFactor
  })
}

function dotIconFolder(): string {
  return join(app.getPath('userData'), 'jumplist-icons')
}

/**
 * Windows keeps jump list icons in its cache, so a file is named by its color: a project that gets
 * another color gets another file instead of an old dot from the cache.
 */
function dotIconPath(color: string): string {
  const path = join(dotIconFolder(), `${color.slice(1)}.ico`)
  if (!existsSync(path)) {
    mkdirSync(dotIconFolder(), { recursive: true })
    writeFileSync(path, icoFromPng(colorDot(color).toPNG()))
  }
  return path
}

function removeUnusedDotIcons(items: readonly TaskbarItem[]): void {
  if (!existsSync(dotIconFolder())) return
  const used = new Set(items.flatMap(({ color }) => (color ? [`${color.slice(1)}.ico`] : [])))
  for (const file of readdirSync(dotIconFolder()))
    if (!used.has(file)) rmSync(join(dotIconFolder(), file), { force: true })
}

function toTask({ title, options, color }: TaskbarItem): JumpListItem {
  // Unpackaged, Electron itself is the program: it needs the app's folder as first argument, and
  // its own icon would stand beside every entry.
  const appArg = process.defaultApp ? `"${app.getAppPath()}" ` : ''
  const appIcon = process.defaultApp
    ? join(app.getAppPath(), 'build', 'icon.ico')
    : process.execPath
  return {
    type: 'task',
    title,
    description: title,
    program: process.execPath,
    args: `${appArg}${toLaunchArgs(options).join(' ')}`,
    iconPath: color ? dotIconPath(color) : appIcon,
    iconIndex: 0
  }
}

// Windows refuses custom categories while recently opened items are turned off in its settings,
// and Electron logs an error for every refused attempt, so the app stops trying after the first.
let isCustomCategoryRefused = false

function updateJumpList({ recentTitle, recent, stop }: TaskbarItems): void {
  removeUnusedDotIcons(recent)
  if (recent.length === 0 && !stop) {
    app.setJumpList(null)
    return
  }
  if (!isCustomCategoryRefused && recent.length > 0) {
    const categories: JumpListCategory[] = [
      { type: 'custom', name: recentTitle, items: recent.map(toTask) },
      { type: 'tasks', items: stop ? [toTask(stop)] : [] }
    ]
    const result = app.setJumpList(categories)
    if (result !== 'customCategoryAccessDeniedError') return
    isCustomCategoryRefused = true
  }
  app.setJumpList([{ type: 'tasks', items: [...(stop ? [stop] : []), ...recent].map(toTask) }])
}

function updateDockMenu(
  { recent, stop }: TaskbarItems,
  apply: (options: LaunchOptions) => void
): void {
  const toItem = ({ title, options, color }: TaskbarItem): MenuItemConstructorOptions => ({
    label: title,
    // Twice the size at a scale factor of 2 keeps the dot sharp on Retina displays.
    ...(color ? { icon: colorDot(color, 2) } : {}),
    click: () => apply(options)
  })
  app.dock?.setMenu(
    Menu.buildFromTemplate([
      ...(stop ? [toItem(stop), { type: 'separator' as const }] : []),
      ...recent.map(toItem)
    ])
  )
}

/**
 * Offers the running timer and the recently used activities in the menu of the app icon. Windows
 * runs a jump list entry as a new start with launch options; the dock of macOS applies them
 * directly.
 */
export function initTaskbar(apply: (options: LaunchOptions) => void): void {
  const update =
    process.platform === 'win32'
      ? () => updateJumpList(readItems())
      : process.platform === 'darwin'
        ? () => updateDockMenu(readItems(), apply)
        : null
  if (!update) return
  update()
  for (const signal of [
    'signal:settings',
    'signal:timer',
    'signal:data',
    'signal:profiles'
  ] as const)
    events.on(signal, update)
}
