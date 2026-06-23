import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../shared/middlewares/authenticate.js'
import {
  registerHandler,
  loginHandler,
  refreshHandler,
  logoutHandler,
  logoutAllHandler,
  meHandler,
} from './auth.controller.js'

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/register', registerHandler)
  app.post('/login', loginHandler)
  app.post('/refresh', refreshHandler)
  app.get('/me', { preHandler: [authenticate] }, meHandler)
  app.post('/logout', logoutHandler)
  app.post('/logout/all', logoutAllHandler)
}
