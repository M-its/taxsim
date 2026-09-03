import { describe, it, expect, vi, beforeEach } from 'vitest'
import Fastify, { type FastifyInstance } from 'fastify'
import jwt from '@fastify/jwt'
import cookie from '@fastify/cookie'
import { authRoutes } from './auth.routes.js'

vi.mock('./auth.service.js', () => ({
  register: vi.fn(),
  login: vi.fn(),
  refresh: vi.fn(),
  logout: vi.fn(),
  logoutAll: vi.fn(),
  me: vi.fn(),
}))

import { login, logout, register } from './auth.service.js'

function extractCookiePath(setCookieHeader: string): string | undefined {
  const match = setCookieHeader.match(/Path=([^;]+)/i)
  return match?.[1]
}

describe('auth routes', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    vi.clearAllMocks()
    app = Fastify()
    await app.register(jwt, { secret: 'test-secret' })
    await app.register(cookie)
    await app.register(authRoutes, { prefix: '/auth' })
    await app.ready()
  })

  it('issues the refresh cookie scoped to /auth, not /auth/refresh', async () => {
    vi.mocked(login).mockResolvedValue({
      user: { id: 'u1', name: 'Test', email: 't@t.com', role: 'OWNER', companyId: 'c1' },
      tokens: { accessToken: 'access-token', refreshToken: 'refresh-token' },
    } as never)

    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 't@t.com', password: 'password123' },
    })

    const setCookie = response.headers['set-cookie']
    const cookieHeader = Array.isArray(setCookie) ? setCookie[0] : setCookie
    expect(cookieHeader).toBeDefined()
    expect(extractCookiePath(cookieHeader as string)).toBe('/auth')
    expect(extractCookiePath(cookieHeader as string)).not.toBe('/auth/refresh')
  })

  it('logout revokes the token on the server when the cookie is present', async () => {
    vi.mocked(logout).mockResolvedValue(undefined)

    const response = await app.inject({
      method: 'POST',
      url: '/auth/logout',
      cookies: { refreshToken: 'refresh-token' },
    })

    expect(response.statusCode).toBe(204)
    expect(logout).toHaveBeenCalledWith('refresh-token')
  })

  it('logout clears the cookie using the same /auth path it was set with', async () => {
    vi.mocked(logout).mockResolvedValue(undefined)

    const response = await app.inject({
      method: 'POST',
      url: '/auth/logout',
      cookies: { refreshToken: 'refresh-token' },
    })

    const setCookie = response.headers['set-cookie']
    const cookieHeader = Array.isArray(setCookie) ? setCookie[0] : setCookie
    expect(extractCookiePath(cookieHeader as string)).toBe('/auth')
  })

  it('blocks the sixth login attempt from the same IP for one minute', async () => {
    vi.mocked(login).mockResolvedValue({
      user: {
        id: 'u1',
        name: 'Test',
        email: 't@t.com',
        role: 'OWNER',
        companyId: 'c1',
      },
      tokens: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      },
    } as never)

    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email: 't@t.com', password: 'password123' },
      })
      expect(response.statusCode).toBe(200)
    }

    const blocked = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 't@t.com', password: 'password123' },
    })

    expect(blocked.statusCode).toBe(429)
    expect(blocked.headers['retry-after']).toBeDefined()
    expect(blocked.json()).toMatchObject({
      statusCode: 429,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
      },
    })
    expect(blocked.json().error.message).toMatch(/Try again in .+\./)
    expect(login).toHaveBeenCalledTimes(5)
  })

  it('blocks the sixth registration attempt from the same IP for one minute', async () => {
    vi.mocked(register).mockResolvedValue({
      user: {
        id: 'u1',
        name: 'Test',
        email: 't@t.com',
        role: 'OWNER',
      },
      company: {
        id: 'c1',
        name: 'Test Company',
        document: '12345678000199',
        taxRegime: 'SIMPLES_NACIONAL',
        municipioCode: 4314902,
        uf: 'RS',
      },
      tokens: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      },
    } as never)

    const payload = {
      company: {
        name: 'Test Company',
        document: '12345678000199',
        taxRegime: 'SIMPLES_NACIONAL',
        municipioCode: 4314902,
        uf: 'RS',
      },
      user: {
        name: 'Test',
        email: 't@t.com',
        password: 'password123',
      },
    }

    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload,
      })
      expect(response.statusCode).toBe(200)
    }

    const blocked = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload,
    })

    expect(blocked.statusCode).toBe(429)
    expect(blocked.headers['retry-after']).toBeDefined()
    expect(blocked.json().error.code).toBe('RATE_LIMIT_EXCEEDED')
    expect(register).toHaveBeenCalledTimes(5)
  })
})
