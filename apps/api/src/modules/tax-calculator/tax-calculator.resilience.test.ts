import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { TaxCalculatorInput, TaxCalculatorLogger } from './tax-calculator.types'

const input: TaxCalculatorInput = {
  id: 'resilience-test',
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
      baseCalculo: 100,
      quantidade: 1,
    },
  ],
}

const originalItems = [{ ncmCode: '84713012', quantity: 1, unitPrice: '100.00' }]

function validResponse() {
  return {
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue({
      objetos: [
        {
          nObj: 1,
          tribCalc: {
            IBSCBS: {
              gIBSCBS: {
                gIBSUF: { pIBSUF: '0.10' },
                gIBSMun: { pIBSMun: '0.00' },
                vIBS: '0.10',
                gCBS: { pCBS: '0.90', vCBS: '0.90' },
              },
            },
          },
        },
      ],
      total: {
        tribCalc: {
          IBSCBSTot: {
            gIBS: { vIBS: '0.10' },
            gCBS: { vCBS: '0.90' },
          },
        },
      },
    }),
  }
}

function abortableFetch() {
  return vi.fn((_url: string, init?: RequestInit) => {
    return new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => {
        reject(new DOMException('The operation was aborted', 'AbortError'))
      })
    })
  })
}

beforeEach(() => {
  vi.stubEnv('TAX_CALCULATOR_TIMEOUT_MS', '25')
  vi.resetModules()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.useRealTimers()
})

describe('calculateReformModel resilience', () => {
  it('aborts a timed-out request and exposes a safe TIMEOUT reason', async () => {
    vi.useFakeTimers()
    const fetchMock = abortableFetch()
    vi.stubGlobal('fetch', fetchMock)
    const error = vi.fn()
    const logger: TaxCalculatorLogger = { error }
    const { calculateReformModel } = await import('./tax-calculator.client')

    const assertion = expect(
      calculateReformModel(input, originalItems, logger),
    ).rejects.toMatchObject({
      name: 'TaxCalculatorUnavailableError',
      reason: 'TIMEOUT',
    })

    await vi.advanceTimersByTimeAsync(25)
    await assertion
    expect(error).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'tax_calculator_timeout',
        timeoutMs: 25,
      }),
      'Tax calculator request timed out',
    )
  })

  it('recovers normally after a temporary network failure', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('temporary network failure'))
      .mockResolvedValueOnce(validResponse())
    vi.stubGlobal('fetch', fetchMock)
    const { calculateReformModel } = await import('./tax-calculator.client')

    await expect(calculateReformModel(input, originalItems)).rejects.toMatchObject({
      reason: 'NETWORK_ERROR',
    })
    await expect(calculateReformModel(input, originalItems)).resolves.toMatchObject({
      totals: { totalTax: '1.00' },
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('does not count calculator 4xx responses as circuit-breaker failures', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 422 })
    vi.stubGlobal('fetch', fetchMock)
    const { calculateReformModel } = await import('./tax-calculator.client')

    for (let attempt = 0; attempt < 6; attempt += 1) {
      await expect(calculateReformModel(input, originalItems)).rejects.toMatchObject({
        reason: 'HTTP_CLIENT_ERROR',
      })
    }

    expect(fetchMock).toHaveBeenCalledTimes(6)
  })

  it('counts timeouts as technical failures and opens the circuit', async () => {
    vi.useFakeTimers()
    const fetchMock = abortableFetch()
    vi.stubGlobal('fetch', fetchMock)
    const { calculateReformModel } = await import('./tax-calculator.client')

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const assertion = expect(calculateReformModel(input, originalItems)).rejects.toMatchObject({
        reason: 'TIMEOUT',
      })
      await vi.advanceTimersByTimeAsync(25)
      await assertion
    }

    await expect(calculateReformModel(input, originalItems)).rejects.toMatchObject({
      reason: 'CIRCUIT_OPEN',
    })
    expect(fetchMock).toHaveBeenCalledTimes(5)
  })

  it('distinguishes response contract failures from timeouts', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ objetos: [] }),
      }),
    )
    const { calculateReformModel } = await import('./tax-calculator.client')

    await expect(calculateReformModel(input, originalItems)).rejects.toMatchObject({
      reason: 'RESPONSE_SCHEMA_INVALID',
    })
  })
})
