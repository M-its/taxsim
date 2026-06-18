export function formatCurrency(value: number | string): string {
  const numeric = typeof value === "string" ? parseFloat(value) : value
  if (Number.isNaN(numeric)) return "R$ 0,00"

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numeric)
}

export function formatCurrencyCompact(value: number | string): string {
  const numeric = typeof value === "string" ? parseFloat(value) : value
  if (Number.isNaN(numeric)) return "R$ 0"

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(numeric)
}

function formatPercentValue(numeric: number, minimumFractionDigits: number, maximumFractionDigits: number): string {
  // API can return percentages either as ratios (e.g. 0.0765) or as
  // percentage-points (e.g. -57.08). We treat values outside (-1, 1) as
  // already percentage-points and only append the sign.
  const ratio = Math.abs(numeric) >= 1 ? numeric / 100 : numeric
  const percent = ratio * 100

  return `${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(percent)}%`
}

export function formatPercent(value: number | string): string {
  const numeric = typeof value === "string" ? parseFloat(value) : value
  if (Number.isNaN(numeric)) return "0,00%"

  return formatPercentValue(numeric, 2, 2)
}

export function formatPercentCompact(value: number | string): string {
  const numeric = typeof value === "string" ? parseFloat(value) : value
  if (Number.isNaN(numeric)) return "0%"

  return formatPercentValue(numeric, 1, 1)
}

export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return "-"

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)
}
