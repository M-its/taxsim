import { describe, expect, it } from 'vitest'
import {
  validateSimulationItems,
  type ValidatableSimulationItem,
} from './simulation-form-validation'

const validManual: ValidatableSimulationItem = {
  id: 'manual',
  mode: 'manual',
  ncmCode: '84713012',
  hasProduct: false,
  quantity: '1',
  unitPrice: '100.00',
}

describe('simulation NCM validation', () => {
  it('marks a catalog product without an active rule as blocking', () => {
    const errors = validateSimulationItems(
      [
        {
          id: 'catalog',
          mode: 'catalog',
          ncmCode: '85171300',
          hasProduct: true,
          quantity: '1',
          unitPrice: '10.00',
        },
      ],
      {
        catalog: {
          code: '85171300',
          description: 'Telefone celular',
          status: 'NO_ACTIVE_RULE',
        },
      },
    )

    expect(errors.catalog).toEqual([
      {
        field: 'product',
        message: 'NCM vigente, mas sem regra para este regime.',
      },
    ])
  })

  it('distinguishes manual format and catalog validity errors', () => {
    const errors = validateSimulationItems(
      [
        { ...validManual, id: 'format', ncmCode: '123' },
        { ...validManual, id: 'expired', ncmCode: '85171200' },
      ],
      {
        expired: {
          code: '85171200',
          description: 'Código expirado',
          status: 'NOT_CURRENT',
        },
      },
    )

    expect(errors.format[0].message).toBe('NCM deve conter exatamente 8 dígitos.')
    expect(errors.expired[0].message).toBe('NCM existe no catálogo, mas não está vigente.')
  })

  it('returns every invalid item in one pass and leaves unverifiable items unblocked', () => {
    const errors = validateSimulationItems(
      [
        { ...validManual, id: 'missing', ncmCode: '99999999' },
        { ...validManual, id: 'no-rule', ncmCode: '85171300' },
        { ...validManual, id: 'unverified', ncmCode: '84713012' },
      ],
      {
        missing: { code: '99999999', description: null, status: 'NOT_FOUND' },
        'no-rule': {
          code: '85171300',
          description: 'Telefone celular',
          status: 'NO_ACTIVE_RULE',
        },
        unverified: { code: '84713012', description: null, status: 'UNVERIFIED' },
      },
    )

    expect(Object.keys(errors)).toEqual(['missing', 'no-rule'])
    expect(errors.missing[0].message).toBe('NCM não encontrado no catálogo.')
    expect(errors['no-rule'][0].message).toBe('NCM vigente, mas sem regra para este regime.')
  })
})
