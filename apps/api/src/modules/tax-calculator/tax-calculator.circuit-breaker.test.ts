import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { TaxCalculatorInput } from './tax-calculator.types'

const input: TaxCalculatorInput = {
  id: 'circuit-breaker-test',
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

function unavailableResponse() {
  return { ok: false, status: 503 }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-01-01T12:00:00Z'))
  vi.resetModules()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('tax calculator circuit breaker failure window', () => {
  it('opens after five failures without a 60-second gap', async () => {
    const fetchMock = vi.fn().mockResolvedValue(unavailableResponse())
    vi.stubGlobal('fetch', fetchMock)
    const { calculateReformModel } = await import('./tax-calculator.client')

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await expect(calculateReformModel(input, originalItems)).rejects.toMatchObject({
        name: 'TaxCalculatorUnavailableError',
      })
      vi.advanceTimersByTime(1_000)
    }

    await expect(calculateReformModel(input, originalItems)).rejects.toMatchObject({
      name: 'TaxCalculatorUnavailableError',
    })
    expect(fetchMock).toHaveBeenCalledTimes(5)
  })

  it('discards failures when the previous one is outside the 60-second window', async () => {
    const fetchMock = vi.fn().mockResolvedValue(unavailableResponse())
    vi.stubGlobal('fetch', fetchMock)
    const { calculateReformModel } = await import('./tax-calculator.client')

    for (let attempt = 0; attempt < 4; attempt += 1) {
      await expect(calculateReformModel(input, originalItems)).rejects.toMatchObject({
        name: 'TaxCalculatorUnavailableError',
      })
      vi.advanceTimersByTime(1_000)
    }

    vi.advanceTimersByTime(60_001)

    for (let attempt = 0; attempt < 4; attempt += 1) {
      await expect(calculateReformModel(input, originalItems)).rejects.toMatchObject({
        name: 'TaxCalculatorUnavailableError',
      })
      vi.advanceTimersByTime(1_000)
    }

    expect(fetchMock).toHaveBeenCalledTimes(8)

    await expect(calculateReformModel(input, originalItems)).rejects.toMatchObject({
      name: 'TaxCalculatorUnavailableError',
    })
    expect(fetchMock).toHaveBeenCalledTimes(9)

    await expect(calculateReformModel(input, originalItems)).rejects.toMatchObject({
      name: 'TaxCalculatorUnavailableError',
    })
    expect(fetchMock).toHaveBeenCalledTimes(9)
  })

  it('reopens immediately when the half-open probe fails', async () => {
    const fetchMock = vi.fn().mockResolvedValue(unavailableResponse())
    vi.stubGlobal('fetch', fetchMock)
    const { calculateReformModel } = await import('./tax-calculator.client')

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await expect(calculateReformModel(input, originalItems)).rejects.toMatchObject({
        name: 'TaxCalculatorUnavailableError',
      })
    }

    vi.advanceTimersByTime(30_001)

    await expect(calculateReformModel(input, originalItems)).rejects.toMatchObject({
      name: 'TaxCalculatorUnavailableError',
    })
    expect(fetchMock).toHaveBeenCalledTimes(6)

    await expect(calculateReformModel(input, originalItems)).rejects.toMatchObject({
      name: 'TaxCalculatorUnavailableError',
    })
    expect(fetchMock).toHaveBeenCalledTimes(6)
  })
})
