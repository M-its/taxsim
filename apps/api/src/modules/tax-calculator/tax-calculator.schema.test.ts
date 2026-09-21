import { describe, expect, it } from 'vitest'
import { rfbCalculatorResponseSchema } from './tax-calculator.schema'

function validResponse() {
  return {
    objetos: [
      {
        nObj: 1,
        tribCalc: {
          IBSCBS: {
            gIBSCBS: {
              gIBSUF: { pIBSUF: '0.10' },
              gIBSMun: { pIBSMun: 0 },
              vIBS: '0.20',
              gCBS: { pCBS: 0.9, vCBS: '1.80' },
            },
          },
        },
        additiveUpstreamField: 'allowed',
      },
    ],
    total: {
      tribCalc: {
        IBSCBSTot: {
          gIBS: { vIBS: 0.2 },
          gCBS: { vCBS: '1.80' },
        },
      },
    },
    anotherAdditiveField: true,
  }
}

describe('rfbCalculatorResponseSchema', () => {
  it('accepts legacy decimal strings and current OpenAPI numbers', () => {
    const result = rfbCalculatorResponseSchema.parse(validResponse())

    expect(result.objetos[0].tribCalc.IBSCBS.gIBSCBS.gIBSMun.pIBSMun).toBe('0')
    expect(result.objetos[0].tribCalc.IBSCBS.gIBSCBS.gCBS.pCBS).toBe('0.9')
    expect(result.total.tribCalc.IBSCBSTot.gIBS.vIBS).toBe('0.2')
    expect(result.objetos[0]).not.toHaveProperty('additiveUpstreamField')
    expect(result).not.toHaveProperty('anotherAdditiveField')
  })

  it('rejects contract changes that remove a consumed field', () => {
    const response = validResponse()
    delete (response.objetos[0].tribCalc.IBSCBS.gIBSCBS.gCBS as { vCBS?: string }).vCBS

    const result = rfbCalculatorResponseSchema.safeParse(response)

    expect(result.success).toBe(false)
  })

  it.each(['1e3', '-0.01', 'NaN', Number.POSITIVE_INFINITY, Number.NaN])(
    'rejects an unsafe decimal representation: %s',
    (value) => {
      const response = validResponse()
      response.objetos[0].tribCalc.IBSCBS.gIBSCBS.vIBS = value as string

      const result = rfbCalculatorResponseSchema.safeParse(response)

      expect(result.success).toBe(false)
    },
  )
})
