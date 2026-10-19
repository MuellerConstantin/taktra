import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { activateDatabase, closeActiveDatabase } from '../../../src/main/db/database'
import { createCustomField } from '../../../src/main/domain/customFields'
import {
  createExportTemplate,
  getExportTemplate,
  updateExportTemplate
} from '../../../src/main/domain/exportTemplates'
import { createTestProfile } from '../../profiles'

beforeEach(() => {
  activateDatabase(createTestProfile())
})

afterAll(() => closeActiveDatabase())

describe('aggregations', () => {
  it('keeps the aggregation of each column and leaves the others at their default', () => {
    const field = createCustomField({ scope: 'project', type: 'text', name: 'Order number' })
    const template = createExportTemplate({
      name: 'Monthly',
      format: 'csv',
      layout: 'summed',
      columns: [
        { builtin: 'project', header: null },
        { fieldId: field.id, header: null, aggregation: 'list_distinct' },
        { builtin: 'note', header: null, aggregation: null },
        { builtin: 'duration_h', header: null }
      ]
    })

    expect(getExportTemplate(template.id).columns.map((column) => column.aggregation)).toEqual([
      null,
      'list_distinct',
      null,
      null
    ])
  })

  it('keeps the aggregation when the layout changes to single entries', () => {
    const input = {
      name: 'Monthly',
      format: 'csv' as const,
      layout: 'summed' as const,
      columns: [
        { builtin: 'activity' as const, header: null, aggregation: 'list_distinct' as const },
        { builtin: 'duration_min' as const, header: null }
      ]
    }
    const template = createExportTemplate(input)

    const updated = updateExportTemplate(template.id, { ...input, layout: 'entries' })

    expect(updated.columns[0].aggregation).toBe('list_distinct')
  })

  it('rejects an aggregation the column does not allow', () => {
    expect(() =>
      createExportTemplate({
        name: 'Broken',
        format: 'csv',
        layout: 'summed',
        columns: [
          { builtin: 'project', header: null, aggregation: 'sum' },
          { builtin: 'duration_min', header: null }
        ]
      })
    ).toThrow(expect.objectContaining({ code: 'EXPORT_AGGREGATION_NOT_ALLOWED' }))
  })
})
