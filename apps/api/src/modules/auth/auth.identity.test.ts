import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { Prisma } from '@prisma/client'
import type { FastifyInstance } from 'fastify'

const db = vi.hoisted(() => ({
  findMany: vi.fn(),
  findFirst: vi.fn(),
  companyCreate: vi.fn(),
  userCreate: vi.fn(),
  tokenCreate: vi.fn(),
  seed: vi.fn(),
  sign: vi.fn(),
}))

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    user: { findMany: db.findMany },
    refreshToken: { create: db.tokenCreate },
    $transaction: async (callback: (tx: unknown) => unknown) =>
      callback({
        user: { findFirst: db.findFirst, create: db.userCreate },
        company: { create: db.companyCreate },
      }),
  },
}))
vi.mock('../../lib/tax-rule-seed.js', () => ({ seedTaxRulesIfEmpty: db.seed }))

import { hashPassword, login, register, verifyPassword } from './auth.service.js'

const app = { jwt: { sign: db.sign } } as unknown as FastifyInstance
const input = {
  company: {
    name: 'Demo',
    document: '11222333000181',
    taxRegime: 'LUCRO_REAL' as const,
    municipioCode: 4314902,
    uf: 'RS',
  },
  user: { name: 'Person', email: 'Person@Example.com', password: 'test-password-123' },
}
let passwordHash: string

beforeAll(async () => {
  passwordHash = await hashPassword(input.user.password)
})
beforeEach(() => {
  vi.resetAllMocks()
  vi.stubEnv('REFRESH_TOKEN_PEPPER', 'test-only-pepper')
  db.sign.mockResolvedValue('access-token')
  db.findFirst.mockResolvedValue(null)
  db.companyCreate.mockResolvedValue({ id: 'company-b' })
  db.userCreate.mockResolvedValue({ id: 'user-b', companyId: 'company-b', role: 'OWNER' })
})
afterEach(() => {
  vi.unstubAllEnvs()
})

describe('email identity and password compatibility', () => {
  it('verifies bcrypt hashes and rejects a wrong password', async () => {
    expect(passwordHash).not.toBe(input.user.password)
    expect(await verifyPassword(input.user.password, passwordHash)).toBe(true)
    expect(await verifyPassword('wrong-password', passwordHash)).toBe(false)
    // Existing bcrypt 5 hashes use the same $2b$ format and remain valid.
    expect(passwordHash.startsWith('$2b$12$')).toBe(true)
  })

  it('logs into the sole matching identity with its own company', async () => {
    db.findMany.mockResolvedValue([
      { id: 'user-b', companyId: 'company-b', role: 'OWNER', passwordHash },
    ])
    const result = await login(app, { email: input.user.email, password: input.user.password })
    expect(result.user.companyId).toBe('company-b')
    expect(db.findMany).toHaveBeenCalledWith({
      where: { email: { equals: 'person@example.com', mode: 'insensitive' } },
      take: 2,
    })
    expect(db.sign).toHaveBeenCalledWith(
      { sub: 'user-b', companyId: 'company-b', role: 'OWNER' },
      { expiresIn: '15m' },
    )
  })

  it.each(['test-password-123', 'another-password'])(
    'rejects ambiguous legacy identities: %s',
    async (password) => {
      db.findMany.mockResolvedValue([
        { id: 'user-a', companyId: 'company-a', passwordHash },
        { id: 'user-b', companyId: 'company-b', passwordHash },
      ])
      await expect(login(app, { email: input.user.email, password })).rejects.toMatchObject({
        statusCode: 401,
        message: 'Invalid credentials',
      })
      expect(db.sign).not.toHaveBeenCalled()
      expect(db.tokenCreate).not.toHaveBeenCalled()
    },
  )

  it('rejects an unknown email without issuing tokens', async () => {
    db.findMany.mockResolvedValue([])
    await expect(
      login(app, { email: input.user.email, password: input.user.password }),
    ).rejects.toMatchObject({ statusCode: 401, message: 'Invalid credentials' })
    expect(db.sign).not.toHaveBeenCalled()
  })

  it('rejects a wrong password without issuing tokens', async () => {
    db.findMany.mockResolvedValue([{ id: 'user-b', companyId: 'company-b', passwordHash }])
    await expect(
      login(app, { email: input.user.email, password: 'wrong-password' }),
    ).rejects.toMatchObject({ statusCode: 401, message: 'Invalid credentials' })
    expect(db.sign).not.toHaveBeenCalled()
  })

  it('blocks an email owned by another company before creating any company', async () => {
    db.findFirst.mockResolvedValue({ id: 'user-a' })
    await expect(register(app, input)).rejects.toMatchObject({
      statusCode: 409,
      message: 'Não foi possível concluir o cadastro',
    })
    expect(db.findFirst).toHaveBeenCalledWith({
      where: { email: { equals: 'person@example.com', mode: 'insensitive' } },
      select: { id: true },
    })
    expect(db.companyCreate).not.toHaveBeenCalled()
    expect(db.userCreate).not.toHaveBeenCalled()
    expect(db.tokenCreate).not.toHaveBeenCalled()
  })

  it('normalizes a new email and preserves generic errors for a unique-index race', async () => {
    db.userCreate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint', {
        code: 'P2002',
        clientVersion: 'test',
        meta: { target: ['email'] },
      }),
    )
    await expect(register(app, input)).rejects.toMatchObject({
      statusCode: 409,
      message: 'Não foi possível concluir o cadastro',
    })
    expect(db.userCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ email: 'person@example.com' }),
    })
    expect(db.tokenCreate).not.toHaveBeenCalled()
  })
})
