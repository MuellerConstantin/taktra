import type { ProfileDatabase } from './database'
import { activities, activityTags, projects, tags, timeEntries } from './schema'

interface SampleProject {
  readonly name: string
  readonly description: string | null
  readonly color: string
  readonly archived?: boolean
  readonly activities: readonly (readonly [name: string, tags: readonly string[]])[]
}

interface SampleContent {
  readonly tags: readonly (readonly [name: string, color: string | null])[]
  readonly projects: readonly [SampleProject, SampleProject, SampleProject, SampleProject]
  readonly notes: readonly string[]
  readonly trainingNote: string
  readonly adminNote: string
}

export const SAMPLE_PROFILE_NAME = 'Sample'

const sample: SampleContent = {
  tags: [
    ['meeting', '#3b82f6'],
    ['development', '#22c55e'],
    ['support', '#ef4444'],
    ['review', '#eab308'],
    ['organization', null]
  ],
  projects: [
    {
      name: 'Customer Northwind',
      description: 'Maintenance and development of the customer portal',
      color: '#0ea5e9',
      activities: [
        ['Daily Standup', ['meeting']],
        ['Feature Development', ['development']],
        ['Bugfixing', ['development', 'support']],
        ['Code Review', ['review', 'development']]
      ]
    },
    {
      name: 'Webshop Relaunch',
      description: null,
      color: '#f97316',
      activities: [
        ['Concept', ['meeting', 'organization']],
        ['Frontend', ['development']],
        ['Customer Alignment', ['meeting']]
      ]
    },
    {
      name: 'Internal',
      description: 'Everything not assigned to a customer',
      color: '#a855f7',
      activities: [
        ['Team Meeting', ['meeting', 'organization']],
        ['Training', []],
        ['Administration', ['organization']]
      ]
    },
    {
      name: 'Legacy Migration',
      description: 'Completed',
      color: '#64748b',
      archived: true,
      activities: [['Data Migration', ['development']]]
    }
  ],
  notes: ['Follow-up', 'Pairing with Lea', 'Ticket #142', 'Ticket #317'],
  trainingNote: 'Read technical articles',
  adminNote: 'Timesheets, emails'
}

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
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const now = new Date()

  const tagIds = new Map(
    sample.tags.map(([name, color]) => [
      name,
      db.insert(tags).values({ name, color }).returning({ id: tags.id }).get().id
    ])
  )

  const activityIds = sample.projects.map((project) => {
    const projectId = db
      .insert(projects)
      .values({
        name: project.name,
        description: project.description,
        color: project.color,
        archivedAt: project.archived ? now : null
      })
      .returning({ id: projects.id })
      .get().id

    return project.activities.map(([name, tagNames]) => {
      const activityId = db
        .insert(activities)
        .values({ projectId, name })
        .returning({ id: activities.id })
        .get().id
      for (const tagName of tagNames) {
        db.insert(activityTags)
          .values({ activityId, tagId: tagIds.get(tagName)! })
          .run()
      }
      return activityId
    })
  })

  const [customer, webshop, internal, legacy] = activityIds
  const [standup, feature, bugfixing, codeReview] = customer
  const [concept, frontend, alignment] = webshop
  const [teamMeeting, training, administration] = internal
  const [migration] = legacy

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
        note: random() < 0.15 ? pick(sample.notes) : null
      })
      .run()
  }

  const duration = (day: Date, activityId: number, minutes: number, note: string): void => {
    db.insert(timeEntries)
      .values({ activityId, date: toIsoDate(day), durationSec: minutes * 60, note })
      .run()
  }

  for (let daysAgo = 56; daysAgo >= 1; daysAgo--) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo)
    const weekday = day.getDay()
    if (weekday === 0 || weekday === 6) continue

    const isLegacyPhase = daysAgo > 35
    let minute = 8 * 60 + 30 + Math.floor(random() * 4) * 15

    if (!isLegacyPhase) {
      clock(day, standup, 9 * 60, 15)
      minute = Math.max(minute, 9 * 60 + 15)
    }

    const blocks = isLegacyPhase
      ? [migration, migration, bugfixing]
      : [
          pick([feature, frontend]),
          pick([codeReview, bugfixing, concept]),
          pick([frontend, feature, administration])
        ]

    blocks.forEach((activityId, index) => {
      const minutes = 60 + Math.floor(random() * 9) * 15
      clock(day, activityId, minute, minutes)
      minute += minutes + (index === 0 ? 45 : 10)
    })

    if (weekday === 1) clock(day, teamMeeting, minute + 15, 60)
    if (weekday === 3 && !isLegacyPhase) clock(day, alignment, minute + 15, 45)
    if (weekday === 5) duration(day, training, 90, sample.trainingNote)
    if (random() < 0.15) duration(day, administration, 30, sample.adminNote)
  }
}
