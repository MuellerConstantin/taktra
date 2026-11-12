import { createRoute, z, type OpenAPIHono } from '@hono/zod-openapi'
import { AppError } from '@/shared/model/errors'
import { activityInput } from '@/shared/validation'
import { activities } from '@/main/core'
import {
  ActivityClientInputV1,
  ActivityMergeInputV1,
  ActivityMoveInputV1,
  ActivityTagsInputV1,
  ActivityV1,
  toActivity
} from '@/main/api/v1/dto/activities'
import { NameInputV1 } from '@/main/api/v1/dto/common'
import { json, jsonBody, noContent } from '@/main/api/openapi'
import { errors } from '@/main/api/v1/errors'
import { booleanQuery, idParams, idQuery } from '@/main/api/v1/params'
import { registerArchiveRoutes } from './archive'
import { fieldValuesOf, registerFieldValueRoutes } from './customFields'

const tags = ['Activities']

/** The list carries the tag ids, so a single activity has the same shape as in the list. */
function present(activityId: number): ActivityV1 {
  const activity = activities
    .list({ includeArchived: true })
    .find((candidate) => candidate.id === activityId)
  if (!activity) throw new AppError('ACTIVITY_NOT_FOUND', String(activityId))
  return toActivity(activity, fieldValuesOf('activity')(activity.id))
}

const list = createRoute({
  method: 'get',
  path: '/activities',
  tags,
  summary: 'List activities',
  request: { query: z.object({ projectId: idQuery, includeArchived: booleanQuery }) },
  responses: { 200: json(z.array(ActivityV1), 'The activities, sorted by name'), ...errors(400) }
})

const get = createRoute({
  method: 'get',
  path: '/activities/{id}',
  tags,
  summary: 'Get an activity',
  request: { params: idParams },
  responses: { 200: json(ActivityV1, 'The activity'), ...errors(400, 404) }
})

const create = createRoute({
  method: 'post',
  path: '/activities',
  tags,
  summary: 'Create an activity',
  description: 'A client can only be set if the project has none.',
  request: { body: jsonBody(activityInput) },
  responses: { 201: json(ActivityV1, 'The new activity'), ...errors(400, 404, 409) }
})

const rename = createRoute({
  method: 'patch',
  path: '/activities/{id}',
  tags,
  summary: 'Rename an activity',
  request: { params: idParams, body: jsonBody(NameInputV1) },
  responses: { 200: json(ActivityV1, 'The renamed activity'), ...errors(400, 404, 409) }
})

const setTags = createRoute({
  method: 'put',
  path: '/activities/{id}/tags',
  tags,
  summary: 'Replace the tags of an activity',
  description: 'Applies to all its booked time, retroactively.',
  request: { params: idParams, body: jsonBody(ActivityTagsInputV1) },
  responses: { 200: json(ActivityV1, 'The activity'), ...errors(400, 404) }
})

const setClient = createRoute({
  method: 'put',
  path: '/activities/{id}/client',
  tags,
  summary: 'Set the client of an activity',
  description: 'Only possible if its project has none; applies to all its booked time.',
  request: {
    params: idParams,
    body: jsonBody(ActivityClientInputV1)
  },
  responses: { 200: json(ActivityV1, 'The activity'), ...errors(400, 404, 409) }
})

const move = createRoute({
  method: 'post',
  path: '/activities/{id}/move',
  tags,
  summary: 'Move an activity to another project',
  description:
    'Its entries go along. Without a new name, it keeps its own; it keeps the client of its former project unless the new one has its own.',
  request: {
    params: idParams,
    body: jsonBody(ActivityMoveInputV1)
  },
  responses: { 200: json(ActivityV1, 'The moved activity'), ...errors(400, 404, 409) }
})

const merge = createRoute({
  method: 'post',
  path: '/activities/{id}/merge',
  tags,
  summary: 'Merge an activity into another one',
  description: 'The target takes over its entries; the merged activity is gone afterwards.',
  request: { params: idParams, body: jsonBody(ActivityMergeInputV1) },
  responses: { 200: json(ActivityV1, 'The target activity'), ...errors(400, 404) }
})

const remove = createRoute({
  method: 'delete',
  path: '/activities/{id}',
  tags,
  summary: 'Delete an activity',
  description: 'Only possible without booked time; otherwise archive or merge it.',
  request: { params: idParams },
  responses: { 204: noContent, ...errors(400, 404, 409) }
})

export function registerActivityRoutes(v1: OpenAPIHono): void {
  v1.openapi(list, (c) => {
    const valuesOf = fieldValuesOf('activity')
    const found = activities.list(c.req.valid('query'))
    return c.json(
      found.map((activity) => toActivity(activity, valuesOf(activity.id))),
      200
    )
  })
  v1.openapi(get, (c) => c.json(present(c.req.valid('param').id), 200))
  v1.openapi(create, (c) => c.json(present(activities.create(c.req.valid('json')).id), 201))
  v1.openapi(rename, (c) => {
    const activity = activities.rename(c.req.valid('param').id, c.req.valid('json').name)
    return c.json(present(activity.id), 200)
  })
  v1.openapi(setTags, (c) => {
    const activityId = c.req.valid('param').id
    activities.setTags(activityId, c.req.valid('json').tagIds)
    return c.json(present(activityId), 200)
  })
  v1.openapi(setClient, (c) => {
    const activity = activities.setClient(c.req.valid('param').id, c.req.valid('json').clientId)
    return c.json(present(activity.id), 200)
  })
  v1.openapi(move, (c) => {
    const activityId = c.req.valid('param').id
    const input = c.req.valid('json')
    const activity = activities.move(
      activityId,
      input.projectId,
      input.name ?? present(activityId).name
    )
    return c.json(present(activity.id), 200)
  })
  v1.openapi(merge, (c) => {
    const { targetId } = c.req.valid('json')
    activities.merge(c.req.valid('param').id, targetId)
    return c.json(present(targetId), 200)
  })
  v1.openapi(remove, (c) => {
    activities.delete(c.req.valid('param').id)
    return c.body(null, 204)
  })
  registerArchiveRoutes(v1, {
    path: '/activities',
    tags,
    noun: 'activity',
    schema: ActivityV1,
    setArchived: activities.setArchived,
    present: (activity) => present(activity.id)
  })
  registerFieldValueRoutes(v1, { path: '/activities', tags, noun: 'activity', scope: 'activity' })
}
