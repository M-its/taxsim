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
const toFixedHalfEven = (value: Decimal, decimalPlaces: number): string =>
  value.toFixed(decimalPlaces, Decimal.ROUND_HALF_EVEN)

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
      totalPrice: toFixedHalfEven(totalPrice, 2),
      taxes: {
        pisRate: toFixedHalfEven(pisRate, 4),
        cofinsRate: toFixedHalfEven(cofinsRate, 4),
        icmsRate: toFixedHalfEven(icmsRate, 4),
        issRate: toFixedHalfEven(issRate, 4),
        pis: toFixedHalfEven(pis, 2),
        cofins: toFixedHalfEven(cofins, 2),
        icms: toFixedHalfEven(icms, 2),
        iss: toFixedHalfEven(iss, 2),
        totalTax: toFixedHalfEven(itemTotalTax, 2),
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
    pis: toFixedHalfEven(totals.pis, 2),
    cofins: toFixedHalfEven(totals.cofins, 2),
    icms: toFixedHalfEven(totals.icms, 2),
    iss: toFixedHalfEven(totals.iss, 2),
    totalTax: toFixedHalfEven(totals.totalTax, 2),
    effectiveRate: toFixedHalfEven(effectiveRate, 4),
  }

  return { items, totals: resultTotals }
}
