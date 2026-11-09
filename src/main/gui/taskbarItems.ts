import type { LaunchOptions } from '@/shared/model/launchOptions'
import type { Language } from '@/shared/model/settings'
import type { ActivityDetails, TimeEntryDetails } from '@/shared/model/timeEntries'

export const RECENT_IN_TASKBAR = 5

export interface TaskbarItem {
  readonly title: string
  readonly options: LaunchOptions
}

export interface TaskbarItems {
  readonly recentTitle: string
  readonly recent: readonly TaskbarItem[]
  readonly stop: TaskbarItem | null
}

const labels: Record<
  Language,
  { readonly recent: string; readonly stop: (name: string) => string }
> = {
  en: { recent: 'Recently used', stop: (name) => `Stop ${name}` },
  de: { recent: 'Zuletzt verwendet', stop: (name) => `${name} stoppen` }
}

function nameOf({ activity, project }: ActivityDetails): string {
  return `${activity.name} – ${project.name}`
}

/**
 * What the menu of the app's taskbar or dock icon offers: the running timer to stop and the
 * recently used activities to start. The running activity is not offered again, because starting
 * it would end its entry and begin a new one.
 */
export function taskbarItems(
  language: Language,
  running: TimeEntryDetails | null,
  recent: readonly ActivityDetails[]
): TaskbarItems {
  const text = labels[language]
  return {
    recentTitle: text.recent,
    recent: recent
      .filter(({ activity }) => activity.id !== running?.activity.id)
      .slice(0, RECENT_IN_TASKBAR)
      .map((details) => ({
        title: nameOf(details),
        options: { startActivity: details.activity.id }
      })),
    stop: running ? { title: text.stop(nameOf(running)), options: { stopTimer: true } } : null
  }
}
