import { describe, expect, it } from 'vitest'
import { assertProductionJwtSecret } from './auth-secrets.js'

describe('assertProductionJwtSecret', () => {
  it('rejects production startup without JWT_SECRET', () => {
    expect(() =>
      assertProductionJwtSecret({ NODE_ENV: 'production', JWT_SECRET: undefined }),
    ).toThrow('JWT_SECRET must be set in production. Refusing to start.')
  })

  it('accepts production startup with JWT_SECRET', () => {
    expect(() =>
      assertProductionJwtSecret({ NODE_ENV: 'production', JWT_SECRET: 'test-secret' }),
    ).not.toThrow()
  })

  it('keeps the development fallback available outside production', () => {
    expect(() =>
      assertProductionJwtSecret({ NODE_ENV: 'development', JWT_SECRET: undefined }),
    ).not.toThrow()
  })
})
