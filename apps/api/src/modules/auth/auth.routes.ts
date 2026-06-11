import type { FastifyInstance } from 'fastify'
import {
  registerHandler,
  loginHandler,
  refreshHandler,
  logoutHandler,
  logoutAllHandler,
} from './auth.controller.js'

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/register', registerHandler)
  app.post('/login', loginHandler)
  app.post('/refresh', refreshHandler)
  app.post('/logout', logoutHandler)
  app.post('/logout/all', logoutAllHandler)
}
