import bcrypt from 'bcrypt'
import { randomUUID } from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { AppError } from '../../shared/errors/AppError.js'
import type { RegisterInput, LoginInput, JwtPayload } from './auth.types.js'
import type { User, Company, UserRole } from '@prisma/client'

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12)
}

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash)
}

export const generateTokens = async (
  app: FastifyInstance,
  userId: string,
  companyId: string,
  role: UserRole,
): Promise<{ accessToken: string; refreshToken: string }> => {
  const payload: JwtPayload = { sub: userId, companyId, role }

  const accessToken = await app.jwt.sign(payload, { expiresIn: '15m' })
  const refreshToken = randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  await prisma.refreshToken.create({
    data: {
      userId,
      token: refreshToken,
      expiresAt,
    },
  })

  return { accessToken, refreshToken }
}

export const register = async (
  app: FastifyInstance,
  input: RegisterInput,
): Promise<{ user: User; company: Company; tokens: { accessToken: string; refreshToken: string } }> => {
  const passwordHash = await hashPassword(input.user.password)

  try {
    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: input.company.name,
          document: input.company.document,
          taxRegime: input.company.taxRegime,
        },
      })

      const user = await tx.user.create({
        data: {
          companyId: company.id,
          name: input.user.name,
          email: input.user.email.toLowerCase(),
          passwordHash,
          role: 'OWNER',
        },
      })

      return { user, company }
    })

    const tokens = await generateTokens(app, result.user.id, result.company.id, result.user.role)

    return { user: result.user, company: result.company, tokens }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw AppError.conflict('Document or email already registered')
    }
    throw error
  }
}

export const login = async (
  app: FastifyInstance,
  input: LoginInput,
): Promise<{ user: User; tokens: { accessToken: string; refreshToken: string } }> => {
  const user = await prisma.user.findFirst({
    where: { email: input.email.toLowerCase() },
  })

  if (!user) {
    throw AppError.unauthorized('Invalid credentials')
  }

  const valid = await verifyPassword(input.password, user.passwordHash)
  if (!valid) {
    throw AppError.unauthorized('Invalid credentials')
  }

  const tokens = await generateTokens(app, user.id, user.companyId, user.role)

  return { user, tokens }
}

export const refresh = async (
  app: FastifyInstance,
  token: string,
): Promise<{ accessToken: string; refreshToken: string }> => {
  const existing = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!existing || existing.expiresAt < new Date()) {
    throw AppError.unauthorized('Invalid or expired refresh token')
  }

  await prisma.refreshToken.delete({ where: { id: existing.id } })

  return generateTokens(app, existing.user.id, existing.user.companyId, existing.user.role)
}

export const logout = async (token: string): Promise<void> => {
  await prisma.refreshToken.delete({ where: { token } })
}

export const logoutAll = async (userId: string): Promise<void> => {
  await prisma.refreshToken.deleteMany({ where: { userId } })
}
