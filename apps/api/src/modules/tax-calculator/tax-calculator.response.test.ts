import { afterEach, describe, expect, it, vi } from 'vitest'
import { calculateReformModel } from './tax-calculator.client'
import type { TaxCalculatorInput, TaxCalculatorLogger } from './tax-calculator.types'

const input: TaxCalculatorInput = {
  id: 'safe-request-id',
  versao: '0.0.1',
  dhFatoGerador: '2026-01-01T09:50:05-03:00',
  municipio: 4314902,
  uf: 'RS',
  itens: [
    {
      numero: 1,
      ncm: '84713012',
      cst: '000',
      cClassTrib: '000001',
      baseCalculo: 200,
      quantidade: 1,
    },
  ],
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('calculateReformModel response validation', () => {
  it('rejects a malformed success response and logs only safe metadata', async () => {
    const sensitivePayload = {
      customerDocument: 'sensitive-tax-data',
      objetos: [],
    }
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(sensitivePayload),
      }),
    )
    const error = vi.fn()
    const logger: TaxCalculatorLogger = { error }

    await expect(
      calculateReformModel(
        input,
        [{ ncmCode: '84713012', quantity: 1, unitPrice: '200.00' }],
        logger,
      ),
    ).rejects.toMatchObject({
      name: 'TaxCalculatorUnavailableError',
      reason: 'RESPONSE_SCHEMA_INVALID',
    })

    expect(error).toHaveBeenCalledOnce()
    expect(error.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        event: 'tax_calculator_response_schema_invalid',
        expectedItemCount: 1,
      }),
    )
    expect(JSON.stringify(error.mock.calls)).not.toContain('sensitive-tax-data')
    expect(JSON.stringify(error.mock.calls)).not.toContain('customerDocument')
  })
})
