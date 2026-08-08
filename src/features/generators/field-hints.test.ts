import { describe, expect, it } from 'vitest'
import type { InputFieldDefinition } from '../../modules/contracts'
import { resolveFieldHint } from './field-hints'

describe('resolveFieldHint', () => {
  const field: InputFieldDefinition = {
    id: 'value',
    type: 'multiline-text',
    label: 'Input data',
    placeholder: 'Default placeholder',
    helpText: 'Default help text',
    hintByFieldValue: {
      fieldId: 'mode',
      values: {
        encode: {
          placeholder: 'Encode placeholder',
          helpText: 'Encode help text',
        },
        decode: {
          placeholder: 'Decode placeholder',
          helpText: 'Decode help text',
        },
      },
    },
  }

  it('mengambil hint berdasarkan nilai dropdown', () => {
    expect(resolveFieldHint(field, { mode: 'decode' })).toEqual({
      placeholder: 'Decode placeholder',
      helpText: 'Decode help text',
    })
  })

  it('menggunakan hint default jika nilai dropdown belum memiliki variant', () => {
    expect(resolveFieldHint(field, { mode: 'unknown' })).toEqual({
      placeholder: 'Default placeholder',
      helpText: 'Default help text',
    })
  })
})
