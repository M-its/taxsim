import type { z } from 'zod'
import type {
  createClientSchema,
  updateClientSchema,
  listClientsSchema,
} from './clients.schema.js'

export type CreateClientInput = z.infer<typeof createClientSchema>
export type UpdateClientInput = z.infer<typeof updateClientSchema>
export type ListClientsQuery = z.infer<typeof listClientsSchema>
