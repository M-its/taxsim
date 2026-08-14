import type { FastifyRequest, FastifyReply } from 'fastify'
import '@fastify/cookie'
import type { TaxRegime, UserRole } from '@prisma/client'
import { AppError } from '../../shared/errors/AppError.js'
import { authenticate } from '../../shared/middlewares/authenticate.js'
import { registerSchema, loginSchema } from './auth.schema.js'
import { register, login, refresh, logout, logoutAll, me } from './auth.service.js'
import type { AuthResponse, JwtPayload, RegisterResponse } from './auth.types.js'

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/auth',
  maxAge: 604800,
}

export const registerHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<RegisterResponse> => {
  const app = request.server
  const body = registerSchema.parse(request.body)
  const { user, company, tokens } = await register(app, body)
  reply.setCookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS)
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    company: {
      id: company.id,
      name: company.name,
      document: company.document,
      taxRegime: company.taxRegime,
      municipioCode: company.municipioCode,
      uf: company.uf,
    },
    accessToken: tokens.accessToken,
  }
}

export const loginHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<AuthResponse> => {
  const app = request.server
  const body = loginSchema.parse(request.body)
  const { user, tokens } = await login(app, body)
  reply.setCookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS)
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    },
    accessToken: tokens.accessToken,
  }
}

export const refreshHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<{ accessToken: string }> => {
  const app = request.server
  const tokenFromCookie = request.cookies.refreshToken
  if (!tokenFromCookie) {
    throw AppError.unauthorized('Missing refresh token')
  }
  const tokens = await refresh(app, tokenFromCookie)
  reply.setCookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS)
  return { accessToken: tokens.accessToken }
}

export const logoutHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  const refreshToken = request.cookies.refreshToken
  if (refreshToken) {
    await logout(refreshToken)
  }
  reply.clearCookie('refreshToken', { path: '/auth' })
  reply.status(204)
}

export const logoutAllHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  try {
    await request.jwtVerify()
  } catch {
    throw AppError.unauthorized('Invalid access token')
  }
  const payload = request.user as JwtPayload
  await logoutAll(payload.sub)
  reply.clearCookie('refreshToken', { path: '/auth' })
  reply.status(204)
}

export const meHandler = async (
  request: FastifyRequest,
): Promise<{
  user: {
    id: string
    name: string
    email: string
    role: UserRole
    companyId: string
  }
  company: {
    id: string
    name: string
    document: string
    taxRegime: TaxRegime
    municipioCode: number | null
    uf: string | null
  }
}> => {
  const payload = request.user as JwtPayload
  const { user, company } = await me(payload.sub)
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    },
    company: {
      id: company.id,
      name: company.name,
      document: company.document,
      taxRegime: company.taxRegime,
      municipioCode: company.municipioCode,
      uf: company.uf,
    },
  }
}
