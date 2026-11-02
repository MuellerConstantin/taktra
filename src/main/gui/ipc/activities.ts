import { z } from 'zod'
import { activityInput, activityListOptions, id, name } from '../../../shared/validation'
import {
  createActivity,
  deleteActivity,
  getActivityDetails,
  listActivities,
  mergeActivity,
  moveActivity,
  renameActivity,
  setActivityArchived,
  setActivityClient,
  setActivityTags
} from '../../core/domain/activities'
import { handle } from './handle'

export function initActivities(): void {
  handle('activities:list', z.tuple([activityListOptions]), (_, options) => listActivities(options))
  handle('activities:get', z.tuple([id]), (_, activityId) => getActivityDetails(activityId))
  handle('activities:create', z.tuple([activityInput]), (_, input) => createActivity(input))
  handle('activities:rename', z.tuple([id, name]), (_, activityId, newName) =>
    renameActivity(activityId, newName)
  )
  handle('activities:move', z.tuple([id, id, name]), (_, activityId, projectId, newName) =>
    moveActivity(activityId, projectId, newName)
  )
  handle('activities:setArchived', z.tuple([id, z.boolean()]), (_, activityId, archived) =>
    setActivityArchived(activityId, archived)
  )
  handle('activities:setClient', z.tuple([id, id.nullable()]), (_, activityId, clientId) =>
    setActivityClient(activityId, clientId)
  )
  handle('activities:setTags', z.tuple([id, z.array(id)]), (_, activityId, tagIds) =>
    setActivityTags(activityId, tagIds)
  )
  handle('activities:merge', z.tuple([id, id]), (_, activityId, targetId) =>
    mergeActivity(activityId, targetId)
  )
  handle('activities:delete', z.tuple([id]), (_, activityId) => deleteActivity(activityId))
}
