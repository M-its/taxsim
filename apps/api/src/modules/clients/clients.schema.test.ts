import { describe, expect, it } from 'vitest'
import { createClientSchema, listClientsSchema } from './clients.schema.js'

describe('client document schemas', () => {
  it('normalizes masked CPF and lowercase alphanumeric CNPJ', () => {
    expect(
      createClientSchema.parse({
        name: 'Pessoa física',
        document: '529.982.247-25',
      }).document,
    ).toBe('52998224725')

    expect(
      createClientSchema.parse({
        name: 'Pessoa jurídica',
        document: '00.000.000/e08g-12',
      }).document,
    ).toBe('00000000E08G12')
  })

  it('keeps masked search input available for canonical document search', () => {
    expect(listClientsSchema.parse({ search: ' 00.000.000/e08g-12 ' }).search).toBe(
      '00.000.000/e08g-12',
    )
  })
})
