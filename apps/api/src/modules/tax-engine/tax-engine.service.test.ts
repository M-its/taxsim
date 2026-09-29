import { describe, expect, it } from 'vitest'
import { calculateCurrentModel } from './tax-engine.service'
import type { TaxEngineInput } from './tax-engine.types'

const regimes = ['SIMPLES_NACIONAL', 'LUCRO_PRESUMIDO', 'LUCRO_REAL'] as const

function makeInput(overrides: Partial<TaxEngineInput> = {}): TaxEngineInput {
  return {
    taxRegime: 'LUCRO_REAL',
    items: [{ ncmCode: '84713012', quantity: 1, unitPrice: '100.00' }],
    taxRules: {
      '84713012': {
        pisRate: '0.0165',
        cofinsRate: '0.0760',
        icmsRate: '0.1800',
        issRate: '0.0000',
      },
    },
    ...overrides,
  }
}

describe('calculateCurrentModel', () => {
  it('uses HALF_EVEN at exact half-cent boundaries', () => {
    const result = calculateCurrentModel(
      makeInput({
        items: [
          { ncmCode: 'HALF-DOWN', quantity: 1, unitPrice: '1.00' },
          { ncmCode: 'HALF-UP', quantity: 1, unitPrice: '1.00' },
        ],
        taxRules: {
          'HALF-DOWN': {
            pisRate: '0.0050',
            cofinsRate: '0',
            icmsRate: '0',
            issRate: '0',
          },
          'HALF-UP': {
            pisRate: '0.0150',
            cofinsRate: '0',
            icmsRate: '0',
            issRate: '0',
          },
        },
      }),
    )

    expect(result.items[0].taxes.pis).toBe('0.00')
    expect(result.items[1].taxes.pis).toBe('0.02')
    expect(result.totals.pis).toBe('0.02')
  })

  it('rounds item values and the precise aggregate independently without cumulative drift', () => {
    const result = calculateCurrentModel(
      makeInput({
        items: Array.from({ length: 3 }, () => ({
          ncmCode: 'HALF-CENT',
          quantity: 1,
          unitPrice: '1.00',
        })),
        taxRules: {
          'HALF-CENT': {
            pisRate: '0.0050',
            cofinsRate: '0',
            icmsRate: '0',
            issRate: '0',
          },
        },
      }),
    )

    expect(result.items.map((item) => item.taxes.pis)).toEqual(['0.00', '0.00', '0.00'])
    expect(result.totals.pis).toBe('0.02')
    expect(result.totals.totalTax).toBe('0.02')
  })

  it('returns zero totals and effective rate for an empty calculation', () => {
    const result = calculateCurrentModel(makeInput({ items: [] }))

    expect(result.items).toEqual([])
    expect(result.totals).toEqual({
      pis: '0.00',
      cofins: '0.00',
      icms: '0.00',
      iss: '0.00',
      totalTax: '0.00',
      effectiveRate: '0.0000',
    })
  })

  it('keeps exact decimal arithmetic at the maximum accepted price and quantity', () => {
    const result = calculateCurrentModel(
      makeInput({
        items: [{ ncmCode: 'MAXIMUM', quantity: 10_000, unitPrice: '999999999.99' }],
        taxRules: {
          MAXIMUM: {
            pisRate: '0.0165',
            cofinsRate: '0.0760',
            icmsRate: '0.1800',
            issRate: '0.0500',
          },
        },
      }),
    )

    expect(result.items[0].totalPrice).toBe('9999999999900.00')
    expect(result.totals.totalTax).toBe('3224999999967.75')
    expect(result.totals.effectiveRate).toBe('0.3225')
  })

  it.each(regimes)('calculates the supported %s regime with its supplied rule', (taxRegime) => {
    const result = calculateCurrentModel(makeInput({ taxRegime }))

    expect(result.totals).toMatchObject({
      pis: '1.65',
      cofins: '7.60',
      icms: '18.00',
      iss: '0.00',
      totalTax: '27.25',
      effectiveRate: '0.2725',
    })
  })
})
