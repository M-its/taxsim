import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../shared/middlewares/authenticate.js'
import { updateHandler } from './companies.controller.js'

export async function companiesRoutes(app: FastifyInstance): Promise<void> {
  app.patch('/:id', { preHandler: authenticate }, updateHandler)
}
