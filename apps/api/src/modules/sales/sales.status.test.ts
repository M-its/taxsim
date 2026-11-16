import { beforeEach, describe, expect, it, vi } from 'vitest'

type Status = 'DRAFT' | 'CONFIRMED' | 'CANCELLED'
const db = vi.hoisted(() => {
  const rows: Array<{ id: string; companyId: string; status: Status }> = []
  return {
    rows,
    findFirst: vi.fn(async ({ where }: { where: { id: string; companyId: string } }) => {
      const row = rows.find((row) => row.id === where.id && row.companyId === where.companyId)
      return row ? { ...row } : null
    }),
    updateMany: vi.fn(
      async ({
        where,
        data,
      }: {
        where: { id: string; companyId: string; status: Status }
        data: { status: Status }
      }) => {
        // Yield so concurrent requests contend before the atomic compare-and-set.
        await Promise.resolve()
        const row = rows.find(
          (row) =>
            row.id === where.id && row.companyId === where.companyId && row.status === where.status,
        )
        if (!row) return { count: 0 }
        row.status = data.status
        return { count: 1 }
      },
    ),
  }
})

vi.mock('../../lib/prisma.js', () => ({
  prisma: { sale: { findFirst: db.findFirst, updateMany: db.updateMany } },
}))

import { cancelSale, confirmSale } from './sales.service.js'

beforeEach(() => {
  vi.clearAllMocks()
  db.rows.splice(0, db.rows.length, { id: 'sale', companyId: 'owner', status: 'DRAFT' })
})

describe('atomic sale transitions', () => {
  it.each(['confirm-first', 'cancel-first'])('allows only one winner: %s', async (order) => {
    const operations =
      order === 'confirm-first'
        ? [confirmSale('owner', 'sale'), cancelSale('owner', 'sale')]
        : [cancelSale('owner', 'sale'), confirmSale('owner', 'sale')]
    const results = await Promise.allSettled(operations)
    expect(results[0]).toMatchObject({ status: 'fulfilled' })
    expect(results[1]).toMatchObject({ status: 'rejected', reason: { statusCode: 422 } })
    expect(db.rows[0].status).toBe(order === 'confirm-first' ? 'CONFIRMED' : 'CANCELLED')
  })

  it('rejects a repeated concurrent confirmation', async () => {
    const results = await Promise.allSettled([
      confirmSale('owner', 'sale'),
      confirmSale('owner', 'sale'),
    ])
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1)
    expect(db.rows[0].status).toBe('CONFIRMED')
  })

  it('keeps concurrent and repeated cancellation idempotent', async () => {
    const results = await Promise.all([cancelSale('owner', 'sale'), cancelSale('owner', 'sale')])
    expect(results).toEqual([
      { id: 'sale', status: 'CANCELLED' },
      { id: 'sale', status: 'CANCELLED' },
    ])
    await expect(cancelSale('owner', 'sale')).resolves.toEqual(results[0])
  })

  it.each([confirmSale, cancelSale])('does not mutate another tenant sale', async (transition) => {
    await expect(transition('other', 'sale')).rejects.toMatchObject({ statusCode: 404 })
    expect(db.rows[0].status).toBe('DRAFT')
  })

  it.each([confirmSale, cancelSale])('returns 404 for an unknown sale', async (transition) => {
    await expect(transition('owner', 'missing')).rejects.toMatchObject({ statusCode: 404 })
  })

  it('cannot cancel a confirmed sale', async () => {
    db.rows[0].status = 'CONFIRMED'
    await expect(cancelSale('owner', 'sale')).rejects.toMatchObject({ statusCode: 422 })
    expect(db.rows[0].status).toBe('CONFIRMED')
  })

  it('cannot confirm a cancelled sale', async () => {
    db.rows[0].status = 'CANCELLED'
    await expect(confirmSale('owner', 'sale')).rejects.toMatchObject({ statusCode: 422 })
    expect(db.rows[0].status).toBe('CANCELLED')
  })
})
