import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { activateDatabase, closeActiveDatabase } from '@/main/core/db/database'
import { createActivity, mergeActivity, setActivityArchived } from '@/main/core/domain/activities'
import {
  createCustomField,
  createCustomFieldOption,
  setCustomFieldArchived,
  setCustomFieldOptionArchived,
  setFieldValues
} from '@/main/core/domain/customFields'
import { createProject, setProjectArchived } from '@/main/core/domain/projects'
import { createTimeEntry } from '@/main/core/domain/timeEntries'
import { startTimer } from '@/main/core/domain/timer'
import { createTestProfile } from '../../../profiles'

let projectId: number
let activityId: number

function invalidAt(...path: (string | number)[]): unknown {
  return expect.objectContaining({
    code: 'VALIDATION_FAILED',
    issues: [{ path, message: expect.any(String) }]
  })
}

function failsWith(code: string): unknown {
  return expect.objectContaining({ code })
}

beforeEach(() => {
  activateDatabase(createTestProfile())
  projectId = createProject({ name: 'Alpha' }).id
  activityId = createActivity({ projectId, name: 'Build' }).id
})

afterAll(() => closeActiveDatabase())

describe('wrong input', () => {
  it('refuses an end before the start', () => {
    expect(() =>
      createTimeEntry({
        activityId,
        date: '2026-03-02',
        note: null,
        startedAt: new Date('2026-03-02T09:00:00Z'),
        endedAt: new Date('2026-03-02T08:00:00Z'),
        timezone: 'Europe/Berlin'
      })
    ).toThrow(invalidAt('endedAt'))
  })

  it('refuses to merge an activity into itself', () => {
    expect(() => mergeActivity(activityId, activityId)).toThrow(invalidAt('targetId'))
  })

  it('refuses options for a text field', () => {
    const text = createCustomField({ scope: 'project', type: 'text', name: 'Order' }).id
    expect(() => createCustomFieldOption(text, 'Flat')).toThrow(invalidAt('fieldId'))
  })

  it('names the value of a field that does not fit it', () => {
    const text = createCustomField({ scope: 'project', type: 'text', name: 'Order' }).id
    const select = createCustomField({ scope: 'project', type: 'select', name: 'Billing' }).id
    const other = createCustomField({ scope: 'project', type: 'select', name: 'Rate' }).id
    const option = createCustomFieldOption(select, 'Flat').id
    const otherOption = createCustomFieldOption(other, 'Hourly').id
    const forActivities = createCustomField({ scope: 'activity', type: 'text', name: 'Ticket' }).id
    const set = (fieldId: number, textValue: string | null, optionId: number | null): unknown =>
      setFieldValues('project', projectId, [
        { fieldId: text, textValue: 'A-1', optionId: null },
        { fieldId, textValue, optionId }
      ])

    expect(() => set(forActivities, 'T-1', null)).toThrow(invalidAt(1, 'fieldId'))
    expect(() => set(text, null, option)).toThrow(invalidAt(1, 'optionId'))
    expect(() => set(select, 'Flat', null)).toThrow(invalidAt(1, 'textValue'))
    expect(() => set(select, null, otherOption)).toThrow(invalidAt(1, 'optionId'))
  })
})

describe('input the current data does not allow', () => {
  it('starts no timer on an archived activity or in an archived project', () => {
    setActivityArchived(activityId, true)
    expect(() => startTimer(activityId)).toThrow(failsWith('ACTIVITY_ARCHIVED'))

    setActivityArchived(activityId, false)
    setProjectArchived(projectId, true)
    expect(() => startTimer(activityId)).toThrow(failsWith('ACTIVITY_ARCHIVED'))
  })

  it('sets no value of an archived field or option', () => {
    const field = createCustomField({ scope: 'project', type: 'select', name: 'Billing' }).id
    const option = createCustomFieldOption(field, 'Flat').id
    setCustomFieldOptionArchived(option, true)
    expect(() =>
      setFieldValues('project', projectId, [{ fieldId: field, textValue: null, optionId: option }])
    ).toThrow(failsWith('CUSTOM_FIELD_OPTION_ARCHIVED'))

    setCustomFieldArchived(field, true)
    expect(() =>
      setFieldValues('project', projectId, [{ fieldId: field, textValue: null, optionId: option }])
    ).toThrow(failsWith('CUSTOM_FIELD_ARCHIVED'))
  })
})
