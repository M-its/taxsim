import { Prisma, type TaxRegime } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { ncmValidityDate } from '../sales/ncm-validity-date.js'

export const NCM_CATALOG_VERSION = '2026-07-10'

export type NcmEligibilityStatus =
  | 'ELIGIBLE'
  | 'INVALID_FORMAT'
  | 'NOT_FOUND'
  | 'NOT_CURRENT'
  | 'NO_ACTIVE_RULE'
  | 'CONFIGURATION_UNAVAILABLE'

export interface NcmDiagnosis {
  code: string
  description: string | null
  status: NcmEligibilityStatus
}

export interface NcmSearchResult {
  code: string
  description: string
  status: Extract<NcmEligibilityStatus, 'ELIGIBLE' | 'NO_ACTIVE_RULE' | 'CONFIGURATION_UNAVAILABLE'>
}

interface CatalogEntry {
  code: string
  description: string
  validFrom: Date
  validUntil: Date
}

interface EligibilityRule {
  ncmCode: string
  cst: string
  cClassTrib: string
}

const ACCENTED_CHARACTERS = 'áàâãäéèêëíìîïóòôõöúùûüç'
const PLAIN_CHARACTERS = 'aaaaaeeeeiiiiooooouuuuc'

export function normalizeNcmSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim()
}

function hasCalculatorClassification(rule: EligibilityRule): boolean {
  return /^\d{3}$/.test(rule.cst) && /^\d{6}$/.test(rule.cClassTrib)
}

export function buildNcmDiagnoses(
  codes: string[],
  catalogEntries: CatalogEntry[],
  rules: EligibilityRule[],
  eligibilityDate: Date,
): NcmDiagnosis[] {
  const catalogByCode = new Map(catalogEntries.map((entry) => [entry.code, entry]))
  const rulesByCode = new Map(rules.map((rule) => [rule.ncmCode, rule]))
  const eligibilityTime = eligibilityDate.getTime()

  return codes.map((code) => {
    if (!/^\d{8}$/.test(code)) {
      return { code, description: null, status: 'INVALID_FORMAT' }
    }

    const catalogEntry = catalogByCode.get(code)
    if (!catalogEntry) {
      return { code, description: null, status: 'NOT_FOUND' }
    }

    const isCurrent =
      catalogEntry.validFrom.getTime() <= eligibilityTime &&
      catalogEntry.validUntil.getTime() >= eligibilityTime
    if (!isCurrent) {
      return {
        code,
        description: catalogEntry.description,
        status: 'NOT_CURRENT',
      }
    }

    const rule = rulesByCode.get(code)
    if (!rule) {
      return {
        code,
        description: catalogEntry.description,
        status: 'NO_ACTIVE_RULE',
      }
    }

    return {
      code,
      description: catalogEntry.description,
      status: hasCalculatorClassification(rule) ? 'ELIGIBLE' : 'CONFIGURATION_UNAVAILABLE',
    }
  })
}

export async function diagnoseNcmCodes(
  codes: string[],
  taxRegime: TaxRegime,
): Promise<NcmDiagnosis[]> {
  const uniqueCodes = [...new Set(codes)]
  const validCodes = uniqueCodes.filter((code) => /^\d{8}$/.test(code))

  const [catalogEntries, rules] = await Promise.all([
    prisma.ncmCatalog.findMany({
      where: { code: { in: validCodes } },
      select: {
        code: true,
        description: true,
        validFrom: true,
        validUntil: true,
      },
    }),
    prisma.taxRule.findMany({
      where: {
        ncmCode: { in: validCodes },
        taxRegime,
        status: 'ACTIVE',
      },
      select: {
        ncmCode: true,
        cst: true,
        cClassTrib: true,
      },
    }),
  ])

  const diagnosesByCode = new Map(
    buildNcmDiagnoses(uniqueCodes, catalogEntries, rules, ncmValidityDate()).map((diagnosis) => [
      diagnosis.code,
      diagnosis,
    ]),
  )

  return codes.map(
    (code) =>
      diagnosesByCode.get(code) ?? {
        code,
        description: null,
        status: 'NOT_FOUND',
      },
  )
}

export async function searchCurrentNcms(
  query: string,
  taxRegime: TaxRegime,
): Promise<NcmSearchResult[]> {
  const normalizedQuery = normalizeNcmSearchText(query)
  const codePrefix = query.replace(/\D/g, '')
  const eligibilityDate = ncmValidityDate()

  return prisma.$queryRaw<NcmSearchResult[]>(Prisma.sql`
    SELECT
      catalog."code",
      catalog."description",
      CASE
        WHEN rule."id" IS NULL THEN 'NO_ACTIVE_RULE'
        WHEN rule."cst" ~ '^[0-9]{3}$'
          AND rule."cClassTrib" ~ '^[0-9]{6}$' THEN 'ELIGIBLE'
        ELSE 'CONFIGURATION_UNAVAILABLE'
      END AS "status"
    FROM "ncm_catalog" AS catalog
    LEFT JOIN "tax_rules" AS rule
      ON rule."ncmCode" = catalog."code"
      AND rule."taxRegime"::text = ${taxRegime}
      AND rule."status"::text = 'ACTIVE'
    WHERE catalog."validFrom" <= ${eligibilityDate}
      AND catalog."validUntil" >= ${eligibilityDate}
      AND (
        (${codePrefix} <> '' AND catalog."code" LIKE ${`${codePrefix}%`})
        OR position(
          ${normalizedQuery}
          IN translate(lower(catalog."description"), ${ACCENTED_CHARACTERS}, ${PLAIN_CHARACTERS})
        ) > 0
      )
    ORDER BY
      CASE
        WHEN rule."id" IS NOT NULL
          AND rule."cst" ~ '^[0-9]{3}$'
          AND rule."cClassTrib" ~ '^[0-9]{6}$' THEN 0
        ELSE 1
      END,
      catalog."code" ASC
    LIMIT 10
  `)
}
