import type { FastifyRequest, FastifyReply } from 'fastify'
import '@fastify/jwt'
import { AppError } from '../errors/AppError.js'
import type { JwtPayload } from '../../modules/auth/auth.types.js'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload
    user: JwtPayload
  }
}

export const authenticate = async (
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> => {
  try {
    await request.jwtVerify()
  } catch {
    throw AppError.unauthorized('Invalid or missing token')
  }
}
