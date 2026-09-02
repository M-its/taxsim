import { describe, expect, it, vi } from 'vitest'
import { seedTaxRules, type TaxRuleSeed } from './tax-rule-seed'

describe('seedTaxRules', () => {
  it('atualiza regras existentes com os valores atuais do seed', async () => {
    const upsert = vi.fn().mockResolvedValue(undefined)
    const client = {
      taxRule: {
        count: vi.fn(),
        upsert,
      },
    }
    const rule: TaxRuleSeed = {
      ncmCode: '22030000',
      taxRegime: 'LUCRO_REAL',
      status: 'ACTIVE',
      cClassTrib: '000001',
      cst: '000',
      pisRate: '0.0165',
      cofinsRate: '0.0760',
      icmsRate: '0.2500',
      issRate: '0.0000',
    }

    await seedTaxRules(client as never, [rule])

    expect(upsert).toHaveBeenCalledWith({
      where: {
        ncmCode_taxRegime_status: {
          ncmCode: rule.ncmCode,
          taxRegime: rule.taxRegime,
          status: rule.status,
        },
      },
      update: {
        cClassTrib: rule.cClassTrib,
        cst: rule.cst,
      },
      create: {
        ncmCode: rule.ncmCode,
        taxRegime: rule.taxRegime,
        status: rule.status,
        cClassTrib: rule.cClassTrib,
        cst: rule.cst,
        pisRate: rule.pisRate,
        cofinsRate: rule.cofinsRate,
        icmsRate: rule.icmsRate,
        issRate: rule.issRate,
      },
    })
  })
})
