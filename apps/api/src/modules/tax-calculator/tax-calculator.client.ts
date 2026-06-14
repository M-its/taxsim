import { randomUUID } from 'node:crypto'
import { Decimal } from '@prisma/client/runtime/library'
import type {
  TaxCalculatorInput,
  TaxCalculatorItemInput,
  ReformTaxCalculatorResult,
} from './tax-calculator.types.js'
import { TaxCalculatorUnavailableError } from './tax-calculator.types.js'
import { mapRfbResponseToReformResult } from './tax-calculator.mapper.js'

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
      circuitBreaker.lastFailureTime &&
      now - circuitBreaker.lastFailureTime > OPEN_DURATION_MS
    ) {
      circuitBreaker.state = 'HALF_OPEN'
      circuitBreaker.failures = 0
    } else {
      throw new TaxCalculatorUnavailableError()
    }
  }

  if (circuitBreaker.state === 'HALF_OPEN') {
    // Allow one request through
  }

  // Clean old failures outside window
  if (
    circuitBreaker.lastFailureTime &&
    now - circuitBreaker.lastFailureTime > FAILURE_WINDOW_MS
  ) {
    circuitBreaker.failures = 0
  }
}

function recordSuccess(): void {
  circuitBreaker.state = 'CLOSED'
  circuitBreaker.failures = 0
  circuitBreaker.lastFailureTime = null
}

function recordFailure(): void {
  circuitBreaker.failures++
  circuitBreaker.lastFailureTime = Date.now()

  if (circuitBreaker.failures >= FAILURE_THRESHOLD) {
    circuitBreaker.state = 'OPEN'
  }
}

export async function calculateReformModel(
  input: TaxCalculatorInput,
  originalItems: Array<{ ncmCode: string; quantity: number; unitPrice: string }>,
): Promise<ReformTaxCalculatorResult> {
  checkCircuitBreaker()

  try {
    const response = await fetch(`${TAX_CALCULATOR_URL}/calculadora`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      recordFailure()
      throw new TaxCalculatorUnavailableError(
        `RFB calculator returned ${response.status}: ${errorBody}`,
      )
    }

    const rfbResponse = (await response.json()) as {
      objetos: unknown[]
      total: unknown
    }

    recordSuccess()

    return mapRfbResponseToReformResult(
      rfbResponse as { objetos: unknown[]; total: unknown },
      originalItems,
    )
  } catch (error) {
    if (error instanceof TaxCalculatorUnavailableError) {
      throw error
    }

    recordFailure()
    throw new TaxCalculatorUnavailableError(
      error instanceof Error ? error.message : 'Unknown error',
    )
  }
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
  const dhFatoGerador = new Date().toISOString()

  return {
    id: randomUUID().replace(/-/g, ''),
    versao: '0.0.1',
    dhFatoGerador,
    municipio,
    uf,
    itens: items.map((item, index): TaxCalculatorItemInput => {
      const baseCalculo = Number(
        new Decimal(item.unitPrice).mul(item.quantity).toFixed(2),
      )

      return {
        numero: index + 1,
        ncm: item.ncmCode,
        cst: item.cst,
        cClassTrib: item.cClassTrib,
        baseCalculo,
        quantidade: item.quantity,
        unidade: 'UN',
      }
    }),
  }
}
