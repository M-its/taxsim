import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../shared/middlewares/authenticate.js'
import { getDashboardSummaryHandler } from './dashboard.controller.js'

export async function dashboardRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate)

  app.get('/summary', getDashboardSummaryHandler)
}
