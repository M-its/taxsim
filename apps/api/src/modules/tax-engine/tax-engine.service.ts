import { Decimal } from '@prisma/client/runtime/library'
import type {
  TaxEngineInput,
  TaxEngineResult,
  TaxEngineItemResult,
  TaxEngineTotals,
} from './tax-engine.types.js'
import { TaxRuleNotFoundError } from './tax-engine.types.js'

const toDecimal = (value: string): Decimal => new Decimal(value)

const multiply = (a: Decimal, b: Decimal): Decimal => a.mul(b)
const add = (a: Decimal, b: Decimal): Decimal => a.plus(b)
const sum = (values: Decimal[]): Decimal =>
  values.reduce((acc, val) => acc.plus(val), new Decimal(0))

export function calculateCurrentModel(input: TaxEngineInput): TaxEngineResult {
  const items: TaxEngineItemResult[] = []
  const totals = {
    pis: new Decimal(0),
    cofins: new Decimal(0),
    icms: new Decimal(0),
    iss: new Decimal(0),
    totalTax: new Decimal(0),
    totalAmount: new Decimal(0),
  }

  for (const item of input.items) {
    const rule = input.taxRules[item.ncmCode]
    if (!rule) {
      throw new TaxRuleNotFoundError(item.ncmCode)
    }

    const quantity = new Decimal(item.quantity)
    const unitPrice = toDecimal(item.unitPrice)
    const totalPrice = multiply(quantity, unitPrice)

    const pisRate = toDecimal(rule.pisRate)
    const cofinsRate = toDecimal(rule.cofinsRate)
    const icmsRate = toDecimal(rule.icmsRate)
    const issRate = toDecimal(rule.issRate)

    const pis = multiply(totalPrice, pisRate)
    const cofins = multiply(totalPrice, cofinsRate)
    const icms = multiply(totalPrice, icmsRate)
    const iss = multiply(totalPrice, issRate)
    const itemTotalTax = sum([pis, cofins, icms, iss])

    items.push({
      ncmCode: item.ncmCode,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: totalPrice.toFixed(2),
      taxes: {
        pisRate: pisRate.toFixed(4),
        cofinsRate: cofinsRate.toFixed(4),
        icmsRate: icmsRate.toFixed(4),
        issRate: issRate.toFixed(4),
        pis: pis.toFixed(2),
        cofins: cofins.toFixed(2),
        icms: icms.toFixed(2),
        iss: iss.toFixed(2),
        totalTax: itemTotalTax.toFixed(2),
      },
    })

    totals.pis = add(totals.pis, pis)
    totals.cofins = add(totals.cofins, cofins)
    totals.icms = add(totals.icms, icms)
    totals.iss = add(totals.iss, iss)
    totals.totalTax = add(totals.totalTax, itemTotalTax)
    totals.totalAmount = add(totals.totalAmount, totalPrice)
  }

  const effectiveRate = totals.totalAmount.eq(0)
    ? new Decimal(0)
    : totals.totalTax.div(totals.totalAmount)

  const resultTotals: TaxEngineTotals = {
    pis: totals.pis.toFixed(2),
    cofins: totals.cofins.toFixed(2),
    icms: totals.icms.toFixed(2),
    iss: totals.iss.toFixed(2),
    totalTax: totals.totalTax.toFixed(2),
    effectiveRate: effectiveRate.toFixed(4),
  }

  return { items, totals: resultTotals }
}
