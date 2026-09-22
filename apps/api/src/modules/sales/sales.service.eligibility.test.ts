import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  taxRuleFindMany: vi.fn(),
  ncmCatalogFindMany: vi.fn(),
  calculateCurrentModel: vi.fn(),
  buildOperacaoInput: vi.fn(),
  calculateReformModel: vi.fn(),
}))

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    taxRule: { findMany: mocks.taxRuleFindMany },
    ncmCatalog: { findMany: mocks.ncmCatalogFindMany },
  },
}))

vi.mock('../tax-engine/tax-engine.service.js', () => ({
  calculateCurrentModel: mocks.calculateCurrentModel,
}))

vi.mock('../tax-calculator/tax-calculator.client.js', () => ({
  buildOperacaoInput: mocks.buildOperacaoInput,
  calculateReformModel: mocks.calculateReformModel,
}))

import { simulateTax } from './sales.service.js'

describe('simulateTax - pre-calculator NCM eligibility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns every invalid item before running either tax engine', async () => {
    mocks.taxRuleFindMany.mockResolvedValue([
      {
        ncmCode: '84713012',
        status: 'ACTIVE',
        cst: '000',
        cClassTrib: '000001',
      },
      {
        ncmCode: '85171200',
        status: 'ACTIVE',
        cst: '000',
        cClassTrib: '000001',
      },
    ])
    mocks.ncmCatalogFindMany.mockResolvedValue([{ code: '84713012' }])

    const promise = simulateTax({
      taxRegime: 'LUCRO_REAL',
      items: [
        { ncmCode: '84713012', quantity: 1, unitPrice: '100.00' },
        { ncmCode: '85171200', quantity: 1, unitPrice: '100.00' },
        { ncmCode: '99999999', quantity: 1, unitPrice: '100.00' },
      ],
    })

    await expect(promise).rejects.toMatchObject({
      code: 'NCM_NOT_ELIGIBLE',
      details: {
        issues: [
          expect.objectContaining({ itemIndex: 1, ncmCode: '85171200' }),
          expect.objectContaining({ itemIndex: 2, ncmCode: '99999999' }),
        ],
      },
    })

    expect(mocks.taxRuleFindMany).toHaveBeenCalledWith({
      where: expect.objectContaining({ status: 'ACTIVE' }),
    })
    expect(mocks.calculateCurrentModel).not.toHaveBeenCalled()
    expect(mocks.buildOperacaoInput).not.toHaveBeenCalled()
    expect(mocks.calculateReformModel).not.toHaveBeenCalled()
  })

  it('defensively rejects an ARCHIVED rule before calculation', async () => {
    mocks.taxRuleFindMany.mockResolvedValue([
      {
        ncmCode: '85171300',
        status: 'ARCHIVED',
        cst: '000',
        cClassTrib: '000001',
      },
    ])
    mocks.ncmCatalogFindMany.mockResolvedValue([{ code: '85171300' }])

    await expect(
      simulateTax({
        taxRegime: 'LUCRO_REAL',
        items: [{ ncmCode: '85171300', quantity: 1, unitPrice: '100.00' }],
      }),
    ).rejects.toMatchObject({
      code: 'NCM_NOT_ELIGIBLE',
      details: {
        issues: [
          expect.objectContaining({
            itemIndex: 0,
            details: 'Não existe regra fiscal ativa para o regime LUCRO_REAL',
          }),
        ],
      },
    })

    expect(mocks.taxRuleFindMany).toHaveBeenCalledWith({
      where: expect.objectContaining({ status: 'ACTIVE' }),
    })
    expect(mocks.calculateCurrentModel).not.toHaveBeenCalled()
    expect(mocks.calculateReformModel).not.toHaveBeenCalled()
  })
})
