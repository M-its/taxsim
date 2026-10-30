import { readFileSync } from 'node:fs'
import taxRules from '../prisma/data/tax-rules-data.js'
import { assertTaxItemsEligible } from '../src/modules/sales/tax-eligibility.js'
import { calculateCurrentModel } from '../src/modules/tax-engine/tax-engine.service.js'
import { mapRfbResponseToReformResult } from '../src/modules/tax-calculator/tax-calculator.mapper.js'
import { rfbCalculatorResponseSchema } from '../src/modules/tax-calculator/tax-calculator.schema.js'
import fixture from '../../web/src/lib/landing-example.json'

export function calculateLandingExample(example = fixture) {
  const { scenario } = example
  const catalog = JSON.parse(
    readFileSync(
      new URL('../prisma/data/Tabela_NCM_Vigente_20260710.json', import.meta.url),
      'utf8',
    ),
  ) as {
    Nomenclaturas: Array<{ Codigo: string; Data_Inicio: string; Data_Fim: string }>
  }
  const date = new Date(`${scenario.date}T00:00:00Z`).getTime()
  const parseDate = (value: string) => {
    const [day, month, year] = value.split('/').map(Number)
    return Date.UTC(year, month - 1, day)
  }
  const terminal = catalog.Nomenclaturas.filter(
    (entry) => entry.Codigo.replace(/\D/g, '').length === 8,
  )
  const rules = taxRules.filter(
    (rule) => rule.taxRegime === scenario.taxRegime && rule.status === 'ACTIVE',
  )
  const items = [
    { ncmCode: scenario.ncmCode, quantity: scenario.quantity, unitPrice: scenario.unitPrice },
  ]
  // Exactly the pre-calculator eligibility guard used by sales.simulateTax.
  assertTaxItemsEligible({
    items,
    taxRegime: scenario.taxRegime,
    catalogNcmCodes: terminal.map((entry) => entry.Codigo.replace(/\D/g, '')),
    currentNcmCodes: terminal
      .filter((entry) => parseDate(entry.Data_Inicio) <= date && parseDate(entry.Data_Fim) >= date)
      .map((entry) => entry.Codigo.replace(/\D/g, '')),
    taxRules: rules.map((rule) => ({ ...rule, status: 'ACTIVE' as const })),
  })
  const rule = rules.find((entry) => entry.ncmCode === scenario.ncmCode)!
  const current = calculateCurrentModel({
    items,
    taxRegime: scenario.taxRegime,
    taxRules: { [scenario.ncmCode]: rule },
  })
  const response = rfbCalculatorResponseSchema.parse(example.reformResponse)
  const reform = mapRfbResponseToReformResult(
    response,
    {
      id: 'landing-example-v1',
      versao: '0.0.1',
      dhFatoGerador: `${scenario.date}T12:00:00-03:00`,
      municipio: scenario.municipality,
      uf: scenario.uf,
      itens: [
        {
          numero: 1,
          ncm: scenario.ncmCode,
          quantidade: scenario.quantity,
          baseCalculo: scenario.quantity * Number(scenario.unitPrice),
          cst: rule.cst,
          cClassTrib: rule.cClassTrib,
        },
      ],
    },
    items,
  )
  return {
    currentTax: current.totals.totalTax,
    reformTax: reform.totals.totalTax,
    pis: current.totals.pis,
    cofins: current.totals.cofins,
    icms: current.totals.icms,
    iss: current.totals.iss,
    ibs: reform.totals.ibs,
    cbs: reform.totals.cbs,
    is: reform.totals.is,
  }
}
