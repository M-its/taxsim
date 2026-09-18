import { createHmac } from 'node:crypto'
import { afterEach, describe, expect, it } from 'vitest'
import { generateRawRefreshToken, hashRefreshToken } from './refresh-token.util.js'

const originalPepper = process.env.REFRESH_TOKEN_PEPPER

afterEach(() => {
  if (originalPepper === undefined) {
    delete process.env.REFRESH_TOKEN_PEPPER
    return
  }
  process.env.REFRESH_TOKEN_PEPPER = originalPepper
})

describe('refresh token utilities', () => {
  it('generates a random 256-bit token encoded as hex', () => {
    const first = generateRawRefreshToken()
    const second = generateRawRefreshToken()

    expect(first).toMatch(/^[a-f0-9]{64}$/)
    expect(second).toMatch(/^[a-f0-9]{64}$/)
    expect(second).not.toBe(first)
  })

  it('hashes the complete token with HMAC-SHA-256 and the configured pepper', () => {
    process.env.REFRESH_TOKEN_PEPPER = 'test-pepper'

    expect(hashRefreshToken('raw-refresh-token')).toBe(
      createHmac('sha256', 'test-pepper').update('raw-refresh-token').digest('hex'),
    )
  })

  it('fails immediately when REFRESH_TOKEN_PEPPER is missing', () => {
    delete process.env.REFRESH_TOKEN_PEPPER

    expect(() => hashRefreshToken('raw-refresh-token')).toThrow(
      'REFRESH_TOKEN_PEPPER must be set',
    )
  })
})
