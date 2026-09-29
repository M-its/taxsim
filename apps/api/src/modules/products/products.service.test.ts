import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  companyFindUnique: vi.fn(),
  productFindMany: vi.fn(),
  productCount: vi.fn(),
  productFindFirst: vi.fn(),
  productCreate: vi.fn(),
  productUpdate: vi.fn(),
  diagnoseNcmCodes: vi.fn(),
}))

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    company: { findUnique: mocks.companyFindUnique },
    product: {
      findMany: mocks.productFindMany,
      count: mocks.productCount,
      findFirst: mocks.productFindFirst,
      create: mocks.productCreate,
      update: mocks.productUpdate,
    },
  },
}))

vi.mock('../ncm/ncm.service.js', () => ({
  NCM_CATALOG_VERSION: '2026-07-10',
  diagnoseNcmCodes: mocks.diagnoseNcmCodes,
}))

import {
  createProduct,
  listProducts,
  updateProduct,
} from './products.service.js'

const input = {
  name: 'Notebook',
  sku: 'NOTE-1',
  ncmCode: '84713012',
  unitPrice: '2500.00',
}

const product = {
  id: 'product-1',
  companyId: 'company-1',
  ...input,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
}

describe('products service - NCM vigente', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.companyFindUnique.mockResolvedValue({ taxRegime: 'LUCRO_REAL' })
  })

  it('rejeita criação com NCM ausente do catálogo', async () => {
    mocks.diagnoseNcmCodes.mockResolvedValue([
      { code: input.ncmCode, description: null, status: 'NOT_FOUND' },
    ])

    await expect(createProduct('company-1', input)).rejects.toMatchObject({
      code: 'INVALID_NCM',
      statusCode: 422,
      details: { ncmCode: input.ncmCode, status: 'NOT_FOUND' },
    })
    expect(mocks.productCreate).not.toHaveBeenCalled()
  })

  it('permite salvar NCM vigente sem regra fiscal ativa', async () => {
    mocks.diagnoseNcmCodes.mockResolvedValue([
      {
        code: input.ncmCode,
        description: 'Computadores portáteis',
        status: 'NO_ACTIVE_RULE',
      },
    ])
    mocks.productCreate.mockResolvedValue(product)

    await expect(createProduct('company-1', input)).resolves.toBe(product)
    expect(mocks.productCreate).toHaveBeenCalledOnce()
  })

  it('preserva NCM legado ao editar somente campos não fiscais', async () => {
    const legacy = { ...product, ncmCode: '99999999' }
    mocks.productFindFirst.mockResolvedValue(legacy)
    mocks.productUpdate.mockResolvedValue({ ...legacy, name: 'Nome novo' })

    await updateProduct('company-1', product.id, {
      ...input,
      name: 'Nome novo',
      ncmCode: legacy.ncmCode,
    })

    expect(mocks.diagnoseNcmCodes).not.toHaveBeenCalled()
    expect(mocks.productUpdate).toHaveBeenCalledOnce()
  })

  it('impede trocar um NCM legado por outro NCM expirado', async () => {
    mocks.productFindFirst.mockResolvedValue({ ...product, ncmCode: '99999999' })
    mocks.diagnoseNcmCodes.mockResolvedValue([
      {
        code: input.ncmCode,
        description: 'Código expirado',
        status: 'NOT_CURRENT',
      },
    ])

    await expect(
      updateProduct('company-1', product.id, input),
    ).rejects.toMatchObject({
      code: 'INVALID_NCM',
      details: { status: 'NOT_CURRENT' },
    })
    expect(mocks.productUpdate).not.toHaveBeenCalled()
  })

  it('calcula o status na listagem e expõe a versão do catálogo', async () => {
    mocks.productFindMany.mockResolvedValue([product])
    mocks.productCount.mockResolvedValue(1)
    mocks.diagnoseNcmCodes.mockResolvedValue([
      {
        code: input.ncmCode,
        description: 'Computadores portáteis',
        status: 'ELIGIBLE',
      },
    ])

    const result = await listProducts('company-1', {
      page: 1,
      limit: 20,
    })

    expect(result.data[0]).toMatchObject({
      ncmStatus: 'ELIGIBLE',
      ncmDescription: 'Computadores portáteis',
    })
    expect(result.metadata.ncmCatalogVersion).toBe('2026-07-10')
  })
})
