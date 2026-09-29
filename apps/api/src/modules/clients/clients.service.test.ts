import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  count: vi.fn(),
  create: vi.fn(),
  findFirst: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    client: mocks,
  },
}))

import { createClient, listClients, updateClient } from './clients.service.js'

describe('clients service document behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('searches masked lowercase CNPJ by its canonical representation', async () => {
    mocks.findMany.mockResolvedValue([])
    mocks.count.mockResolvedValue(0)

    await listClients('company-1', {
      page: 1,
      limit: 20,
      search: '00.000.000/e08g-12',
    })

    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          companyId: 'company-1',
          OR: [
            { name: { contains: '00.000.000/e08g-12', mode: 'insensitive' } },
            { document: { contains: '00000000E08G12', mode: 'insensitive' } },
          ],
        },
      }),
    )
  })

  it('stores an alphanumeric CNPJ canonically', async () => {
    mocks.create.mockImplementation(async ({ data }) => data)

    const created = await createClient('company-1', {
      name: 'Pessoa jurídica',
      document: '00.000.000/e08g-12',
    })

    expect(created).toMatchObject({ document: '00000000E08G12' })
    expect(mocks.create).toHaveBeenCalledWith({
      data: {
        companyId: 'company-1',
        name: 'Pessoa jurídica',
        document: '00000000E08G12',
        email: undefined,
      },
    })
  })

  it('returns the same public message for CNPJ format and check-digit failures', async () => {
    await expect(
      createClient('company-1', {
        name: 'Formato inválido',
        document: '12ABC34501D!35',
      }),
    ).rejects.toMatchObject({ message: 'CNPJ inválido' })

    await expect(
      createClient('company-1', {
        name: 'DV inválido',
        document: '12ABC34501DE34',
      }),
    ).rejects.toMatchObject({ message: 'CNPJ inválido' })

    expect(mocks.create).not.toHaveBeenCalled()
  })

  it('allows an unchanged legacy numeric document while validating changed values', async () => {
    const legacy = {
      id: 'client-1',
      companyId: 'company-1',
      name: 'Legado',
      document: '12345678000196',
      email: null,
    }
    mocks.findFirst.mockResolvedValue(legacy)
    mocks.update.mockImplementation(async ({ data }) => ({ ...legacy, ...data }))

    await expect(
      updateClient('company-1', 'client-1', {
        name: 'Legado atualizado',
        document: legacy.document,
      }),
    ).resolves.toMatchObject({ document: legacy.document })

    await expect(
      updateClient('company-1', 'client-1', {
        name: 'Legado atualizado',
        document: '12345678000197',
      }),
    ).rejects.toMatchObject({ message: 'CNPJ inválido' })
  })
})
