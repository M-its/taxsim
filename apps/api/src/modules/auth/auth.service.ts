import bcrypt from 'bcrypt'
import type { FastifyInstance } from 'fastify'
import { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { seedTaxRulesIfEmpty } from '../../lib/tax-rule-seed.js'
import { AppError } from '../../shared/errors/AppError.js'
import { publicDocumentErrorMessage, validateCnpj } from '../../shared/documents/br-document.js'
import {
  InvalidRefreshTokenError,
  RefreshTokenReuseDetectedError,
} from '../../shared/errors/refreshTokenErrors.js'
import { generateRawRefreshToken, hashRefreshToken } from './refresh-token.util.js'
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
  tokenStore: Pick<Prisma.TransactionClient, 'refreshToken'> = prisma,
): Promise<{ accessToken: string; refreshToken: string }> => {
  const payload: JwtPayload = { sub: userId, companyId, role }

  const accessToken = await app.jwt.sign(payload, { expiresIn: '15m' })
  const refreshToken = generateRawRefreshToken()
  const tokenHash = hashRefreshToken(refreshToken)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  await tokenStore.refreshToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  })

  return { accessToken, refreshToken }
}

export const register = async (
  app: FastifyInstance,
  input: RegisterInput,
): Promise<{
  user: User
  company: Company
  tokens: { accessToken: string; refreshToken: string }
}> => {
  const documentValidation = validateCnpj(input.company.document)
  if (!documentValidation.valid) {
    throw AppError.unprocessable(publicDocumentErrorMessage('CNPJ'))
  }

  const passwordHash = await hashPassword(input.user.password)

  try {
    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: input.company.name,
          document: documentValidation.normalized,
          taxRegime: input.company.taxRegime,
          municipioCode: input.company.municipioCode,
          uf: input.company.uf,
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

      // Bootstrap global tax rules on first registration if the table is still empty.
      const taxRulesSeeded = await seedTaxRulesIfEmpty(tx)
      if (taxRulesSeeded) {
        console.log('tax_rules was empty; global rules auto-seeded after company creation')
      }

      return { user, company }
    })

    const tokens = await generateTokens(app, result.user.id, result.company.id, result.user.role)

    return { user: result.user, company: result.company, tokens }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = Array.isArray(error.meta?.target) ? error.meta.target : []
      if (target.includes('document')) {
        throw AppError.conflict('CNPJ inválido')
      }
      throw AppError.conflict('Não foi possível concluir o cadastro')
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

export const rotateRefreshToken = async (
  app: FastifyInstance,
  presentedToken: string,
): Promise<{ accessToken: string; refreshToken: string }> => {
  const tokenHash = hashRefreshToken(presentedToken)
  const outcome = await prisma.$transaction(async (tx) => {
    const existing = await tx.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    })

    if (!existing || existing.expiresAt < new Date()) {
      return { kind: 'invalid' as const }
    }

    if (existing.revokedAt) {
      await tx.refreshToken.deleteMany({ where: { userId: existing.userId } })
      return { kind: 'reuse' as const, userId: existing.userId }
    }

    const revoked = await tx.refreshToken.updateMany({
      where: { id: existing.id, revokedAt: null },
      data: { revokedAt: new Date() },
    })

    if (revoked.count === 0) {
      await tx.refreshToken.deleteMany({ where: { userId: existing.userId } })
      return { kind: 'reuse' as const, userId: existing.userId }
    }

    const tokens = await generateTokens(
      app,
      existing.user.id,
      existing.user.companyId,
      existing.user.role,
      tx,
    )
    return { kind: 'success' as const, tokens }
  })

  if (outcome.kind === 'invalid') {
    throw new InvalidRefreshTokenError()
  }

  if (outcome.kind === 'reuse') {
    console.warn('Refresh token reuse detected; revoking all user sessions', {
      userId: outcome.userId,
    })
    throw new RefreshTokenReuseDetectedError()
  }

  return outcome.tokens
}

export const revokeRefreshToken = async (presentedToken: string): Promise<void> => {
  const tokenHash = hashRefreshToken(presentedToken)
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

export const logoutAll = async (userId: string): Promise<void> => {
  await prisma.refreshToken.deleteMany({ where: { userId } })
}

export const me = async (userId: string): Promise<{ user: User; company: Company }> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { company: true },
  })

  if (!user) {
    throw AppError.unauthorized('User not found')
  }

  return { user, company: user.company }
}
