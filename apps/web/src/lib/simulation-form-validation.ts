import type { NcmDiagnosis } from './api'
import { getNcmStatusMessage, isBlockingNcmStatus } from './ncm-eligibility'

export type SimulationValidationField = 'product' | 'ncm' | 'quantity' | 'unitPrice'

export interface SimulationValidationError {
  field: SimulationValidationField
  message: string
}

export interface ValidatableSimulationItem {
  id: string
  mode: 'catalog' | 'manual'
  ncmCode: string
  hasProduct: boolean
  quantity: string
  unitPrice: string
}

export function validateSimulationItems(
  items: ValidatableSimulationItem[],
  diagnosesByItem: Record<string, NcmDiagnosis | undefined> = {},
): Record<string, SimulationValidationError[]> {
  const errorsByItem: Record<string, SimulationValidationError[]> = {}

  for (const item of items) {
    const errors: SimulationValidationError[] = []
    const quantity = Number(item.quantity)

    if (!Number.isInteger(quantity) || quantity < 1) {
      errors.push({ field: 'quantity', message: 'Quantidade inválida.' })
    }

    if (item.mode === 'catalog' && !item.hasProduct) {
      errors.push({ field: 'product', message: 'Selecione um produto.' })
    }

    if (item.mode === 'manual') {
      if (!/^\d{8}$/.test(item.ncmCode)) {
        errors.push({ field: 'ncm', message: 'NCM deve conter exatamente 8 dígitos.' })
      }
      if (!Number.isFinite(Number(item.unitPrice)) || Number(item.unitPrice) <= 0) {
        errors.push({ field: 'unitPrice', message: 'Preço unitário inválido.' })
      }
    }

    const diagnosis = diagnosesByItem[item.id]
    if (
      diagnosis &&
      isBlockingNcmStatus(diagnosis.status) &&
      !errors.some((error) => error.field === 'ncm')
    ) {
      errors.push({
        field: item.mode === 'catalog' ? 'product' : 'ncm',
        message: getNcmStatusMessage(diagnosis.status),
      })
    }

    if (errors.length > 0) errorsByItem[item.id] = errors
  }

  return errorsByItem
}
