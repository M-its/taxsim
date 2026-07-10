import type { Prisma, TaxRegime, TaxRuleStatus } from '@prisma/client'

export interface TaxRuleSeed {
  ncmCode: string
  taxRegime: string
  pisRate: string
  cofinsRate: string
  icmsRate: string
  issRate: string
  cClassTrib: string
  cst: string
  status: string
}

type PrismaTaxRuleClient = {
  taxRule: {
    count(args?: { where?: Prisma.TaxRuleWhereInput }): Promise<number>
    upsert(args: Prisma.TaxRuleUpsertArgs): Promise<unknown>
  }
}

/**
 * Idempotently upserts tax rules into the global tax_rules table.
 * Works with both the main PrismaClient and a transaction client.
 */
export async function seedTaxRules(
  client: PrismaTaxRuleClient,
  rules: TaxRuleSeed[],
): Promise<number> {
  for (const rule of rules) {
    await client.taxRule.upsert({
      where: {
        ncmCode_taxRegime_status: {
          ncmCode: rule.ncmCode,
          taxRegime: rule.taxRegime as TaxRegime,
          status: rule.status as TaxRuleStatus,
        },
      },
      update: {},
      create: {
        ncmCode: rule.ncmCode,
        taxRegime: rule.taxRegime as TaxRegime,
        status: rule.status as TaxRuleStatus,
        cClassTrib: rule.cClassTrib,
        cst: rule.cst,
        pisRate: rule.pisRate,
        cofinsRate: rule.cofinsRate,
        icmsRate: rule.icmsRate,
        issRate: rule.issRate,
      },
    })
  }

  return rules.length
}

/**
 * Seeds global tax rules only when the table has no ACTIVE rows.
 * Used during the first company registration to bootstrap new deployments.
 */
export async function seedTaxRulesIfEmpty(client: PrismaTaxRuleClient): Promise<boolean> {
  const activeCount = await client.taxRule.count({ where: { status: 'ACTIVE' } })
  if (activeCount > 0) return false

  const dataPath = '../../prisma/data/tax-rules-data.js'
  const { default: rules } = (await import(dataPath)) as { default: TaxRuleSeed[] }

  await seedTaxRules(client, rules)
  return true
}
