import { Decimal } from '@prisma/client/runtime/library'
import { prisma } from '../../lib/prisma.js'
import { AppError } from '../../shared/errors/AppError.js'
import { calculateCurrentModel } from '../tax-engine/tax-engine.service.js'
import { TaxRuleNotFoundError } from '../tax-engine/tax-engine.types.js'
import {
  buildOperacaoInput,
  calculateReformModel,
} from '../tax-calculator/tax-calculator.client.js'
import { TaxCalculatorUnavailableError } from '../tax-calculator/tax-calculator.types.js'
import type {
  CreateSaleInput,
  SimulateInput,
  SaleResponse,
  SimulationResponse,
} from './sales.types.js'

async function getProductsWithRules(
  productIds: string[],
  companyId: string,
  taxRegime: string,
) {
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      companyId,
    },
  })

  if (products.length !== productIds.length) {
    throw AppError.notFound('One or more products not found')
  }

  const ncmCodes = [...new Set(products.map((p) => p.ncmCode))]

  const taxRules = await prisma.taxRule.findMany({
    where: {
      ncmCode: { in: ncmCodes },
      taxRegime: taxRegime as 'SIMPLES_NACIONAL' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL',
      status: 'ACTIVE',
    },
  })

  const taxRulesMap: Record<string, {
    pisRate: string
    cofinsRate: string
    icmsRate: string
    issRate: string
    cClassTrib: string
    cst: string
  }> = {}

  for (const rule of taxRules) {
    taxRulesMap[rule.ncmCode] = {
      pisRate: rule.pisRate.toFixed(4),
      cofinsRate: rule.cofinsRate.toFixed(4),
      icmsRate: rule.icmsRate.toFixed(4),
      issRate: rule.issRate.toFixed(4),
      cClassTrib: rule.cClassTrib,
      cst: rule.cst,
    }
  }

  return { products, taxRulesMap }
}

function buildEngineInput(
  items: Array<{ productId: string; quantity: number }>,
  products: Array<{ id: string; ncmCode: string; unitPrice: Decimal; name: string }>,
  taxRulesMap: Record<string, { pisRate: string; cofinsRate: string; icmsRate: string; issRate: string; cClassTrib: string; cst: string }>,
  taxRegime: string,
) {
  const engineItems = items.map((item) => {
    const product = products.find((p) => p.id === item.productId)
    if (!product) throw AppError.notFound('Product not found')

    const rule = taxRulesMap[product.ncmCode]
    if (!rule) {
      throw new TaxRuleNotFoundError(product.ncmCode)
    }

    return {
      ncmCode: product.ncmCode,
      quantity: item.quantity,
      unitPrice: product.unitPrice.toFixed(2),
      productName: product.name,
      productId: product.id,
      cClassTrib: rule.cClassTrib,
      cst: rule.cst,
    }
  })

  const taxRulesForEngine: Record<string, { pisRate: string; cofinsRate: string; icmsRate: string; issRate: string }> = {}
  for (const item of engineItems) {
    const rule = taxRulesMap[item.ncmCode]
    if (rule) {
      taxRulesForEngine[item.ncmCode] = {
        pisRate: rule.pisRate,
        cofinsRate: rule.cofinsRate,
        icmsRate: rule.icmsRate,
        issRate: rule.issRate,
      }
    }
  }

  return {
    taxEngineInput: {
      taxRegime,
      items: engineItems.map(({ ncmCode, quantity, unitPrice }) => ({
        ncmCode,
        quantity,
        unitPrice,
      })),
      taxRules: taxRulesForEngine,
    },
    enrichedItems: engineItems,
  }
}

async function runTaxEngines(
  taxEngineInput: {
    taxRegime: string
    items: Array<{ ncmCode: string; quantity: number; unitPrice: string }>
    taxRules: Record<string, { pisRate: string; cofinsRate: string; icmsRate: string; issRate: string }>
  },
  enrichedItems: Array<{
    ncmCode: string
    quantity: number
    unitPrice: string
    productName: string
    productId: string
    cClassTrib: string
    cst: string
  }>,
  company: { municipioCode: number | null; uf: string | null; taxRegime: string },
): Promise<{
  currentResult: ReturnType<typeof calculateCurrentModel>
  reformResult: Awaited<ReturnType<typeof calculateReformModel>>
}> {
  const [currentResult] = await Promise.all([
    Promise.resolve().then(() => calculateCurrentModel(taxEngineInput)),
  ])

  if (!company.municipioCode || !company.uf) {
    throw AppError.unprocessable('Company must have municipioCode and uf configured')
  }

  const operacaoInput = buildOperacaoInput(
    enrichedItems.map((item) => ({
      ncmCode: item.ncmCode,
      cClassTrib: item.cClassTrib,
      cst: item.cst,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
    company.municipioCode,
    company.uf,
  )

  const reformResult = await calculateReformModel(
    operacaoInput,
    enrichedItems.map((item) => ({
      ncmCode: item.ncmCode,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
  )

  return { currentResult, reformResult }
}

function mergeResults(
  currentResult: ReturnType<typeof calculateCurrentModel>,
  reformResult: Awaited<ReturnType<typeof calculateReformModel>>,
  totalAmount: Decimal,
): {
  currentModel: {
    totalPis: string
    totalCofins: string
    totalIcms: string
    totalIss: string
    total: string
  }
  reformModel: {
    totalIbs: string
    totalCbs: string
    totalIs: string
    total: string
  }
  delta: {
    absolute: string
    percentual: string
  }
  breakdown: Array<{
    ncmCode: string
    quantity: number
    unitPrice: string
    totalPrice: string
    currentModel: {
      pisRate: string
      cofinsRate: string
      icmsRate: string
      issRate: string
      totalTax: string
    }
    reformModel: {
      ibsRate: string
      cbsRate: string
      isRate: string
      totalTax: string
    }
  }>
} {
  const totalCurrent = new Decimal(currentResult.totals.totalTax)
  const totalReform = new Decimal(reformResult.totals.totalTax)
  const absolute = totalReform.minus(totalCurrent)
  const percentual = totalCurrent.eq(0)
    ? new Decimal(0)
    : absolute.div(totalCurrent).times(100)

  const breakdown = currentResult.items.map((currentItem, i) => {
    const reformItem = reformResult.items[i]
    return {
      ncmCode: currentItem.ncmCode,
      quantity: currentItem.quantity,
      unitPrice: currentItem.unitPrice,
      totalPrice: currentItem.totalPrice,
      currentModel: {
        pisRate: currentItem.taxes.pisRate,
        cofinsRate: currentItem.taxes.cofinsRate,
        icmsRate: currentItem.taxes.icmsRate,
        issRate: currentItem.taxes.issRate,
        totalTax: currentItem.taxes.totalTax,
      },
      reformModel: {
        ibsRate: reformItem.rates.ibsRate,
        cbsRate: reformItem.rates.cbsRate,
        isRate: reformItem.rates.isRate,
        totalTax: reformItem.taxes.totalTax,
      },
    }
  })

  return {
    currentModel: {
      totalPis: currentResult.totals.pis,
      totalCofins: currentResult.totals.cofins,
      totalIcms: currentResult.totals.icms,
      totalIss: currentResult.totals.iss,
      total: currentResult.totals.totalTax,
    },
    reformModel: {
      totalIbs: reformResult.totals.ibs,
      totalCbs: reformResult.totals.cbs,
      totalIs: reformResult.totals.is,
      total: reformResult.totals.totalTax,
    },
    delta: {
      absolute: absolute.toFixed(2),
      percentual: percentual.toFixed(2),
    },
    breakdown,
  }
}

export const createSale = async (
  companyId: string,
  input: CreateSaleInput,
): Promise<SaleResponse> => {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  })

  if (!company) {
    throw AppError.notFound('Company not found')
  }

  const client = await prisma.client.findFirst({
    where: { id: input.clientId, companyId },
  })

  if (!client) {
    throw AppError.notFound('Client not found')
  }

  const productIds = input.items.map((item) => item.productId)
  const { products, taxRulesMap } = await getProductsWithRules(
    productIds,
    companyId,
    company.taxRegime,
  )

  const { taxEngineInput, enrichedItems } = buildEngineInput(
    input.items,
    products,
    taxRulesMap,
    company.taxRegime,
  )

  try {
    const { currentResult, reformResult } = await runTaxEngines(
      taxEngineInput,
      enrichedItems,
      company,
    )

    const totalAmount = products.reduce((sum, product) => {
      const item = input.items.find((i) => i.productId === product.id)
      return sum.plus(product.unitPrice.mul(item?.quantity ?? 0))
    }, new Decimal(0))

    const { currentModel, reformModel, delta, breakdown } = mergeResults(
      currentResult,
      reformResult,
      totalAmount,
    )

    const sale = await prisma.sale.create({
      data: {
        companyId,
        clientId: input.clientId,
        totalAmount,
        totalPis: new Decimal(currentModel.totalPis),
        totalCofins: new Decimal(currentModel.totalCofins),
        totalIcms: new Decimal(currentModel.totalIcms),
        totalIss: new Decimal(currentModel.totalIss),
        totalIbs: new Decimal(reformModel.totalIbs),
        totalCbs: new Decimal(reformModel.totalCbs),
        totalIs: new Decimal(reformModel.totalIs),
        items: {
          create: breakdown.map((b, i) => {
            const product = products.find((p) => p.ncmCode === b.ncmCode)
            return {
              productId: product?.id ?? '',
              quantity: b.quantity,
              unitPrice: new Decimal(b.unitPrice),
              ncmCode: b.ncmCode,
              totalPrice: new Decimal(b.totalPrice),
              pisRate: new Decimal(b.currentModel.pisRate),
              cofinsRate: new Decimal(b.currentModel.cofinsRate),
              icmsRate: new Decimal(b.currentModel.icmsRate),
              issRate: new Decimal(b.currentModel.issRate),
              ibsRate: new Decimal(b.reformModel.ibsRate),
              cbsRate: new Decimal(b.reformModel.cbsRate),
              isRate: new Decimal(b.reformModel.isRate),
            }
          }),
        },
      },
      include: {
        items: { include: { product: true } },
        client: true,
      },
    })

    return formatSaleResponse(sale)
  } catch (error) {
    if (error instanceof TaxRuleNotFoundError) {
      throw AppError.unprocessable(`No active tax rule for NCM ${error.ncmCode}`)
    }
    if (error instanceof TaxCalculatorUnavailableError) {
      throw AppError.unprocessable('Tax calculator service unavailable')
    }
    throw error
  }
}

export const simulateTax = async (
  input: SimulateInput,
): Promise<SimulationResponse> => {
  const { items } = input

  const taxRules = await prisma.taxRule.findMany({
    where: {
      ncmCode: { in: items.map((item) => item.ncmCode) },
      taxRegime: input.taxRegime as 'SIMPLES_NACIONAL' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL',
      status: 'ACTIVE',
    },
  })

  try {
    const taxRulesMap: Record<string, {
      pisRate: string
      cofinsRate: string
      icmsRate: string
      issRate: string
      cClassTrib: string
      cst: string
    }> = {}

    for (const rule of taxRules) {
      taxRulesMap[rule.ncmCode] = {
        pisRate: rule.pisRate.toFixed(4),
        cofinsRate: rule.cofinsRate.toFixed(4),
        icmsRate: rule.icmsRate.toFixed(4),
        issRate: rule.issRate.toFixed(4),
        cClassTrib: rule.cClassTrib,
        cst: rule.cst,
      }
    }

    const engineItems = items.map((item) => {
      const rule = taxRulesMap[item.ncmCode]
      if (!rule) {
        throw new TaxRuleNotFoundError(item.ncmCode)
      }
      return {
        ncmCode: item.ncmCode,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        cClassTrib: rule.cClassTrib,
        cst: rule.cst,
      }
    })

    const taxEngineInput = {
      taxRegime: input.taxRegime,
      items: engineItems.map(({ ncmCode, quantity, unitPrice }) => ({
        ncmCode,
        quantity,
        unitPrice,
      })),
      taxRules: Object.fromEntries(
        Object.entries(taxRulesMap).map(([ncm, rule]) => [
          ncm,
          { pisRate: rule.pisRate, cofinsRate: rule.cofinsRate, icmsRate: rule.icmsRate, issRate: rule.issRate },
        ]),
      ),
    }

    const currentResult = calculateCurrentModel(taxEngineInput)

    // For simulation, use default municipio/uf since there's no authenticated company
    const operacaoInput = buildOperacaoInput(
      engineItems.map((item) => ({
        ncmCode: item.ncmCode,
        cClassTrib: item.cClassTrib,
        cst: item.cst,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      4314902, // Porto Alegre
      'RS',
    )

    const reformResult = await calculateReformModel(
      operacaoInput,
      engineItems.map((item) => ({
        ncmCode: item.ncmCode,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    )

    const totalAmount = items.reduce((sum, item) => {
      return sum.plus(new Decimal(item.unitPrice).mul(item.quantity))
    }, new Decimal(0))

    const { currentModel, reformModel, delta, breakdown } = mergeResults(
      currentResult,
      reformResult,
      totalAmount,
    )

    return {
      totalAmount: totalAmount.toFixed(2),
      currentModel: {
        ...currentModel,
        effectiveRate: currentResult.totals.effectiveRate,
      },
      reformModel: {
        ...reformModel,
        effectiveRate: reformResult.totals.effectiveRate,
      },
      delta,
      breakdown,
    }
  } catch (error) {
    if (error instanceof TaxRuleNotFoundError) {
      throw AppError.unprocessable(
        `Nenhuma regra fiscal encontrada para o NCM ${error.ncmCode}. Cadastre uma regra fiscal para este NCM antes de simular.`,
      )
    }
    if (error instanceof TaxCalculatorUnavailableError) {
      throw AppError.unprocessable('Tax calculator service unavailable')
    }
    throw error
  }
}

export const listSales = async (
  companyId: string,
  page: number,
  limit: number,
  status?: string,
  from?: Date,
  to?: Date,
) => {
  const where: Record<string, unknown> = { companyId }

  if (status) {
    where.status = status
  }

  if (from || to) {
    where.createdAt = {}
    if (from) (where.createdAt as Record<string, Date>).gte = from
    if (to) (where.createdAt as Record<string, Date>).lte = to
  }

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { product: true } },
        client: true,
      },
    }),
    prisma.sale.count({ where }),
  ])

  return {
    data: sales.map(formatSaleResponse),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export const getSale = async (companyId: string, saleId: string): Promise<SaleResponse> => {
  const sale = await prisma.sale.findFirst({
    where: { id: saleId, companyId },
    include: {
      items: { include: { product: true } },
      client: true,
    },
  })

  if (!sale) {
    throw AppError.notFound('Sale not found')
  }

  return formatSaleResponse(sale)
}

export const confirmSale = async (companyId: string, saleId: string) => {
  const sale = await prisma.sale.findFirst({
    where: { id: saleId, companyId },
  })

  if (!sale) {
    throw AppError.notFound('Sale not found')
  }

  if (sale.status !== 'DRAFT') {
    throw AppError.unprocessable('Sale is not in DRAFT status')
  }

  const updated = await prisma.sale.update({
    where: { id: saleId },
    data: { status: 'CONFIRMED' },
  })

  return { id: updated.id, status: updated.status }
}

export const cancelSale = async (companyId: string, saleId: string) => {
  const sale = await prisma.sale.findFirst({
    where: { id: saleId, companyId },
  })

  if (!sale) {
    throw AppError.notFound('Sale not found')
  }

  if (sale.status === 'CONFIRMED') {
    throw AppError.unprocessable('Cannot cancel a confirmed sale')
  }

  const updated = await prisma.sale.update({
    where: { id: saleId },
    data: { status: 'CANCELLED' },
  })

  return { id: updated.id, status: updated.status }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatSaleResponse(sale: any): SaleResponse {
  const totalAmount = sale.totalAmount.toFixed(2)

  return {
    id: sale.id,
    status: sale.status,
    clientId: sale.clientId,
    totalAmount,
    currentModel: {
      totalPis: sale.totalPis.toFixed(2),
      totalCofins: sale.totalCofins.toFixed(2),
      totalIcms: sale.totalIcms.toFixed(2),
      totalIss: sale.totalIss.toFixed(2),
      total: new Decimal(sale.totalPis)
        .plus(sale.totalCofins)
        .plus(sale.totalIcms)
        .plus(sale.totalIss)
        .toFixed(2),
    },
    reformModel: {
      totalIbs: sale.totalIbs.toFixed(2),
      totalCbs: sale.totalCbs.toFixed(2),
      totalIs: sale.totalIs.toFixed(2),
      total: new Decimal(sale.totalIbs)
        .plus(sale.totalCbs)
        .plus(sale.totalIs)
        .toFixed(2),
    },
    delta: {
      absolute: new Decimal(sale.totalIbs)
        .plus(sale.totalCbs)
        .plus(sale.totalIs)
        .minus(sale.totalPis)
        .minus(sale.totalCofins)
        .minus(sale.totalIcms)
        .minus(sale.totalIss)
        .toFixed(2),
      percentual: new Decimal(sale.totalPis)
        .plus(sale.totalCofins)
        .plus(sale.totalIcms)
        .plus(sale.totalIss)
        .eq(0)
        ? '0.00'
        : new Decimal(sale.totalIbs)
            .plus(sale.totalCbs)
            .plus(sale.totalIs)
            .minus(sale.totalPis)
            .minus(sale.totalCofins)
            .minus(sale.totalIcms)
            .minus(sale.totalIss)
            .div(
              new Decimal(sale.totalPis)
                .plus(sale.totalCofins)
                .plus(sale.totalIcms)
                .plus(sale.totalIss),
            )
            .times(100)
            .toFixed(2),
    },
    items: sale.items.map((item: any) => ({
      id: item.id,
      productId: item.productId,
      productName: item.product?.name ?? '',
      quantity: item.quantity,
      unitPrice: item.unitPrice.toFixed(2),
      totalPrice: item.totalPrice.toFixed(2),
      ncmCode: item.ncmCode,
      snapshot: {
        pisRate: item.pisRate.toFixed(4),
        cofinsRate: item.cofinsRate.toFixed(4),
        icmsRate: item.icmsRate.toFixed(4),
        issRate: item.issRate.toFixed(4),
        ibsRate: item.ibsRate.toFixed(4),
        cbsRate: item.cbsRate.toFixed(4),
        isRate: item.isRate.toFixed(4),
      },
    })),
    createdAt: sale.createdAt.toISOString(),
  }
}
