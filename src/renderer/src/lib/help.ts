import type { Language } from '../../../shared/settings'
import activitiesDe from '../help/de/activities.md?raw'
import activitiesEn from '../help/en/activities.md?raw'
import basicsDe from '../help/de/basics.md?raw'
import basicsEn from '../help/en/basics.md?raw'
import clientsDe from '../help/de/clients.md?raw'
import clientsEn from '../help/en/clients.md?raw'
import profilesDe from '../help/de/profiles.md?raw'
import profilesEn from '../help/en/profiles.md?raw'
import projectsDe from '../help/de/projects.md?raw'
import projectsEn from '../help/en/projects.md?raw'
import reportsDe from '../help/de/reports.md?raw'
import reportsEn from '../help/en/reports.md?raw'
import trackingDe from '../help/de/tracking.md?raw'
import trackingEn from '../help/en/tracking.md?raw'

export const helpTopics = [
  'basics',
  'tracking',
  'projects',
  'activities',
  'clients',
  'reports',
  'profiles'
] as const

export type HelpTopic = (typeof helpTopics)[number]

export const helpTexts: Readonly<Record<Language, Readonly<Record<HelpTopic, string>>>> = {
  en: {
    basics: basicsEn,
    tracking: trackingEn,
    projects: projectsEn,
    activities: activitiesEn,
    clients: clientsEn,
    reports: reportsEn,
    profiles: profilesEn
  },
  de: {
    basics: basicsDe,
    tracking: trackingDe,
    projects: projectsDe,
    activities: activitiesDe,
    clients: clientsDe,
    reports: reportsDe,
    profiles: profilesDe
  }
}

export function isHelpTopic(value: string | undefined): value is HelpTopic {
  return helpTopics.some((topic) => topic === value)
}
