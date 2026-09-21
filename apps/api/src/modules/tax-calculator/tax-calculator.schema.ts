import { z } from 'zod'

const plainNonNegativeDecimalSchema = z
  .string()
  .regex(/^\d+(?:\.\d+)?$/, 'Expected a plain non-negative decimal string')

/**
 * The deployed calculator currently returns decimal strings, while the current
 * official OpenAPI describes numbers. Accept both representations at this
 * boundary and normalize them to strings for exact Decimal arithmetic.
 */
export const rfbDecimalSchema = z
  .union([z.number().finite().nonnegative(), plainNonNegativeDecimalSchema])
  .transform((value) => String(value))

const rfbTaxGroupSchema = z.object({
  gIBSUF: z.object({
    pIBSUF: rfbDecimalSchema,
  }),
  gIBSMun: z.object({
    pIBSMun: rfbDecimalSchema,
  }),
  vIBS: rfbDecimalSchema,
  gCBS: z.object({
    pCBS: rfbDecimalSchema,
    vCBS: rfbDecimalSchema,
  }),
  gTribRegular: z
    .object({
      pAliqEfetRegIBSUF: rfbDecimalSchema,
      pAliqEfetRegIBSMun: rfbDecimalSchema,
      pAliqEfetRegCBS: rfbDecimalSchema,
    })
    .optional(),
})

/**
 * Runtime projection of the RFB response consumed by TaxSim. Zod objects strip
 * unknown keys by default, so additive upstream fields remain compatible while
 * every field used by the mapper is still required and validated.
 */
export const rfbCalculatorResponseSchema = z.object({
  objetos: z
    .array(
      z.object({
        nObj: z.number().int().min(1).max(9_999_999),
        tribCalc: z.object({
          IBSCBS: z.object({
            gIBSCBS: rfbTaxGroupSchema,
          }),
        }),
      }),
    )
    .min(1),
  total: z.object({
    tribCalc: z.object({
      IBSCBSTot: z.object({
        gIBS: z.object({
          vIBS: rfbDecimalSchema,
        }),
        gCBS: z.object({
          vCBS: rfbDecimalSchema,
        }),
      }),
    }),
  }),
})

export type RfbCalculatorResponse = z.infer<typeof rfbCalculatorResponseSchema>
