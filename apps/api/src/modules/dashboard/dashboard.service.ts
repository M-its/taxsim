import { Decimal } from '@prisma/client/runtime/library'
import { prisma } from '../../lib/prisma.js'
import { formatDecimal } from '../../shared/formatters/decimal.js'
import type { DashboardKpis, DashboardSummaryResponse, TaxCompositionItem, TaxLoadMonth } from './dashboard.types.js'

interface YtdAggregateRow {
  currentTotal: Decimal | null
  reformTotal: Decimal | null
  projectedIbs: Decimal | null
  projectedCbs: Decimal | null
  projectedIs: Decimal | null
}

interface MonthlyAggregateRow {
  month: Date
  current: Decimal | null
  reform: Decimal | null
}

function toDecimal(value: Decimal | null | undefined): Decimal {
  if (value === null || value === undefined) {
    return new Decimal(0)
  }
  return value instanceof Decimal ? value : new Decimal(value)
}

export async function getDashboardSummary(
  companyId: string,
  referenceDate: Date = new Date(),
): Promise<DashboardSummaryResponse> {
  const [kpis, taxLoadByMonth] = await Promise.all([
    getYtdKpis(companyId, referenceDate),
    getMonthlyTaxLoad(companyId, referenceDate),
  ])

  return {
    kpis,
    taxLoadByMonth,
    taxComposition: buildTaxComposition(kpis),
  }
}

function getYtdStart(referenceDate: Date): Date {
  return new Date(Date.UTC(referenceDate.getUTCFullYear(), 0, 1))
}

function getRollingWindowStart(referenceDate: Date): Date {
  return new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth() - 5, 1))
}

function getRolling6Months(referenceDate: Date): Array<{ monthKey: string; start: Date }> {
  const months: Array<{ monthKey: string; start: Date }> = []

  for (let i = 5; i >= 0; i--) {
    const start = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth() - i, 1))
    months.push({
      monthKey: start.toISOString().slice(0, 7),
      start,
    })
  }

  return months
}

async function getYtdKpis(companyId: string, referenceDate: Date): Promise<DashboardKpis> {
  const ytdStart = getYtdStart(referenceDate)

  const rows = await prisma.$queryRaw<YtdAggregateRow[]>`
    SELECT
      COALESCE(SUM("totalPis" + "totalCofins" + "totalIcms" + "totalIss"), 0) AS currentTotal,
      COALESCE(SUM("totalIbs" + "totalCbs" + "totalIs"), 0) AS reformTotal,
      COALESCE(SUM("totalIbs"), 0) AS projectedIbs,
      COALESCE(SUM("totalCbs"), 0) AS projectedCbs,
      COALESCE(SUM("totalIs"), 0) AS projectedIs
    FROM sales
    WHERE "companyId" = ${companyId}::uuid
      AND status = 'CONFIRMED'
      AND "createdAt" >= ${ytdStart}::timestamptz
  `

  const row = rows[0]
  if (!row) {
    return {
      estimatedSavings: '0.00',
      estimatedSavingsPercent: '0.00',
      projectedIbs: '0.00',
      projectedCbs: '0.00',
      projectedIs: '0.00',
    }
  }

  const currentTotal = toDecimal(row.currentTotal)
  const reformTotal = toDecimal(row.reformTotal)
  const projectedIbs = toDecimal(row.projectedIbs)
  const projectedCbs = toDecimal(row.projectedCbs)
  const projectedIs = toDecimal(row.projectedIs)
  const savings = reformTotal.minus(currentTotal)
  const savingsPercent = currentTotal.eq(0)
    ? new Decimal(0)
    : savings.div(currentTotal).times(100)

  return {
    estimatedSavings: formatDecimal(savings),
    estimatedSavingsPercent: formatDecimal(savingsPercent),
    projectedIbs: formatDecimal(projectedIbs),
    projectedCbs: formatDecimal(projectedCbs),
    projectedIs: formatDecimal(projectedIs),
  }
}

async function getMonthlyTaxLoad(companyId: string, referenceDate: Date): Promise<TaxLoadMonth[]> {
  const windowStart = getRollingWindowStart(referenceDate)

  const rows = await prisma.$queryRaw<MonthlyAggregateRow[]>`
    SELECT
      DATE_TRUNC('month', "createdAt") AS month,
      COALESCE(SUM("totalPis" + "totalCofins" + "totalIcms" + "totalIss"), 0) AS current,
      COALESCE(SUM("totalIbs" + "totalCbs" + "totalIs"), 0) AS reform
    FROM sales
    WHERE "companyId" = ${companyId}::uuid
      AND status = 'CONFIRMED'
      AND "createdAt" >= ${windowStart}::timestamptz
      AND "createdAt" <= ${referenceDate}::timestamptz
    GROUP BY DATE_TRUNC('month', "createdAt")
    ORDER BY DATE_TRUNC('month', "createdAt") ASC
  `

  const rowsByMonth = new Map(
    rows.map((row) => [row.month.toISOString().slice(0, 7), row]),
  )

  const expectedMonths = getRolling6Months(referenceDate)

  return expectedMonths.map(({ monthKey }) => {
    const row = rowsByMonth.get(monthKey)
    return {
      month: monthKey,
      current: row ? formatDecimal(toDecimal(row.current)) : '0.00',
      reform: row ? formatDecimal(toDecimal(row.reform)) : '0.00',
    }
  })
}

function buildTaxComposition(kpis: DashboardKpis): TaxCompositionItem[] {
  const ibs = new Decimal(kpis.projectedIbs)
  const cbs = new Decimal(kpis.projectedCbs)
  const isTax = new Decimal(kpis.projectedIs)
  const total = ibs.plus(cbs).plus(isTax)

  const formatPercent = (value: Decimal): string =>
    total.eq(0) ? '0.00' : value.div(total).times(100).toFixed(2)

  return [
    { name: 'IBS', value: formatPercent(ibs) },
    { name: 'CBS', value: formatPercent(cbs) },
    { name: 'IS', value: formatPercent(isTax) },
  ]
}
