import { z } from 'zod'
import { activityInput, activityListOptions, id, name } from '../../../shared/validation'
import { activities } from '../../core'
import { handle } from './handle'

export function registerActivitiesHandlers(): void {
  handle('activities:list', z.tuple([activityListOptions]), (_, options) =>
    activities.list(options)
  )
  handle('activities:get', z.tuple([id]), (_, activityId) => activities.get(activityId))
  handle('activities:create', z.tuple([activityInput]), (_, input) => activities.create(input))
  handle('activities:rename', z.tuple([id, name]), (_, activityId, newName) =>
    activities.rename(activityId, newName)
  )
  handle('activities:move', z.tuple([id, id, name]), (_, activityId, projectId, newName) =>
    activities.move(activityId, projectId, newName)
  )
  handle('activities:setArchived', z.tuple([id, z.boolean()]), (_, activityId, archived) =>
    activities.setArchived(activityId, archived)
  )
  handle('activities:setClient', z.tuple([id, id.nullable()]), (_, activityId, clientId) =>
    activities.setClient(activityId, clientId)
  )
  handle('activities:setTags', z.tuple([id, z.array(id)]), (_, activityId, tagIds) =>
    activities.setTags(activityId, tagIds)
  )
  handle('activities:merge', z.tuple([id, id]), (_, activityId, targetId) =>
    activities.merge(activityId, targetId)
  )
  handle('activities:delete', z.tuple([id]), (_, activityId) => activities.delete(activityId))
}
