import type { FastifyInstance } from 'fastify'
import rateLimit from '@fastify/rate-limit'
import { authenticate } from '../../shared/middlewares/authenticate.js'
import {
  registerHandler,
  loginHandler,
  refreshHandler,
  logoutHandler,
  logoutAllHandler,
  meHandler,
} from './auth.controller.js'

const AUTH_RATE_LIMIT = {
  max: 5,
  timeWindow: '1 minute',
} as const

export async function authRoutes(app: FastifyInstance): Promise<void> {
  await app.register(rateLimit, {
    global: false,
    errorResponseBuilder: (_request, context) => ({
      statusCode: 429,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Too many authentication attempts. Try again in ${context.after}.`,
      },
    }),
  })

  const rateLimitedRoute = {
    config: {
      rateLimit: AUTH_RATE_LIMIT,
    },
  }

  app.post('/register', rateLimitedRoute, registerHandler)
  app.post('/login', rateLimitedRoute, loginHandler)
  app.post('/refresh', refreshHandler)
  app.get('/me', { preHandler: [authenticate] }, meHandler)
  app.post('/logout', logoutHandler)
  app.post('/logout/all', logoutAllHandler)
}
