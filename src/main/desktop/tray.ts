import { Menu, nativeImage, Tray } from 'electron'
import icon from '../../../resources/icon.png?asset'
import type { Language } from '../../shared/settings'
import { getSettings, onSettingsChanged } from '../settings'
import { showAbout } from './about'
import { toggleQuickStart } from './quickStart'
import { requestQuit } from './quit'

const ICON_SIZE = 16

const labels: Record<
  Language,
  {
    readonly quickStart: string
    readonly open: string
    readonly about: string
    readonly quit: string
  }
> = {
  en: { quickStart: 'Quick start', open: 'Open Taktra', about: 'About Taktra', quit: 'Quit' },
  de: { quickStart: 'Schnellstart', open: 'Taktra öffnen', about: 'Über Taktra', quit: 'Beenden' }
}

let tray: Tray | null = null

function buildMenu(openApp: () => void): Menu {
  const text = labels[getSettings().language]
  return Menu.buildFromTemplate([
    { label: text.quickStart, click: toggleQuickStart },
    { label: text.open, click: openApp },
    { label: text.about, click: showAbout },
    { type: 'separator' },
    { label: text.quit, click: () => void requestQuit(null) }
  ])
}

export function initTray(openApp: () => void): void {
  tray = new Tray(nativeImage.createFromPath(icon).resize({ width: ICON_SIZE, height: ICON_SIZE }))
  tray.setToolTip('Taktra')
  tray.setContextMenu(buildMenu(openApp))
  tray.on('click', toggleQuickStart)
  onSettingsChanged(() => tray?.setContextMenu(buildMenu(openApp)))
}
