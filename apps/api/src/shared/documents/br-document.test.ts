import { describe, expect, it } from 'vitest'
import {
  normalizeCnpj,
  normalizeDocumentSearch,
  publicDocumentErrorMessage,
  validateBrazilianDocument,
  validateCnpj,
  validateCpf,
} from './br-document.js'

describe('Brazilian document helpers', () => {
  it('keeps a valid numeric CNPJ compatible with the official check digits', () => {
    expect(validateCnpj('04.252.011/0001-10')).toEqual({
      valid: true,
      normalized: '04252011000110',
    })
  })

  it('validates the official alphanumeric CNPJ example case-insensitively', () => {
    expect(validateCnpj('12.abc.345/01de-35')).toEqual({
      valid: true,
      normalized: '12ABC34501DE35',
    })
    expect(validateCnpj('00.000.000/e08g-12')).toEqual({
      valid: true,
      normalized: '00000000E08G12',
    })
  })

  it('distinguishes format failures from check-digit failures internally', () => {
    expect(validateCnpj('12.ABC.345/01D!-35')).toMatchObject({
      valid: false,
      reason: 'FORMAT',
    })
    expect(validateCnpj('12.ABC.345/01DE-34')).toMatchObject({
      valid: false,
      reason: 'CHECK_DIGITS',
    })
  })

  it('keeps CPF numeric-only and validates its check digits', () => {
    expect(validateCpf('529.982.247-25')).toEqual({
      valid: true,
      normalized: '52998224725',
    })
    expect(validateBrazilianDocument('529A98224725')).toMatchObject({
      kind: 'CNPJ',
      valid: false,
      reason: 'FORMAT',
    })
  })

  it('normalizes masks, spaces, lowercase and document searches', () => {
    expect(normalizeCnpj(' 00.000.000/e08g-12 ')).toBe('00000000E08G12')
    expect(normalizeDocumentSearch(' 00.000.000/e08g-12 ')).toBe('00000000E08G12')
  })

  it('does not expose whether a CNPJ failed format or check digits', () => {
    expect(validateCnpj('12.ABC.345/01D!-35')).toMatchObject({ reason: 'FORMAT' })
    expect(validateCnpj('12.ABC.345/01DE-34')).toMatchObject({ reason: 'CHECK_DIGITS' })
    expect(publicDocumentErrorMessage('CNPJ')).toBe('CNPJ inválido')
  })
})
