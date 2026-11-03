import type { Hono } from 'hono'
import { z } from 'zod'
import { AppError } from '../../../shared/model/errors'
import { activityInput, activityListOptions, id, name } from '../../../shared/validation'
import { activities } from '../../core'
import { toActivity, type ActivityV1 } from '../dto/activities'
import { idParam, parse, readBody, toBoolean, toNumber } from '../parse'
import { registerArchiveRoutes } from './archive'
import { fieldValuesOf, registerFieldValueRoutes } from './customFields'

const renameInput = z.object({ name }).strict()
const tagsInput = z.object({ tagIds: z.array(id) }).strict()
const clientInput = z.object({ clientId: id.nullable() }).strict()
const moveInput = z.object({ projectId: id, name: name.optional() }).strict()
const mergeInput = z.object({ targetId: id }).strict()

/** The list carries the tag ids, so a single activity has the same shape as in the list. */
function present(activityId: number): ActivityV1 {
  const activity = activities
    .list({ includeArchived: true })
    .find((candidate) => candidate.id === activityId)
  if (!activity) throw new AppError('ACTIVITY_NOT_FOUND', String(activityId))
  return toActivity(activity, fieldValuesOf('activity')(activity.id))
}

export function registerActivityRoutes(v1: Hono): void {
  v1.get('/activities', (c) => {
    const projectId = c.req.query('projectId')
    const options = parse(activityListOptions, {
      projectId: projectId === undefined ? undefined : toNumber(projectId),
      includeArchived: toBoolean(c.req.query('includeArchived'))
    })
    const valuesOf = fieldValuesOf('activity')
    return c.json(
      activities.list(options).map((activity) => toActivity(activity, valuesOf(activity.id)))
    )
  })
  v1.get('/activities/:id', (c) => c.json(present(idParam(c))))
  v1.post('/activities', async (c) => {
    const activity = activities.create(parse(activityInput, await readBody(c)))
    return c.json(present(activity.id), 201)
  })
  v1.patch('/activities/:id', async (c) => {
    const activity = activities.rename(idParam(c), parse(renameInput, await readBody(c)).name)
    return c.json(present(activity.id))
  })
  v1.put('/activities/:id/tags', async (c) => {
    const activityId = idParam(c)
    activities.setTags(activityId, parse(tagsInput, await readBody(c)).tagIds)
    return c.json(present(activityId))
  })
  v1.put('/activities/:id/client', async (c) => {
    const activity = activities.setClient(
      idParam(c),
      parse(clientInput, await readBody(c)).clientId
    )
    return c.json(present(activity.id))
  })
  // Without a new name, the activity keeps its own in the target project.
  v1.post('/activities/:id/move', async (c) => {
    const activityId = idParam(c)
    const input = parse(moveInput, await readBody(c))
    const activity = activities.move(
      activityId,
      input.projectId,
      input.name ?? present(activityId).name
    )
    return c.json(present(activity.id))
  })
  // The target takes over the entries; the merged activity is gone afterwards.
  v1.post('/activities/:id/merge', async (c) => {
    const { targetId } = parse(mergeInput, await readBody(c))
    activities.merge(idParam(c), targetId)
    return c.json(present(targetId))
  })
  v1.delete('/activities/:id', (c) => {
    activities.delete(idParam(c))
    return c.body(null, 204)
  })
  registerArchiveRoutes(v1, '/activities', activities.setArchived, (activity) =>
    present(activity.id)
  )
  registerFieldValueRoutes(v1, '/activities', 'activity')
}
