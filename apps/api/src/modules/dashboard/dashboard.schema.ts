import { z } from 'zod'

export const dashboardSummaryResponseSchema = z.object({
  kpis: z.object({
    estimatedSavings: z.string(),
    estimatedSavingsPercent: z.string(),
    projectedIbs: z.string(),
    projectedCbs: z.string(),
    projectedIs: z.string(),
  }),
  taxLoadByMonth: z.array(
    z.object({
      month: z.string(),
      current: z.string(),
      reform: z.string(),
    }),
  ),
  taxComposition: z.array(
    z.object({
      name: z.string(),
      value: z.string(),
    }),
  ),
})
