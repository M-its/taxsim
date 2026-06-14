import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../shared/middlewares/authenticate.js'
import {
  createSaleHandler,
  listSalesHandler,
  getSaleHandler,
  simulateHandler,
  confirmSaleHandler,
  cancelSaleHandler,
} from './sales.controller.js'

export async function salesRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate)

  app.post('/', createSaleHandler)
  app.get('/', listSalesHandler)
  app.post('/simulate', simulateHandler)
  app.get('/:id', getSaleHandler)
  app.patch('/:id/confirm', confirmSaleHandler)
  app.patch('/:id/cancel', cancelSaleHandler)
}
