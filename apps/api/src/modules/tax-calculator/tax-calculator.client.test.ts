import { describe, it, expect } from 'vitest'
import { buildOperacaoInput } from './tax-calculator.client'

describe('formatRfbDate (via buildOperacaoInput)', () => {
  it('gera dhFatoGerador no formato ISO 8601 com offset explícito (nunca com Z)', () => {
    const input = buildOperacaoInput(
      [
        {
          ncmCode: '84713012',
          cClassTrib: '000001',
          cst: '000',
          quantity: 1,
          unitPrice: '2500.00',
        },
      ],
      4314902,
      'RS',
    )
    expect(input.dhFatoGerador).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/)
    expect(input.dhFatoGerador).not.toContain('Z')
  })

  it('calcula baseCalculo corretamente a partir de unitPrice e quantity', () => {
    const input = buildOperacaoInput(
      [{ ncmCode: '61091000', cClassTrib: '000001', cst: '000', quantity: 10, unitPrice: '35.00' }],
      4314902,
      'RS',
    )
    expect(input.itens[0].baseCalculo).toBe(350)
  })
})
