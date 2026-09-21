import { randomUUID } from 'node:crypto'
import { Decimal } from '@prisma/client/runtime/library'
import type {
  TaxCalculatorInput,
  TaxCalculatorItemInput,
  TaxCalculatorLogger,
  ReformTaxCalculatorResult,
} from './tax-calculator.types.js'
import {
  TaxCalculatorResponseValidationError,
  TaxCalculatorUnavailableError,
} from './tax-calculator.types.js'
import { mapRfbResponseToReformResult } from './tax-calculator.mapper.js'
import { rfbCalculatorResponseSchema } from './tax-calculator.schema.js'

const TAX_CALCULATOR_URL =
  process.env.TAX_CALCULATOR_STANDARD_URL ?? 'http://tax-calculator:8080/api'

interface CircuitBreakerState {
  failures: number
  lastFailureTime: number | null
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN'
}

const circuitBreaker: CircuitBreakerState = {
  failures: 0,
  lastFailureTime: null,
  state: 'CLOSED',
}

const FAILURE_THRESHOLD = 5
const FAILURE_WINDOW_MS = 60_000
const OPEN_DURATION_MS = 30_000

function checkCircuitBreaker(): void {
  const now = Date.now()

  if (circuitBreaker.state === 'OPEN') {
    if (
      circuitBreaker.lastFailureTime !== null &&
      now - circuitBreaker.lastFailureTime > OPEN_DURATION_MS
    ) {
      circuitBreaker.state = 'HALF_OPEN'
      circuitBreaker.failures = 0
    } else {
      throw new TaxCalculatorUnavailableError()
    }
  }
}

function recordSuccess(): void {
  circuitBreaker.state = 'CLOSED'
  circuitBreaker.failures = 0
  circuitBreaker.lastFailureTime = null
}

function recordFailure(): void {
  const now = Date.now()

  if (circuitBreaker.state === 'HALF_OPEN') {
    circuitBreaker.state = 'OPEN'
    circuitBreaker.failures = FAILURE_THRESHOLD
    circuitBreaker.lastFailureTime = now
    return
  }

  if (
    circuitBreaker.lastFailureTime === null ||
    now - circuitBreaker.lastFailureTime > FAILURE_WINDOW_MS
  ) {
    circuitBreaker.failures = 0
  }

  circuitBreaker.failures += 1
  circuitBreaker.lastFailureTime = now

  if (circuitBreaker.failures >= FAILURE_THRESHOLD) {
    circuitBreaker.state = 'OPEN'
  }
}

export async function calculateReformModel(
  input: TaxCalculatorInput,
  originalItems: Array<{ ncmCode: string; quantity: number; unitPrice: string }>,
  logger?: TaxCalculatorLogger,
): Promise<ReformTaxCalculatorResult> {
  checkCircuitBreaker()

  try {
    const response = await fetch(`${TAX_CALCULATOR_URL}/calculadora/regime-geral`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })

    if (!response.ok) {
      recordFailure()
      logger?.error(
        {
          event: 'tax_calculator_http_error',
          status: response.status,
          expectedItemCount: input.itens.length,
        },
        'Tax calculator request failed',
      )
      throw new TaxCalculatorUnavailableError()
    }

    const rawResponse: unknown = await response.json()
    const parseResult = rfbCalculatorResponseSchema.safeParse(rawResponse)

    if (!parseResult.success) {
      recordFailure()
      logger?.error(
        {
          event: 'tax_calculator_response_schema_invalid',
          expectedItemCount: input.itens.length,
          issuePaths: parseResult.error.issues.map((issue) => issue.path.join('.')).slice(0, 20),
          issueCodes: parseResult.error.issues.map((issue) => issue.code).slice(0, 20),
        },
        'Tax calculator returned an incompatible response',
      )
      throw new TaxCalculatorUnavailableError()
    }

    const result = mapRfbResponseToReformResult(parseResult.data, input, originalItems)

    recordSuccess()
    return result
  } catch (error) {
    if (error instanceof TaxCalculatorUnavailableError) {
      throw error
    }

    recordFailure()
    if (error instanceof TaxCalculatorResponseValidationError) {
      logger?.error(
        {
          event: error.event,
          ...error.safeContext,
        },
        'Tax calculator returned an incompatible response',
      )
    } else {
      logger?.error(
        {
          event: 'tax_calculator_request_failed',
          expectedItemCount: input.itens.length,
          errorType: error instanceof Error ? error.name : 'UnknownError',
        },
        'Tax calculator request failed',
      )
    }

    throw new TaxCalculatorUnavailableError()
  }
}

function formatRfbDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const offset = -date.getTimezoneOffset()
  const offsetHours = pad(Math.floor(Math.abs(offset) / 60))
  const offsetMinutes = pad(Math.abs(offset) % 60)
  const offsetSign = offset >= 0 ? '+' : '-'
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${offsetSign}${offsetHours}:${offsetMinutes}`
}

export function buildOperacaoInput(
  items: Array<{
    ncmCode: string
    cClassTrib: string
    cst: string
    quantity: number
    unitPrice: string
  }>,
  municipio: number,
  uf: string,
): TaxCalculatorInput {
  const dhFatoGerador = formatRfbDate(new Date())

  return {
    id: randomUUID().replace(/-/g, ''),
    versao: '0.0.1',
    dhFatoGerador,
    municipio,
    uf,
    itens: items.map((item, index): TaxCalculatorItemInput => {
      const baseCalculo = Number(new Decimal(item.unitPrice).mul(item.quantity).toFixed(2))

      return {
        numero: index + 1,
        ncm: item.ncmCode,
        cst: item.cst,
        cClassTrib: item.cClassTrib,
        baseCalculo,
        quantidade: item.quantity,
      }
    }),
  }
}
