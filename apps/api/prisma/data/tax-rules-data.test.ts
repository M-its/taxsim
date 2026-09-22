import fs from 'node:fs'
import { describe, expect, it } from 'vitest'
import taxRules from './tax-rules-data.js'

interface NcmCatalogFile {
  Nomenclaturas: Array<{ Codigo: string }>
}

const obsoleteCodes = ['85171200', '64039900', '85235100', '84715000', '99999999']
const regimes = ['SIMPLES_NACIONAL', 'LUCRO_PRESUMIDO', 'LUCRO_REAL']

describe('tax rules seed NCM eligibility', () => {
  it('contains only terminal codes from the current NCM catalog', () => {
    const raw = fs.readFileSync(
      new URL('./Tabela_NCM_Vigente_20260710.json', import.meta.url),
      'utf8',
    )
    const catalog = JSON.parse(raw) as NcmCatalogFile
    const currentTerminalCodes = new Set(
      catalog.Nomenclaturas.map((entry) => entry.Codigo.replace(/[.\s]/g, '')).filter(
        (code) => code.length === 8,
      ),
    )

    const seedCodes = new Set(taxRules.map((rule) => rule.ncmCode))

    expect([...seedCodes].filter((code) => !currentTerminalCodes.has(code))).toEqual([])
    expect([...seedCodes].filter((code) => obsoleteCodes.includes(code))).toEqual([])
  })

  it('provides exactly one ACTIVE rule per regime for every seeded NCM', () => {
    const seedCodes = new Set(taxRules.map((rule) => rule.ncmCode))

    expect(seedCodes.size).toBe(20)
    expect(taxRules).toHaveLength(60)

    for (const ncmCode of seedCodes) {
      const rules = taxRules.filter((rule) => rule.ncmCode === ncmCode)
      expect(rules.map((rule) => rule.taxRegime).sort()).toEqual([...regimes].sort())
      expect(rules.every((rule) => rule.status === 'ACTIVE')).toBe(true)
    }
  })
})
