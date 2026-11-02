import { index, integer, primaryKey, sqliteTable } from 'drizzle-orm/sqlite-core'
import { activities } from './activities'
import { tags } from './tags'

export const activityTags = sqliteTable(
  'activity_tags',
  {
    activityId: integer()
      .notNull()
      .references(() => activities.id, { onDelete: 'cascade' }),
    tagId: integer()
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' })
  },
  (table) => [
    primaryKey({ columns: [table.activityId, table.tagId] }),
    index('activity_tags_tag_idx').on(table.tagId)
  ]
)
