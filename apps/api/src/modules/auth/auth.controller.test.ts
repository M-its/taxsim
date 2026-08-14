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

import { login, logout } from './auth.service.js'

function extractCookiePath(setCookieHeader: string): string | undefined {
  const match = setCookieHeader.match(/Path=([^;]+)/i)
  return match?.[1]
}

describe('auth cookie scope (Finding 8 - logout must be able to revoke the session)', () => {
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
})
