import { toNameKey } from '../domain/names'
import type { ProfileDatabase } from './database'
import { activities, activityTags, clients, projects, tags, timeEntries } from './schema'

type SampleActivity = readonly [
  name: string,
  tags: readonly string[],
  weight: number,
  client?: string
]

interface SampleProject {
  readonly name: string
  readonly description: string | null
  readonly color: string
  readonly client?: string
  readonly archived?: boolean
  readonly activeMonthsAgo: readonly [from: number, to: number]
  readonly weight: number
  readonly activities: readonly SampleActivity[]
}

export const SAMPLE_PROFILE_NAME = 'Sample'

const HISTORY_DAYS = 730
const DAYS_PER_MONTH = 30.44

const sampleTags: readonly (readonly [name: string, color: string | null])[] = [
  ['meeting', '#3b82f6'],
  ['development', '#22c55e'],
  ['support', '#ef4444'],
  ['review', '#eab308'],
  ['organization', null],
  ['planning', '#8b5cf6'],
  ['design', '#ec4899'],
  ['frontend', '#06b6d4'],
  ['backend', '#0d9488'],
  ['mobile', '#84cc16'],
  ['data', '#6366f1'],
  ['ops', '#f97316'],
  ['documentation', null],
  ['security', '#dc2626']
]

const sampleClients: readonly (readonly [name: string, archived: boolean])[] = [
  ['Northwind Traders', false],
  ['Adventure Works', false],
  ['Contoso', false],
  ['Fabrikam', false],
  ['Tailspin Toys', false],
  ['Woodgrove Bank', false],
  ['Litware', true],
  ['Human Resources', false]
]

const sampleProjects: readonly SampleProject[] = [
  {
    name: 'Customer Portal',
    description: 'Maintenance and development of the customer portal',
    color: '#0ea5e9',
    client: 'Northwind Traders',
    activeMonthsAgo: [24, 0],
    weight: 3,
    activities: [
      ['Daily Standup', ['meeting'], 0],
      ['Feature Development', ['development'], 4],
      ['Bugfixing', ['development', 'support'], 2],
      ['Code Review', ['review', 'development'], 2],
      ['Sprint Planning', ['meeting', 'planning'], 1]
    ]
  },
  {
    name: 'Webshop Relaunch',
    description: null,
    color: '#f97316',
    client: 'Adventure Works',
    activeMonthsAgo: [9, 0],
    weight: 3,
    activities: [
      ['Concept', ['planning', 'design'], 1],
      ['UX Design', ['design'], 2],
      ['Frontend', ['development', 'frontend'], 4],
      ['Backend', ['development', 'backend'], 3],
      ['Client Alignment', ['meeting'], 1]
    ]
  },
  {
    name: 'Internal',
    description: 'Everything not assigned to a client',
    color: '#a855f7',
    activeMonthsAgo: [24, 0],
    weight: 0.5,
    activities: [
      ['Team Meeting', ['meeting', 'organization'], 0],
      ['Training', [], 0],
      ['Administration', ['organization'], 1],
      ['Recruiting', ['organization', 'meeting'], 1, 'Human Resources']
    ]
  },
  {
    name: 'Booking Platform',
    description: 'Standard product, customized per client',
    color: '#14b8a6',
    activeMonthsAgo: [12, 0],
    weight: 2,
    activities: [
      ['Core Development', ['development', 'backend'], 4],
      ['Release', ['ops'], 1],
      ['Customizing Northwind', ['development'], 2, 'Northwind Traders'],
      ['Consulting Contoso', ['meeting'], 1, 'Contoso'],
      ['Onboarding Tailspin', ['meeting', 'documentation'], 1, 'Tailspin Toys']
    ]
  },
  {
    name: 'Mobile App',
    description: 'iOS and Android app for field staff',
    color: '#22c55e',
    client: 'Contoso',
    activeMonthsAgo: [14, 0],
    weight: 2,
    activities: [
      ['iOS Development', ['development', 'mobile'], 3],
      ['Android Development', ['development', 'mobile'], 3],
      ['Release Management', ['ops'], 1],
      ['Design Review', ['design', 'review'], 1]
    ]
  },
  {
    name: 'Data Platform',
    description: 'Ingestion pipelines and reporting data model',
    color: '#6366f1',
    client: 'Fabrikam',
    activeMonthsAgo: [18, 3],
    weight: 2,
    activities: [
      ['Pipeline Development', ['development', 'backend', 'data'], 4],
      ['Data Modeling', ['data'], 2],
      ['Workshops', ['meeting'], 1],
      ['Monitoring', ['ops'], 1]
    ]
  },
  {
    name: 'Support Retainer',
    description: 'Monthly support contract',
    color: '#ef4444',
    client: 'Tailspin Toys',
    activeMonthsAgo: [24, 0],
    weight: 1,
    activities: [
      ['Ticket Handling', ['support'], 3],
      ['Hotfixes', ['development', 'support'], 1],
      ['Monthly Report', ['documentation'], 0]
    ]
  },
  {
    name: 'Open Source',
    description: null,
    color: '#84cc16',
    activeMonthsAgo: [24, 0],
    weight: 0.4,
    activities: [
      ['Maintenance', ['development'], 2],
      ['Documentation', ['documentation'], 1],
      ['Issue Triage', ['support', 'review'], 1]
    ]
  },
  {
    name: 'Security Audit',
    description: 'Penetration test follow-up and hardening',
    color: '#f59e0b',
    client: 'Woodgrove Bank',
    activeMonthsAgo: [4, 1],
    weight: 2,
    activities: [
      ['Assessment', ['security', 'review'], 2],
      ['Remediation', ['security', 'development'], 3],
      ['Reporting', ['security', 'documentation'], 1]
    ]
  },
  {
    name: 'Legacy Migration',
    description: 'Completed',
    color: '#64748b',
    archived: true,
    activeMonthsAgo: [24, 18],
    weight: 3,
    activities: [
      ['Data Migration', ['development', 'data'], 3],
      ['Cutover Planning', ['planning', 'ops'], 1]
    ]
  },
  {
    name: 'Intranet Redesign',
    description: 'Completed',
    color: '#ec4899',
    client: 'Litware',
    archived: true,
    activeMonthsAgo: [20, 12],
    weight: 2,
    activities: [
      ['Concept', ['planning', 'design'], 1],
      ['Implementation', ['development', 'frontend'], 3],
      ['Content Migration', ['data'], 1]
    ]
  }
]

const notes = ['Follow-up', 'Pairing with Lea', 'Ticket #142', 'Ticket #317', 'Call with client']

function createRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 2 ** 32
    return state / 2 ** 32
  }
}

function toIsoDate(day: Date): string {
  const pad = (value: number): string => String(value).padStart(2, '0')
  return `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`
}

export function seedSampleData(db: ProfileDatabase): void {
  const random = createRandom(42)
  const pick = <T>(items: readonly T[]): T => items[Math.floor(random() * items.length)]
  const weighted = <T>(items: readonly T[], weightOf: (item: T) => number): T => {
    let threshold = random() * items.reduce((sum, item) => sum + weightOf(item), 0)
    return items.find((item) => (threshold -= weightOf(item)) < 0) ?? items[items.length - 1]
  }
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const now = new Date()

  const tagIds = new Map(
    sampleTags.map(([name, color]) => [
      name,
      db
        .insert(tags)
        .values({ name, nameKey: toNameKey(name), color })
        .returning({ id: tags.id })
        .get().id
    ])
  )

  const clientIds = new Map(
    sampleClients.map(([name, archived]) => [
      name,
      db
        .insert(clients)
        .values({ name, nameKey: toNameKey(name), archivedAt: archived ? now : null })
        .returning({ id: clients.id })
        .get().id
    ])
  )
  const clientIdOf = (name?: string): number | null => (name ? clientIds.get(name)! : null)

  const activityIds = new Map<string, number>()
  for (const project of sampleProjects) {
    const projectId = db
      .insert(projects)
      .values({
        name: project.name,
        nameKey: toNameKey(project.name),
        description: project.description,
        color: project.color,
        clientId: clientIdOf(project.client),
        archivedAt: project.archived ? now : null
      })
      .returning({ id: projects.id })
      .get().id

    for (const [name, tagNames, , client] of project.activities) {
      const activityId = db
        .insert(activities)
        .values({ projectId, name, nameKey: toNameKey(name), clientId: clientIdOf(client) })
        .returning({ id: activities.id })
        .get().id
      for (const tagName of tagNames) {
        db.insert(activityTags)
          .values({ activityId, tagId: tagIds.get(tagName)! })
          .run()
      }
      activityIds.set(`${project.name}/${name}`, activityId)
    }
  }

  const idOf = (project: string, activity: string): number =>
    activityIds.get(`${project}/${activity}`)!

  const clock = (day: Date, activityId: number, startMinute: number, minutes: number): void => {
    const startedAt = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, startMinute)
    db.insert(timeEntries)
      .values({
        activityId,
        date: toIsoDate(day),
        startedAt,
        endedAt: new Date(startedAt.getTime() + minutes * 60_000),
        timezone,
        durationSec: minutes * 60,
        note: random() < 0.12 ? pick(notes) : null
      })
      .run()
  }

  const duration = (day: Date, activityId: number, minutes: number, note: string | null): void => {
    db.insert(timeEntries)
      .values({ activityId, date: toIsoDate(day), durationSec: minutes * 60, note })
      .run()
  }

  let isFirstWorkdayOfMonth = false
  for (let daysAgo = HISTORY_DAYS; daysAgo >= 1; daysAgo--) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo)
    if (day.getDate() === 1) isFirstWorkdayOfMonth = true
    const weekday = day.getDay()
    if (weekday === 0 || weekday === 6 || random() < 0.06) continue

    const monthsAgo = daysAgo / DAYS_PER_MONTH
    const active = sampleProjects.filter(
      ({ activeMonthsAgo: [from, to] }) => monthsAgo <= from && monthsAgo >= to
    )
    let minute = 8 * 60 + Math.floor(random() * 5) * 15
    let worked = 0

    if (active.some((project) => project.name === 'Customer Portal')) {
      clock(day, idOf('Customer Portal', 'Daily Standup'), 9 * 60, 15)
      minute = Math.max(minute, 9 * 60 + 15)
      worked += 15
    }
    if (weekday === 1) {
      clock(day, idOf('Internal', 'Team Meeting'), 16 * 60, 60)
      worked += 60
    }

    const target = 7 * 60 + Math.floor(random() * 7) * 15
    let hadLunch = false
    while (worked < target) {
      if (!hadLunch && minute >= 12 * 60) {
        minute += 45
        hadLunch = true
      }
      const dayEnd = weekday === 1 ? 16 * 60 : 24 * 60
      const project = weighted(active, ({ weight }) => weight)
      const [name] = weighted(project.activities, ([, , weight]) => weight)
      const minutes = Math.min(
        30 + Math.floor(random() * 11) * 15,
        target - worked,
        dayEnd - minute
      )
      if (minutes < 15) break
      if (random() < 0.1) duration(day, idOf(project.name, name), minutes, null)
      else clock(day, idOf(project.name, name), minute, minutes)
      minute += minutes + Math.floor(random() * 2) * 15
      worked += minutes
    }

    if (weekday === 5) duration(day, idOf('Internal', 'Training'), 90, 'Read technical articles')
    if (random() < 0.15) duration(day, idOf('Internal', 'Administration'), 30, 'Timesheets, emails')
    if (isFirstWorkdayOfMonth) {
      duration(day, idOf('Support Retainer', 'Monthly Report'), 60, null)
      isFirstWorkdayOfMonth = false
    }
  }
}
