import { app, Menu, nativeImage, Tray } from 'electron'
import icon from '../../../resources/icon.png?asset'
import type { Language } from '../../shared/settings'
import { getSettings, onSettingsChanged } from '../settings'
import { toggleQuickStart } from './quickStart'

const ICON_SIZE = 16

const labels: Record<
  Language,
  { readonly quickStart: string; readonly open: string; readonly quit: string }
> = {
  en: { quickStart: 'Quick start', open: 'Open Taktra', quit: 'Quit' },
  de: { quickStart: 'Schnellstart', open: 'Taktra öffnen', quit: 'Beenden' }
}

let tray: Tray | null = null

function buildMenu(openApp: () => void): Menu {
  const text = labels[getSettings().language]
  return Menu.buildFromTemplate([
    { label: text.quickStart, click: toggleQuickStart },
    { label: text.open, click: openApp },
    { type: 'separator' },
    { label: text.quit, click: () => app.quit() }
  ])
}

export function initTray(openApp: () => void): void {
  tray = new Tray(nativeImage.createFromPath(icon).resize({ width: ICON_SIZE, height: ICON_SIZE }))
  tray.setToolTip('Taktra')
  tray.setContextMenu(buildMenu(openApp))
  tray.on('click', toggleQuickStart)
  onSettingsChanged(() => tray?.setContextMenu(buildMenu(openApp)))
}
