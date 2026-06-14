import { Decimal } from '@prisma/client/runtime/library'
import type {
  ReformTaxCalculatorResult,
  ReformTaxCalculatorItemResult,
  ReformTaxCalculatorTotals,
} from './tax-calculator.types.js'

// RFB Calculator raw response types (simplified from ROCDomain)
interface RfbObjetoDomain {
  nObj: number
  tribCalc: {
    IS: {
      CSTIS: string
      cClassTribIS: string
      vBCIS: number
      pIS: number
      pISEspec: number
      uTrib: string
      qTrib: number
      vIS: number
      memoriaCalculo: string
    }
    IBSCBS: {
      CST: string
      cClassTrib: string
      indDoacao: number
      gIBSCBS: {
        vBC: number
        gIBSUF: {
          pIBSUF: number
          gDif: unknown
          gDevTrib: unknown
          gRed: unknown
          vIBSUF: number
          memoriaCalculo: string
        }
        gIBSMun: {
          pIBSMun: number
          gDif: unknown
          gDevTrib: unknown
          gRed: unknown
          vIBSMun: number
          memoriaCalculo: string
        }
        vIBS: number
        gCBS: {
          pCBS: number
          gDif: unknown
          gDevTrib: unknown
          gRed: unknown
          vCBS: number
          memoriaCalculo: string
        }
        gTribRegular: {
          CSTReg: string
          cClassTribReg: string
          pAliqEfetRegIBSUF: number
          vTribRegIBSUF: number
          pAliqEfetRegIBSMun: number
          vTribRegIBSMun: number
          pAliqEfetRegCBS: number
          vTribRegCBS: number
        }
        gTribCompraGov: unknown
      }
      gIBSCBSMono: unknown
      gTransfCred: unknown
      gAjusteCompet: unknown
      gEstornoCred: unknown
      gCredPresOper: unknown
      gCredPresIBSZFM: unknown
    }
  }
}

interface RfbTotalDomain {
  tribCalc: {
    ISTot: { vIS: number }
    IBSCBSTot: {
      vBCIBSCBS: number
      gIBS: {
        gIBSUF: { vDif: number; vDevTrib: number; vIBSUF: number }
        gIBSMun: { vDif: number; vDevTrib: number; vIBSMun: number }
        vIBS: number
        vCredPres: number
        vCredPresCondSus: number
      }
      gCBS: {
        vDif: number
        vDevTrib: number
        vCBS: number
        vCredPres: number
        vCredPresCondSus: number
      }
      gMono: unknown
      gEstornoCred: unknown
    }
  }
}

interface RfbRocDomain {
  objetos: RfbObjetoDomain[]
  total: RfbTotalDomain
}

export function mapRfbResponseToReformResult(
  rfbResponse: RfbRocDomain,
  inputItems: Array<{ ncmCode: string; quantity: number; unitPrice: string }>,
): ReformTaxCalculatorResult {
  const items: ReformTaxCalculatorItemResult[] = []
  let totalIbs = new Decimal(0)
  let totalCbs = new Decimal(0)
  let totalIs = new Decimal(0)
  let totalTax = new Decimal(0)
  let totalAmount = new Decimal(0)

  for (let i = 0; i < rfbResponse.objetos.length; i++) {
    const obj = rfbResponse.objetos[i]
    const inputItem = inputItems[i]

    const unitPrice = new Decimal(inputItem.unitPrice)
    const quantity = new Decimal(inputItem.quantity)
    const totalPrice = unitPrice.mul(quantity)

    const tribCalc = obj.tribCalc.IBSCBS
    const gIBSCBS = tribCalc.gIBSCBS

    // IBS = UF + Mun
    const vIBSUF = new Decimal(gIBSCBS.gIBSUF?.vIBSUF || 0)
    const vIBSMun = new Decimal(gIBSCBS.gIBSMun?.vIBSMun || 0)
    const vIBS = vIBSUF.plus(vIBSMun)

    // CBS
    const vCBS = new Decimal(gIBSCBS.gCBS?.vCBS || 0)

    // IS
    const vIS = new Decimal(obj.tribCalc.IS?.vIS || 0)

    // Rates from gTribRegular
    const pIBSUF = new Decimal(gIBSCBS.gTribRegular?.pAliqEfetRegIBSUF || 0)
    const pIBSMun = new Decimal(gIBSCBS.gTribRegular?.pAliqEfetRegIBSMun || 0)
    const ibsRate = pIBSUF.plus(pIBSMun)
    const cbsRate = new Decimal(gIBSCBS.gTribRegular?.pAliqEfetRegCBS || 0)
    const isRate = new Decimal(obj.tribCalc.IS?.pIS || 0)

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
    totalIs = totalIs.plus(vIS)
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
