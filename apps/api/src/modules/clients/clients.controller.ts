import type { FastifyRequest, FastifyReply } from 'fastify'
import {
  createClientSchema,
  updateClientSchema,
  listClientsSchema,
} from './clients.schema.js'
import {
  listClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
} from './clients.service.js'

export const listHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const companyId = request.user.companyId
  const query = listClientsSchema.parse(request.query)
  const result = await listClients(companyId, query)
  return reply.send(result)
}

export const getHandler = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) => {
  const companyId = request.user.companyId
  const { id } = request.params
  const client = await getClient(companyId, id)
  return reply.send(client)
}

export const createHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const companyId = request.user.companyId
  const body = createClientSchema.parse(request.body)
  const client = await createClient(companyId, body)
  return reply.status(201).send(client)
}

export const updateHandler = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) => {
  const companyId = request.user.companyId
  const { id } = request.params
  const body = updateClientSchema.parse(request.body)
  const client = await updateClient(companyId, id, body)
  return reply.send(client)
}

export const deleteHandler = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) => {
  const companyId = request.user.companyId
  const { id } = request.params
  await deleteClient(companyId, id)
  return reply.status(204).send()
}
