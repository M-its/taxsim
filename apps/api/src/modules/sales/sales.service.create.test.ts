import { Decimal } from '@prisma/client/runtime/library'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  companyFindUnique: vi.fn(),
  clientFindFirst: vi.fn(),
  productFindMany: vi.fn(),
  taxRuleFindMany: vi.fn(),
  ncmCatalogFindMany: vi.fn(),
  saleCreate: vi.fn(),
  calculateCurrentModel: vi.fn(),
  buildOperacaoInput: vi.fn(),
  calculateReformModel: vi.fn(),
}))

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    company: { findUnique: mocks.companyFindUnique },
    client: { findFirst: mocks.clientFindFirst },
    product: { findMany: mocks.productFindMany },
    taxRule: { findMany: mocks.taxRuleFindMany },
    ncmCatalog: { findMany: mocks.ncmCatalogFindMany },
    sale: { create: mocks.saleCreate },
  },
}))

vi.mock('../tax-engine/tax-engine.service.js', () => ({
  calculateCurrentModel: mocks.calculateCurrentModel,
}))

vi.mock('../tax-calculator/tax-calculator.client.js', () => ({
  buildOperacaoInput: mocks.buildOperacaoInput,
  calculateReformModel: mocks.calculateReformModel,
}))

import { createSale } from './sales.service.js'

const companyId = '00000000-0000-4000-8000-000000000001'
const clientId = '00000000-0000-4000-8000-000000000002'
const firstProductId = '00000000-0000-4000-8000-000000000003'
const secondProductId = '00000000-0000-4000-8000-000000000004'

interface ProductFixture {
  id: string
  name: string
  ncmCode: string
  unitPrice: Decimal
}

interface CreatedItemFixture {
  productId: string
  quantity: number
  ncmCode: string
  totalPrice: Decimal
}

let productFixtures: ProductFixture[] = []

function currentResultFor(
  input: {
    items: Array<{ ncmCode: string; quantity: number; unitPrice: string }>
  },
) {
  return {
    items: input.items.map((item) => ({
      ...item,
      totalPrice: new Decimal(item.unitPrice).mul(item.quantity).toFixed(2),
      taxes: {
        pisRate: '0.0165',
        cofinsRate: '0.0760',
        icmsRate: '0.1800',
        issRate: '0.0000',
        pis: '0.00',
        cofins: '0.00',
        icms: '0.00',
        iss: '0.00',
        totalTax: '0.00',
      },
    })),
    totals: {
      pis: '0.00',
      cofins: '0.00',
      icms: '0.00',
      iss: '0.00',
      totalTax: '0.00',
      effectiveRate: '0.0000',
    },
  }
}

function reformResultFor(
  originalItems: Array<{ ncmCode: string; quantity: number; unitPrice: string }>,
) {
  return {
    items: originalItems.map((item) => ({
      ...item,
      totalPrice: new Decimal(item.unitPrice).mul(item.quantity).toFixed(2),
      rates: {
        ibsRate: '0.1000',
        cbsRate: '0.9000',
        isRate: '0.0000',
      },
      taxes: {
        ibs: '0.00',
        cbs: '0.00',
        is: '0.00',
        totalTax: '0.00',
      },
    })),
    totals: {
      ibs: '0.00',
      cbs: '0.00',
      is: '0.00',
      totalTax: '0.00',
      effectiveRate: '0.0000',
    },
  }
}

function arrangeProducts(products: ProductFixture[]) {
  productFixtures = products
  mocks.productFindMany.mockResolvedValue(products)
  mocks.ncmCatalogFindMany.mockResolvedValue([
    ...new Set(products.map((product) => product.ncmCode)),
  ].map((code) => ({ code })))
  mocks.taxRuleFindMany.mockResolvedValue(
    [...new Set(products.map((product) => product.ncmCode))].map((ncmCode) => ({
      ncmCode,
      status: 'ACTIVE',
      cst: '000',
      cClassTrib: '000001',
      pisRate: new Decimal('0.0165'),
      cofinsRate: new Decimal('0.0760'),
      icmsRate: new Decimal('0.1800'),
      issRate: new Decimal('0.0000'),
    })),
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  productFixtures = []
  mocks.companyFindUnique.mockResolvedValue({
    id: companyId,
    taxRegime: 'LUCRO_REAL',
    municipioCode: 3550308,
    uf: 'SP',
  })
  mocks.clientFindFirst.mockResolvedValue({ id: clientId, companyId })
  mocks.calculateCurrentModel.mockImplementation(currentResultFor)
  mocks.buildOperacaoInput.mockReturnValue({ itens: [] })
  mocks.calculateReformModel.mockImplementation(
    (_input, originalItems) => reformResultFor(originalItems),
  )
  mocks.saleCreate.mockImplementation(({ data }) => {
    const createdItems = data.items.create as CreatedItemFixture[]

    return {
      id: '00000000-0000-4000-8000-000000000099',
      status: 'DRAFT',
      clientId: data.clientId,
      totalAmount: data.totalAmount,
      totalPis: data.totalPis,
      totalCofins: data.totalCofins,
      totalIcms: data.totalIcms,
      totalIss: data.totalIss,
      totalIbs: data.totalIbs,
      totalCbs: data.totalCbs,
      totalIs: data.totalIs,
      createdAt: new Date('2026-09-24T12:00:00.000Z'),
      items: createdItems.map((item, index) => ({
        id: `sale-item-${index}`,
        ...item,
        product: productFixtures.find((product) => product.id === item.productId),
      })),
    }
  })
})

describe('createSale line preservation', () => {
  it('sums every line when the same productId appears more than once', async () => {
    arrangeProducts([
      {
        id: firstProductId,
        name: 'Produto repetido',
        ncmCode: '84713012',
        unitPrice: new Decimal('10.00'),
      },
    ])

    const result = await createSale(companyId, {
      clientId,
      items: [
        { productId: firstProductId, quantity: 2 },
        { productId: firstProductId, quantity: 3 },
      ],
    })

    expect(result.totalAmount).toBe('50.00')

    const createData = mocks.saleCreate.mock.calls[0][0].data
    const createdItems = createData.items.create as CreatedItemFixture[]
    expect(createData.totalAmount.toFixed(2)).toBe('50.00')
    expect(createdItems).toHaveLength(2)
    expect(createdItems.map((item) => item.quantity)).toEqual([2, 3])
    expect(createdItems.map((item) => item.productId)).toEqual([
      firstProductId,
      firstProductId,
    ])
    expect(createdItems.map((item) => item.ncmCode)).toEqual([
      '84713012',
      '84713012',
    ])

    expect(mocks.calculateCurrentModel.mock.calls[0][0].items).toHaveLength(2)
    expect(mocks.calculateReformModel.mock.calls[0][1]).toHaveLength(2)
  })

  it('keeps distinct productIds on their original lines when they share an NCM', async () => {
    arrangeProducts([
      {
        id: firstProductId,
        name: 'Produto A',
        ncmCode: '84713012',
        unitPrice: new Decimal('10.00'),
      },
      {
        id: secondProductId,
        name: 'Produto B',
        ncmCode: '84713012',
        unitPrice: new Decimal('7.50'),
      },
    ])

    const result = await createSale(companyId, {
      clientId,
      items: [
        { productId: firstProductId, quantity: 2 },
        { productId: secondProductId, quantity: 4 },
      ],
    })

    expect(result.totalAmount).toBe('50.00')

    const createdItems = mocks.saleCreate.mock.calls[0][0].data.items
      .create as CreatedItemFixture[]
    expect(createdItems.map((item) => item.productId)).toEqual([
      firstProductId,
      secondProductId,
    ])
    expect(createdItems.map((item) => item.totalPrice.toFixed(2))).toEqual([
      '20.00',
      '30.00',
    ])
  })
})
