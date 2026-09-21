import { describe, expect, it } from 'vitest'
import {
  calculateTotalRoundingTolerance,
  mapRfbResponseToReformResult,
} from './tax-calculator.mapper'
import { rfbCalculatorResponseSchema } from './tax-calculator.schema'
import type { TaxCalculatorInput } from './tax-calculator.types'
import { TaxCalculatorResponseValidationError } from './tax-calculator.types'

function makeInput(numbers: number[]): TaxCalculatorInput {
  return {
    id: 'test',
    versao: '0.0.1',
    dhFatoGerador: '2026-01-01T09:50:05-03:00',
    municipio: 4314902,
    uf: 'RS',
    itens: numbers.map((numero) => ({
      numero,
      ncm: '84713012',
      cst: '000',
      cClassTrib: '000001',
      baseCalculo: 5,
      quantidade: 1,
    })),
  }
}

function makeResponse(
  numbers: number[],
  itemIbs: string[],
  itemCbs: string[],
  totalIbs: string,
  totalCbs: string,
) {
  return rfbCalculatorResponseSchema.parse({
    objetos: numbers.map((nObj, index) => ({
      nObj,
      tribCalc: {
        IBSCBS: {
          gIBSCBS: {
            gIBSUF: { pIBSUF: '0.10' },
            gIBSMun: { pIBSMun: '0.00' },
            vIBS: itemIbs[index],
            gCBS: { pCBS: '0.90', vCBS: itemCbs[index] },
          },
        },
      },
    })),
    total: {
      tribCalc: {
        IBSCBSTot: {
          gIBS: { vIBS: totalIbs },
          gCBS: { vCBS: totalCbs },
        },
      },
    },
  })
}

function makeOriginalItems(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    ncmCode: String(84713012 + index),
    quantity: 1,
    unitPrice: '5.00',
  }))
}

describe('RFB response item identity', () => {
  it('correlates numero to nObj instead of trusting response order', () => {
    const input = makeInput([7, 42])
    const response = makeResponse([42, 7], ['0.20', '0.10'], ['1.80', '0.90'], '0.30', '2.70')

    const result = mapRfbResponseToReformResult(response, input, makeOriginalItems(2))

    expect(result.items[0].ncmCode).toBe('84713012')
    expect(result.items[0].taxes.ibs).toBe('0.10')
    expect(result.items[1].ncmCode).toBe('84713013')
    expect(result.items[1].taxes.ibs).toBe('0.20')
  })

  it('rejects duplicate nObj values', () => {
    const input = makeInput([7, 42])
    const response = makeResponse([7, 7], ['0.10', '0.20'], ['0.90', '1.80'], '0.30', '2.70')

    expect(() => mapRfbResponseToReformResult(response, input, makeOriginalItems(2))).toThrow(
      TaxCalculatorResponseValidationError,
    )
  })
})

describe('RFB official total reconciliation', () => {
  /**
   * The live RFB engine uses HALF_EVEN and rounds items independently from the
   * aggregate total. Empirical calls produced: three items -> R$0.01 in a
   * regular case, three half-cent items -> R$0.02, and four items -> R$0.02.
   * Therefore the safe bound per IBS/CBS component is zero for one item and
   * ceil(n / 2) cents otherwise; it deliberately has no percentage component.
   */
  it.each([
    [1, '0.00'],
    [2, '0.01'],
    [3, '0.02'],
    [4, '0.02'],
    [5, '0.03'],
    [100, '0.50'],
  ])('derives the rounding tolerance for %i items', (itemCount, expected) => {
    expect(calculateTotalRoundingTolerance(itemCount).toFixed(2)).toBe(expected)
  })

  it('accepts the observed three-item HALF_EVEN boundary and uses official totals', () => {
    const input = makeInput([1, 2, 3])
    const response = makeResponse(
      [1, 2, 3],
      ['0.00', '0.00', '0.00'],
      ['0.04', '0.04', '0.04'],
      '0.02',
      '0.14',
    )

    const result = mapRfbResponseToReformResult(response, input, makeOriginalItems(3))

    expect(result.totals.ibs).toBe('0.02')
    expect(result.totals.cbs).toBe('0.14')
    expect(result.totals.totalTax).toBe('0.16')
  })

  it('accepts the observed four-item R$0.02 difference', () => {
    const input = makeInput([1, 2, 3, 4])
    const response = makeResponse(
      [1, 2, 3, 4],
      ['0.00', '0.00', '0.00', '0.00'],
      ['0.00', '0.00', '0.00', '0.00'],
      '0.02',
      '0.02',
    )

    expect(() => mapRfbResponseToReformResult(response, input, makeOriginalItems(4))).not.toThrow()
  })

  it('rejects a component total beyond the item-count tolerance', () => {
    const input = makeInput([1, 2, 3])
    const response = makeResponse(
      [1, 2, 3],
      ['0.00', '0.00', '0.00'],
      ['0.00', '0.00', '0.00'],
      '0.03',
      '0.00',
    )

    expect(() => mapRfbResponseToReformResult(response, input, makeOriginalItems(3))).toThrow(
      TaxCalculatorResponseValidationError,
    )
  })

  it('requires an exact total for one item', () => {
    const input = makeInput([1])
    const response = makeResponse([1], ['0.00'], ['0.00'], '0.01', '0.00')

    expect(() => mapRfbResponseToReformResult(response, input, makeOriginalItems(1))).toThrow(
      TaxCalculatorResponseValidationError,
    )
  })
})
