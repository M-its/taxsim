import { describe, expect, it } from 'vitest'
import {
  formatCnpj,
  formatCpf,
  publicDocumentErrorMessage,
  sanitizeCnpjInput,
  validateCnpj,
  validateCpf,
} from './br-document'

describe('Brazilian document input helpers', () => {
  it('applies the numeric CNPJ mask progressively without losing input', () => {
    expect(
      ['0', '00', '000', '00000', '00000000', '000000000', '000000000000', '00000000000012'].map(
        formatCnpj,
      ),
    ).toEqual([
      '0',
      '00',
      '00.0',
      '00.000',
      '00.000.000',
      '00.000.000/0',
      '00.000.000/0000',
      '00.000.000/0000-12',
    ])
  })

  it('applies the alphanumeric CNPJ mask progressively and uppercases letters', () => {
    expect(formatCnpj('00.000.000/e')).toBe('00.000.000/E')
    expect(formatCnpj('00.000.000/e08g-12')).toBe('00.000.000/E08G-12')
    expect(sanitizeCnpjInput('00.000.000/e08g-12')).toBe('00000000E08G12')
  })

  it('keeps CPF numeric-only with a progressive mask', () => {
    expect(formatCpf('52998224725')).toBe('529.982.247-25')
    expect(formatCpf('529a982')).toBe('529.982')
  })

  it('validates official numeric and alphanumeric CNPJ check digits', () => {
    expect(validateCnpj('04.252.011/0001-10').valid).toBe(true)
    expect(validateCnpj('12.ABC.345/01DE-35').valid).toBe(true)
    expect(validateCnpj('00.000.000/E08G-12').valid).toBe(true)
    expect(validateCnpj('12.ABC.345/01DE-34')).toMatchObject({
      valid: false,
      reason: 'CHECK_DIGITS',
    })
  })

  it('validates CPF while rejecting letters', () => {
    expect(validateCpf('529.982.247-25').valid).toBe(true)
    expect(validateCpf('529A98224725')).toMatchObject({ valid: false, reason: 'FORMAT' })
  })

  it('uses one public CNPJ message for every internal validation reason', () => {
    expect(validateCnpj('12.ABC.345/01D!-35')).toMatchObject({ reason: 'FORMAT' })
    expect(validateCnpj('12.ABC.345/01DE-34')).toMatchObject({ reason: 'CHECK_DIGITS' })
    expect(publicDocumentErrorMessage('CNPJ')).toBe('CNPJ inválido')
  })
})
