const SAO_PAULO_TIME_ZONE = 'America/Sao_Paulo'

const saoPauloDateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: SAO_PAULO_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  numberingSystem: 'latn',
})

/**
 * Returns the current São Paulo calendar date as a UTC-midnight marker.
 *
 * NCM validity columns are PostgreSQL DATE values. Prisma represents them as
 * Date objects, so the UTC marker preserves the intended calendar date without
 * treating local midnight as a UTC instant.
 */
export function ncmValidityDate(now: Date = new Date()): Date {
  const parts = saoPauloDateFormatter.formatToParts(now)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  return new Date(
    Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day),
    ),
  )
}
