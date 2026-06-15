import { Decimal } from '@prisma/client/runtime/library'
import type {
  ReformTaxCalculatorResult,
  ReformTaxCalculatorItemResult,
  ReformTaxCalculatorTotals,
} from './tax-calculator.types.js'

interface RfbGIBSUF {
  pIBSUF: string
  vIBSUF: string
}

interface RfbGIBSMun {
  pIBSMun: string
  vIBSMun: string
}

interface RfbGCBS {
  pCBS: string
  vCBS: string
}

interface RfbGTribRegular {
  pAliqEfetRegIBSUF: string
  pAliqEfetRegIBSMun: string
  pAliqEfetRegCBS: string
}

interface RfbGIBSCBS {
  vBC: string
  gIBSUF: RfbGIBSUF
  gIBSMun: RfbGIBSMun
  vIBS: string
  gCBS: RfbGCBS
  gTribRegular?: RfbGTribRegular
}

interface RfbIBSCBS {
  gIBSCBS: RfbGIBSCBS
}

interface RfbObjeto {
  nObj: number
  tribCalc: {
    IBSCBS: RfbIBSCBS
  }
}

interface RfbIBSTotal {
  vIBS: string
}

interface RfbCBSTotal {
  vCBS: string
}

interface RfbIBSCBSTot {
  gIBS: RfbIBSTotal
  gCBS: RfbCBSTotal
}

interface RfbTribCalcTotal {
  IBSCBSTot: RfbIBSCBSTot
}

interface RfbTotal {
  tribCalc: RfbTribCalcTotal
}

interface RfbRocDomain {
  objetos: RfbObjeto[]
  total: RfbTotal
}

function toDecimal(value: number): Decimal {
  if (Number.isNaN(value)) {
    return new Decimal(0)
  }
  return new Decimal(value)
}

export function mapRfbResponseToReformResult(
  rfbResponse: RfbRocDomain,
  inputItems: Array<{ ncmCode: string; quantity: number; unitPrice: string }>,
): ReformTaxCalculatorResult {
  const items: ReformTaxCalculatorItemResult[] = []
  let totalIbs = new Decimal(0)
  let totalCbs = new Decimal(0)
  const totalIs = new Decimal(0)
  let totalTax = new Decimal(0)
  let totalAmount = new Decimal(0)

  for (let i = 0; i < rfbResponse.objetos.length; i++) {
    const obj = rfbResponse.objetos[i]
    const inputItem = inputItems[i]

    if (!inputItem) {
      throw new Error(`Mismatch: RFB response has ${rfbResponse.objetos.length} items but input has ${inputItems.length}`)
    }

    const unitPrice = new Decimal(inputItem.unitPrice)
    const quantity = new Decimal(inputItem.quantity)
    const totalPrice = unitPrice.mul(quantity)

    const gIBSCBS = obj.tribCalc.IBSCBS.gIBSCBS

    const vIBS = toDecimal(Number(gIBSCBS.vIBS))
    const vCBS = toDecimal(Number(gIBSCBS.gCBS.vCBS))
    const vIS = new Decimal(0)

    const gTribRegular = gIBSCBS.gTribRegular
    const pIBSUF = gTribRegular !== undefined
      ? toDecimal(Number(gTribRegular.pAliqEfetRegIBSUF))
      : toDecimal(Number(gIBSCBS.gIBSUF.pIBSUF))
    const pIBSMun = gTribRegular !== undefined
      ? toDecimal(Number(gTribRegular.pAliqEfetRegIBSMun))
      : toDecimal(Number(gIBSCBS.gIBSMun.pIBSMun))
    const ibsRate = pIBSUF.plus(pIBSMun)
    const cbsRate = gTribRegular !== undefined
      ? toDecimal(Number(gTribRegular.pAliqEfetRegCBS))
      : toDecimal(Number(gIBSCBS.gCBS.pCBS))
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

  const effectiveRate = totalAmount.eq(0)
    ? new Decimal(0)
    : totalTax.div(totalAmount)

  const totals: ReformTaxCalculatorTotals = {
    ibs: totalIbs.toFixed(2),
    cbs: totalCbs.toFixed(2),
    is: totalIs.toFixed(2),
    totalTax: totalTax.toFixed(2),
    effectiveRate: effectiveRate.toFixed(4),
  }

  return { items, totals }
}
