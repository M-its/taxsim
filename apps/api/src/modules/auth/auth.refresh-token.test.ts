import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Fastify, { type FastifyInstance } from 'fastify'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'

type StoredRefreshToken = {
  id: string
  userId: string
  tokenHash: string
  expiresAt: Date
  revokedAt: Date | null
  createdAt: Date
  user: {
    id: string
    companyId: string
    role: 'OWNER'
  }
}

const authDb = vi.hoisted(() => {
  const rows: StoredRefreshToken[] = []
  let nextId = 1

  const refreshToken = {
    create: vi.fn(
      async ({
        data,
      }: {
        data: Omit<StoredRefreshToken, 'id' | 'createdAt' | 'revokedAt' | 'user'>
      }) => {
        const row: StoredRefreshToken = {
          id: `refresh-${nextId++}`,
          ...data,
          revokedAt: null,
          createdAt: new Date(),
          user: {
            id: data.userId,
            companyId: 'company-1',
            role: 'OWNER',
          },
        }
        rows.push(row)
        return row
      },
    ),
    findUnique: vi.fn(async ({ where }: { where: { tokenHash: string } }) => {
      return rows.find((row) => row.tokenHash === where.tokenHash) ?? null
    }),
    updateMany: vi.fn(
      async ({
        where,
        data,
      }: {
        where: { id?: string; tokenHash?: string; revokedAt: null }
        data: { revokedAt: Date }
      }) => {
        let count = 0
        for (const row of rows) {
          if (where.id !== undefined && row.id !== where.id) continue
          if (where.tokenHash !== undefined && row.tokenHash !== where.tokenHash) continue
          if (row.revokedAt !== where.revokedAt) continue
          row.revokedAt = data.revokedAt
          count += 1
        }
        return { count }
      },
    ),
    deleteMany: vi.fn(async ({ where }: { where: { userId: string } }) => {
      let count = 0
      for (let index = rows.length - 1; index >= 0; index -= 1) {
        if (rows[index].userId === where.userId) {
          rows.splice(index, 1)
          count += 1
        }
      }
      return { count }
    }),
  }

  return {
    rows,
    refreshToken,
    reset: () => {
      rows.splice(0)
      nextId = 1
    },
  }
})

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    refreshToken: authDb.refreshToken,
    $transaction: vi.fn(async (callback) => {
      return callback({ refreshToken: authDb.refreshToken })
    }),
  },
}))

import { errorHandlerPlugin } from '../../shared/errors/errorHandler.js'
import { authRoutes } from './auth.routes.js'
import { generateTokens } from './auth.service.js'

const user = {
  id: 'user-1',
  companyId: 'company-1',
  role: 'OWNER' as const,
}

const refreshTokenFromResponse = (response: {
  headers: Record<string, string | string[] | number | undefined>
}): string => {
  const header = response.headers['set-cookie']
  const cookieHeader = Array.isArray(header) ? header[0] : header
  if (typeof cookieHeader !== 'string') throw new Error('Refresh token cookie was not returned')
  const match = cookieHeader?.match(/^refreshToken=([^;]+)/)
  if (!match) throw new Error('Refresh token cookie was not returned')
  return decodeURIComponent(match[1])
}

describe('refresh token rotation', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    process.env.REFRESH_TOKEN_PEPPER = 'test-only-refresh-token-pepper'
    authDb.reset()
    vi.clearAllMocks()

    app = Fastify()
    await app.register(jwt, { secret: 'test-secret' })
    await app.register(cookie)
    await app.register(errorHandlerPlugin)
    await app.register(authRoutes, { prefix: '/auth' })
    await app.ready()
  })

  afterEach(async () => {
    delete process.env.REFRESH_TOKEN_PEPPER
    await app.close()
  })

  it('rejects reuse and invalidates the token issued by the first rotation', async () => {
    const initialTokens = await generateTokens(app, user.id, user.companyId, user.role)
    expect(authDb.rows[0].tokenHash).not.toBe(initialTokens.refreshToken)

    const firstRotation = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      cookies: { refreshToken: initialTokens.refreshToken },
    })

    expect(firstRotation.statusCode).toBe(200)
    const rotatedToken = refreshTokenFromResponse(firstRotation)
    expect(rotatedToken).not.toBe(initialTokens.refreshToken)

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const reuse = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      cookies: { refreshToken: initialTokens.refreshToken },
    })

    expect(reuse.statusCode).toBe(401)
    expect(reuse.json()).toEqual({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired refresh token',
      },
    })
    expect(warn).toHaveBeenCalledWith(
      'Refresh token reuse detected; revoking all user sessions',
      { userId: user.id },
    )

    const rotatedAfterReuse = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      cookies: { refreshToken: rotatedToken },
    })

    expect(rotatedAfterReuse.statusCode).toBe(401)
    expect(authDb.rows).toHaveLength(0)
    warn.mockRestore()
  })

  it('keeps logout idempotent when the same token is presented twice', async () => {
    const tokens = await generateTokens(app, user.id, user.companyId, user.role)

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/logout',
        cookies: { refreshToken: tokens.refreshToken },
      })
      expect(response.statusCode).toBe(204)
    }

    expect(authDb.rows).toHaveLength(1)
    expect(authDb.rows[0].revokedAt).toBeInstanceOf(Date)
  })
})
