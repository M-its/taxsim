import { describe, expect, it } from 'vitest'
import { registerSchema } from './auth.schema.js'

const validRegistration = {
  company: {
    name: 'Empresa',
    document: '04.252.011/0001-10',
    taxRegime: 'SIMPLES_NACIONAL' as const,
    municipioCode: 3550308,
    uf: 'SP',
  },
  user: {
    name: 'Usuário',
    email: 'usuario@example.com',
    password: 'password123',
  },
}

describe('registerSchema CNPJ', () => {
  it('normalizes numeric and alphanumeric CNPJs before persistence', () => {
    expect(registerSchema.parse(validRegistration).company.document).toBe('04252011000110')
    expect(
      registerSchema.parse({
        ...validRegistration,
        company: { ...validRegistration.company, document: '00.000.000/e08g-12' },
      }).company.document,
    ).toBe('00000000E08G12')
  })

  it.each(['12.ABC.345/01D!-35', '12.ABC.345/01DE-34'])(
    'uses the same public error for invalid CNPJ %s',
    (document) => {
      const result = registerSchema.safeParse({
        ...validRegistration,
        company: { ...validRegistration.company, document },
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('CNPJ inválido')
      }
    },
  )
})
