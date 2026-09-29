import { describe, expect, it } from 'vitest'
import { AppError } from '../../shared/errors/AppError.js'
import { assertTaxItemsEligible, type TaxEligibilityRule } from './tax-eligibility.js'

const activeRule: TaxEligibilityRule = {
  ncmCode: '85171300',
  status: 'ACTIVE',
  cst: '000',
  cClassTrib: '000001',
}

describe('assertTaxItemsEligible', () => {
  it('accepts a current terminal NCM with an ACTIVE externally-classified rule', () => {
    expect(() =>
      assertTaxItemsEligible({
        items: [{ ncmCode: '85171300' }],
        catalogNcmCodes: ['85171300'],
        currentNcmCodes: ['85171300'],
        taxRules: [activeRule],
        taxRegime: 'LUCRO_REAL',
      }),
    ).not.toThrow()
  })

  it('returns every invalid item with its zero-based request index', () => {
    try {
      assertTaxItemsEligible({
        items: [{ ncmCode: '85171300' }, { ncmCode: '85171200' }, { ncmCode: '99999999' }],
        catalogNcmCodes: ['85171300', '85171200'],
        currentNcmCodes: ['85171300'],
        taxRules: [activeRule],
        taxRegime: 'LUCRO_REAL',
      })
      throw new Error('Expected eligibility validation to fail')
    } catch (error) {
      expect(error).toBeInstanceOf(AppError)
      expect(error).toMatchObject({
        code: 'NCM_NOT_ELIGIBLE',
        statusCode: 422,
        details: {
          issues: [
            {
              itemIndex: 1,
              ncmCode: '85171200',
              reason: 'NCM_NOT_CURRENT',
              details: 'NCM não é terminal vigente',
            },
            {
              itemIndex: 2,
              ncmCode: '99999999',
              reason: 'NCM_NOT_FOUND',
              details: 'NCM não encontrado no catálogo',
            },
          ],
        },
      })
    }
  })

  it('rejects a generic parent code that is not a current terminal NCM', () => {
    expect(() =>
      assertTaxItemsEligible({
        items: [{ ncmCode: '84715000' }],
        catalogNcmCodes: ['84715000', '84715010'],
        currentNcmCodes: ['84715010'],
        taxRules: [],
        taxRegime: 'LUCRO_REAL',
      }),
    ).toThrowError(
      expect.objectContaining({
        details: {
          issues: [
            {
              itemIndex: 0,
              ncmCode: '84715000',
              reason: 'NCM_NOT_CURRENT',
              details: 'NCM não é terminal vigente',
            },
          ],
        },
      }),
    )
  })

  it('rejects a code that does not exist in ncm_catalog', () => {
    expect(() =>
      assertTaxItemsEligible({
        items: [{ ncmCode: '00000000' }],
        catalogNcmCodes: [],
        currentNcmCodes: [],
        taxRules: [],
        taxRegime: 'LUCRO_REAL',
      }),
    ).toThrowError(
      expect.objectContaining({
        details: {
          issues: [
            expect.objectContaining({
              itemIndex: 0,
              ncmCode: '00000000',
              reason: 'NCM_NOT_FOUND',
              details: 'NCM não encontrado no catálogo',
            }),
          ],
        },
      }),
    )
  })

  it('rejects a current NCM without a rule for the selected regime', () => {
    expect(() =>
      assertTaxItemsEligible({
        items: [{ ncmCode: '85171300' }],
        catalogNcmCodes: ['85171300'],
        currentNcmCodes: ['85171300'],
        taxRules: [],
        taxRegime: 'LUCRO_PRESUMIDO',
      }),
    ).toThrowError(
      expect.objectContaining({
        details: {
          issues: [
            expect.objectContaining({
              itemIndex: 0,
              details: 'Não existe regra fiscal ativa para o regime LUCRO_PRESUMIDO',
            }),
          ],
        },
      }),
    )
  })

  it('never treats an ARCHIVED rule as eligible', () => {
    expect(() =>
      assertTaxItemsEligible({
        items: [{ ncmCode: '85171300' }],
        catalogNcmCodes: ['85171300'],
        currentNcmCodes: ['85171300'],
        taxRules: [{ ...activeRule, status: 'ARCHIVED' }],
        taxRegime: 'LUCRO_REAL',
      }),
    ).toThrowError(
      expect.objectContaining({
        code: 'NCM_NOT_ELIGIBLE',
        details: {
          issues: [
            expect.objectContaining({
              itemIndex: 0,
              details: 'Não existe regra fiscal ativa para o regime LUCRO_REAL',
            }),
          ],
        },
      }),
    )
  })

  it('rejects an ACTIVE rule without cClassTrib', () => {
    expect(() =>
      assertTaxItemsEligible({
        items: [{ ncmCode: '85171300' }],
        catalogNcmCodes: ['85171300'],
        currentNcmCodes: ['85171300'],
        taxRules: [{ ...activeRule, cClassTrib: '' }],
        taxRegime: 'LUCRO_REAL',
      }),
    ).toThrowError(
      expect.objectContaining({
        code: 'TAX_CONFIGURATION_UNAVAILABLE',
        statusCode: 503,
        message: 'A configuração fiscal está temporariamente indisponível',
      }),
    )
  })
  it('rejects an ACTIVE rule without cst', () => {
    expect(() =>
      assertTaxItemsEligible({
        items: [{ ncmCode: '85171300' }],
        catalogNcmCodes: ['85171300'],
        currentNcmCodes: ['85171300'],
        taxRules: [{ ...activeRule, cst: '' }],
        taxRegime: 'LUCRO_REAL',
      }),
    ).toThrowError(
      expect.objectContaining({
        code: 'TAX_CONFIGURATION_UNAVAILABLE',
        statusCode: 503,
        message: 'A configuração fiscal está temporariamente indisponível',
      }),
    )
  })
})
