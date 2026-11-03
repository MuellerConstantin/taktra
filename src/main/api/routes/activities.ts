import type { Hono } from 'hono'
import { AppError } from '../../../shared/model/errors'
import { activityListOptions } from '../../../shared/validation'
import { activities } from '../../core'
import { toActivity } from '../dto/activities'
import { idParam, parse, toBoolean, toNumber } from '../parse'
import { fieldValuesOf } from './customFields'

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
  // The list carries the tag ids, so a single activity has the same shape as in the list.
  v1.get('/activities/:id', (c) => {
    const activityId = idParam(c)
    const activity = activities
      .list({ includeArchived: true })
      .find((candidate) => candidate.id === activityId)
    if (!activity) throw new AppError('ACTIVITY_NOT_FOUND', String(activityId))
    return c.json(toActivity(activity, fieldValuesOf('activity')(activity.id)))
  })
}
