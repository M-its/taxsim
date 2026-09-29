import { AppError } from '../../shared/errors/AppError.js'

export interface TaxEligibilityItem {
  ncmCode: string
}

export interface TaxEligibilityRule {
  ncmCode: string
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
  cst: string
  cClassTrib: string
}

export interface TaxEligibilityIssue {
  itemIndex: number
  ncmCode: string
  reason: 'INVALID_FORMAT' | 'NCM_NOT_FOUND' | 'NCM_NOT_CURRENT' | 'NO_ACTIVE_RULE'
  details: string
}

interface AssertTaxItemsEligibleInput {
  items: TaxEligibilityItem[]
  catalogNcmCodes: Iterable<string>
  currentNcmCodes: Iterable<string>
  taxRules: TaxEligibilityRule[]
  taxRegime: string
}

/**
 * Validates every item before any local or RFB tax calculation.
 *
 * The catalog query supplies terminal NCMs that are current on the calculation
 * date. Rules are filtered again in memory so an ARCHIVED rule can never become
 * eligible even if a caller accidentally supplies it.
 */
export function assertTaxItemsEligible({
  items,
  catalogNcmCodes,
  currentNcmCodes,
  taxRules,
  taxRegime,
}: AssertTaxItemsEligibleInput): void {
  const catalogCodes = new Set(catalogNcmCodes)
  const currentCodes = new Set(currentNcmCodes)
  const activeRules = new Map(
    taxRules
      .filter((rule) => rule.status === 'ACTIVE')
      .map((rule) => [rule.ncmCode, rule] as const),
  )

  const issues: TaxEligibilityIssue[] = []
  let hasConfigurationFailure = false

  items.forEach((item, itemIndex) => {
    if (!/^\d{8}$/.test(item.ncmCode)) {
      issues.push({
        itemIndex,
        ncmCode: item.ncmCode,
        reason: 'INVALID_FORMAT',
        details: 'NCM deve conter exatamente 8 dígitos',
      })
      return
    }

    if (!catalogCodes.has(item.ncmCode)) {
      issues.push({
        itemIndex,
        ncmCode: item.ncmCode,
        reason: 'NCM_NOT_FOUND',
        details: 'NCM não encontrado no catálogo',
      })
      return
    }

    if (!currentCodes.has(item.ncmCode)) {
      issues.push({
        itemIndex,
        ncmCode: item.ncmCode,
        reason: 'NCM_NOT_CURRENT',
        details: 'NCM não é terminal vigente',
      })
      return
    }

    const rule = activeRules.get(item.ncmCode)
    if (!rule) {
      issues.push({
        itemIndex,
        ncmCode: item.ncmCode,
        reason: 'NO_ACTIVE_RULE',
        details: `Não existe regra fiscal ativa para o regime ${taxRegime}`,
      })
      return
    }

    if (!/^\d{3}$/.test(rule.cst) || !/^\d{6}$/.test(rule.cClassTrib)) {
      hasConfigurationFailure = true
    }
  })

  if (hasConfigurationFailure) {
    throw new AppError(
      'TAX_CONFIGURATION_UNAVAILABLE',
      'A configuração fiscal está temporariamente indisponível',
      503,
    )
  }

  if (issues.length > 0) {
    const message =
      issues.length === 1
        ? 'Um item possui NCM não elegível para simulação'
        : `${issues.length} itens possuem NCM não elegível para simulação`

    throw new AppError('NCM_NOT_ELIGIBLE', message, 422, { issues })
  }
}
