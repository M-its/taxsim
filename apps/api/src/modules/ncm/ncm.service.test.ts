import { describe, expect, it } from 'vitest'
import { buildNcmDiagnoses, normalizeNcmSearchText } from './ncm.service.js'

const eligibilityDate = new Date('2026-09-25T00:00:00.000Z')

describe('NCM diagnosis', () => {
  it('distinguishes all user-facing NCM states', () => {
    const diagnoses = buildNcmDiagnoses(
      ['123', '00000000', '11111111', '22222222', '33333333', '44444444'],
      [
        {
          code: '11111111',
          description: 'Expirado',
          validFrom: new Date('2020-01-01T00:00:00.000Z'),
          validUntil: new Date('2025-12-31T00:00:00.000Z'),
        },
        {
          code: '22222222',
          description: 'Sem regra',
          validFrom: new Date('2026-01-01T00:00:00.000Z'),
          validUntil: new Date('9999-12-31T00:00:00.000Z'),
        },
        {
          code: '33333333',
          description: 'Configuracao incompleta',
          validFrom: new Date('2026-01-01T00:00:00.000Z'),
          validUntil: new Date('9999-12-31T00:00:00.000Z'),
        },
        {
          code: '44444444',
          description: 'Elegivel',
          validFrom: new Date('2026-01-01T00:00:00.000Z'),
          validUntil: new Date('9999-12-31T00:00:00.000Z'),
        },
      ],
      [
        { ncmCode: '33333333', cst: '', cClassTrib: '000001' },
        { ncmCode: '44444444', cst: '000', cClassTrib: '000001' },
      ],
      eligibilityDate,
    )

    expect(diagnoses.map(({ status }) => status)).toEqual([
      'INVALID_FORMAT',
      'NOT_FOUND',
      'NOT_CURRENT',
      'NO_ACTIVE_RULE',
      'CONFIGURATION_UNAVAILABLE',
      'ELIGIBLE',
    ])
  })

  it('normalizes case and accents without fuzzy matching', () => {
    expect(normalizeNcmSearchText('  Máquinas E Aparelhos  ')).toBe('maquinas e aparelhos')
    expect(normalizeNcmSearchText('maqunas')).toBe('maqunas')
  })
})
