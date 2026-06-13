import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../shared/middlewares/authenticate.js'
import {
  listHandler,
  getHandler,
  createHandler,
  updateHandler,
  deleteHandler,
} from './clients.controller.js'

export async function clientsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate)

  app.get('/', listHandler)
  app.get('/:id', getHandler)
  app.post('/', createHandler)
  app.put('/:id', updateHandler)
  app.delete('/:id', deleteHandler)
}
