import { Decimal } from '@prisma/client/runtime/library'

export const formatDecimal = (value: Decimal): string =>
  value.toFixed(2)
