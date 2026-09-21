import { Decimal } from '@prisma/client/runtime/library'
import type {
  TaxCalculatorInput,
  ReformTaxCalculatorResult,
  ReformTaxCalculatorItemResult,
  ReformTaxCalculatorTotals,
} from './tax-calculator.types.js'
import { TaxCalculatorResponseValidationError } from './tax-calculator.types.js'
import type { RfbCalculatorResponse } from './tax-calculator.schema.js'

/**
 * The official engine rounds every item and the aggregate total independently
 * using HALF_EVEN. Each rounding can contribute half a cent, so the maximum
 * observable difference is ceil(itemCount / 2) cents (a single item must match
 * exactly). This was verified against the live RFB endpoint: three items
 * produced legitimate deltas of both R$0.01 and R$0.02 depending on the
 * half-cent boundary, and four items produced R$0.02.
 */
export function calculateTotalRoundingTolerance(itemCount: number): Decimal {
  if (itemCount <= 1) {
    return new Decimal(0)
  }

  return new Decimal(Math.ceil(itemCount / 2)).mul('0.01')
}

function orderResponseItems(
  rfbResponse: RfbCalculatorResponse,
  input: TaxCalculatorInput,
): RfbCalculatorResponse['objetos'] {
  const expectedNumbers = new Set(input.itens.map((item) => item.numero))
  const responseByNumber = new Map<number, RfbCalculatorResponse['objetos'][number]>()

  for (const responseItem of rfbResponse.objetos) {
    if (responseByNumber.has(responseItem.nObj) || !expectedNumbers.has(responseItem.nObj)) {
      throw new TaxCalculatorResponseValidationError('tax_calculator_item_identity_mismatch', {
        reason: responseByNumber.has(responseItem.nObj) ? 'duplicate' : 'unexpected',
        expectedItemCount: expectedNumbers.size,
        responseItemCount: rfbResponse.objetos.length,
      })
    }

    responseByNumber.set(responseItem.nObj, responseItem)
  }

  if (
    responseByNumber.size !== expectedNumbers.size ||
    input.itens.some((item) => !responseByNumber.has(item.numero))
  ) {
    throw new TaxCalculatorResponseValidationError('tax_calculator_item_identity_mismatch', {
      reason: 'missing',
      expectedItemCount: expectedNumbers.size,
      responseItemCount: responseByNumber.size,
    })
  }

  return input.itens.map((item) => responseByNumber.get(item.numero)!)
}

function validateOfficialTotal(
  component: 'IBS' | 'CBS',
  itemTotal: Decimal,
  officialTotal: Decimal,
  itemCount: number,
): void {
  const tolerance = calculateTotalRoundingTolerance(itemCount)

  if (itemTotal.minus(officialTotal).abs().gt(tolerance)) {
    throw new TaxCalculatorResponseValidationError('tax_calculator_total_mismatch', {
      component,
      itemCount,
      tolerance: tolerance.toFixed(2),
    })
  }
}

export function mapRfbResponseToReformResult(
  rfbResponse: RfbCalculatorResponse,
  input: TaxCalculatorInput,
  inputItems: Array<{ ncmCode: string; quantity: number; unitPrice: string }>,
): ReformTaxCalculatorResult {
  if (input.itens.length !== inputItems.length) {
    throw new TaxCalculatorResponseValidationError('tax_calculator_item_identity_mismatch', {
      reason: 'input_mapping',
      expectedItemCount: input.itens.length,
      responseItemCount: inputItems.length,
    })
  }

  const orderedResponseItems = orderResponseItems(rfbResponse, input)
  const items: ReformTaxCalculatorItemResult[] = []
  let totalIbs = new Decimal(0)
  let totalCbs = new Decimal(0)
  const totalIs = new Decimal(0)
  let totalTax = new Decimal(0)
  let totalAmount = new Decimal(0)

  for (let i = 0; i < orderedResponseItems.length; i++) {
    const obj = orderedResponseItems[i]
    const inputItem = inputItems[i]

    const unitPrice = new Decimal(inputItem.unitPrice)
    const quantity = new Decimal(inputItem.quantity)
    const totalPrice = unitPrice.mul(quantity)

    const gIBSCBS = obj.tribCalc.IBSCBS.gIBSCBS

    const vIBS = new Decimal(gIBSCBS.vIBS)
    const vCBS = new Decimal(gIBSCBS.gCBS.vCBS)
    const vIS = new Decimal(0)

    const gTribRegular = gIBSCBS.gTribRegular
    const pIBSUF =
      gTribRegular !== undefined
        ? new Decimal(gTribRegular.pAliqEfetRegIBSUF)
        : new Decimal(gIBSCBS.gIBSUF.pIBSUF)
    const pIBSMun =
      gTribRegular !== undefined
        ? new Decimal(gTribRegular.pAliqEfetRegIBSMun)
        : new Decimal(gIBSCBS.gIBSMun.pIBSMun)
    const ibsRate = pIBSUF.plus(pIBSMun)
    const cbsRate =
      gTribRegular !== undefined
        ? new Decimal(gTribRegular.pAliqEfetRegCBS)
        : new Decimal(gIBSCBS.gCBS.pCBS)
    const isRate = new Decimal(0)

    const itemTotalTax = vIBS.plus(vCBS).plus(vIS)

    items.push({
      ncmCode: inputItem.ncmCode,
      quantity: inputItem.quantity,
      unitPrice: inputItem.unitPrice,
      totalPrice: totalPrice.toFixed(2),
      rates: {
        ibsRate: ibsRate.toFixed(4),
        cbsRate: cbsRate.toFixed(4),
        isRate: isRate.toFixed(4),
      },
      taxes: {
        ibs: vIBS.toFixed(2),
        cbs: vCBS.toFixed(2),
        is: vIS.toFixed(2),
        totalTax: itemTotalTax.toFixed(2),
      },
    })

    totalIbs = totalIbs.plus(vIBS)
    totalCbs = totalCbs.plus(vCBS)
    totalTax = totalTax.plus(itemTotalTax)
    totalAmount = totalAmount.plus(totalPrice)
  }

  const officialIbs = new Decimal(rfbResponse.total.tribCalc.IBSCBSTot.gIBS.vIBS)
  const officialCbs = new Decimal(rfbResponse.total.tribCalc.IBSCBSTot.gCBS.vCBS)

  validateOfficialTotal('IBS', totalIbs, officialIbs, items.length)
  validateOfficialTotal('CBS', totalCbs, officialCbs, items.length)

  totalIbs = officialIbs
  totalCbs = officialCbs
  totalTax = officialIbs.plus(officialCbs).plus(totalIs)

  const effectiveRate = totalAmount.eq(0) ? new Decimal(0) : totalTax.div(totalAmount)

  const totals: ReformTaxCalculatorTotals = {
    ibs: totalIbs.toFixed(2),
    cbs: totalCbs.toFixed(2),
    is: totalIs.toFixed(2),
    totalTax: totalTax.toFixed(2),
    effectiveRate: effectiveRate.toFixed(4),
  }

  return { items, totals }
}
