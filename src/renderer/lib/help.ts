import type { Language } from '@/shared/model/settings'
import activitiesDe from '@/renderer/help/de/activities.md?raw'
import activitiesEn from '@/renderer/help/en/activities.md?raw'
import basicsDe from '@/renderer/help/de/basics.md?raw'
import basicsEn from '@/renderer/help/en/basics.md?raw'
import clientsDe from '@/renderer/help/de/clients.md?raw'
import clientsEn from '@/renderer/help/en/clients.md?raw'
import exportDe from '@/renderer/help/de/export.md?raw'
import exportEn from '@/renderer/help/en/export.md?raw'
import customFieldsDe from '@/renderer/help/de/customFields.md?raw'
import customFieldsEn from '@/renderer/help/en/customFields.md?raw'
import profilesDe from '@/renderer/help/de/profiles.md?raw'
import profilesEn from '@/renderer/help/en/profiles.md?raw'
import projectsDe from '@/renderer/help/de/projects.md?raw'
import projectsEn from '@/renderer/help/en/projects.md?raw'
import reportsDe from '@/renderer/help/de/reports.md?raw'
import reportsEn from '@/renderer/help/en/reports.md?raw'
import tagsDe from '@/renderer/help/de/tags.md?raw'
import tagsEn from '@/renderer/help/en/tags.md?raw'
import trackingDe from '@/renderer/help/de/tracking.md?raw'
import trackingEn from '@/renderer/help/en/tracking.md?raw'

export const helpTopics = [
  'basics',
  'tracking',
  'projects',
  'activities',
  'tags',
  'clients',
  'reports',
  'export',
  'customFields',
  'profiles'
] as const

export type HelpTopic = (typeof helpTopics)[number]

export const helpTexts: Readonly<Record<Language, Readonly<Record<HelpTopic, string>>>> = {
  en: {
    basics: basicsEn,
    tracking: trackingEn,
    projects: projectsEn,
    activities: activitiesEn,
    tags: tagsEn,
    clients: clientsEn,
    reports: reportsEn,
    export: exportEn,
    customFields: customFieldsEn,
    profiles: profilesEn
  },
  de: {
    basics: basicsDe,
    tracking: trackingDe,
    projects: projectsDe,
    activities: activitiesDe,
    tags: tagsDe,
    clients: clientsDe,
    reports: reportsDe,
    export: exportDe,
    customFields: customFieldsDe,
    profiles: profilesDe
  }
}

export function isHelpTopic(value: string | undefined): value is HelpTopic {
  return helpTopics.some((topic) => topic === value)
}
