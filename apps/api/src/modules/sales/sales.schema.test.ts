import { describe, it, expect } from 'vitest'
import { simulateSchema, createSaleSchema } from './sales.schema'

describe('simulateSchema - proteção contra exponentes e amplificação (Finding 1)', () => {
  const baseItem = { ncmCode: '84713012', quantity: 1 }

  it('rejeita notação de expoente científico', () => {
    const result = simulateSchema.safeParse({
      taxRegime: 'LUCRO_REAL',
      items: [{ ...baseItem, unitPrice: '1e100000000' }],
    })
    expect(result.success).toBe(false)
  })

  it('rejeita Infinity', () => {
    const result = simulateSchema.safeParse({
      taxRegime: 'LUCRO_REAL',
      items: [{ ...baseItem, unitPrice: 'Infinity' }],
    })
    expect(result.success).toBe(false)
  })

  it('rejeita valores com mais de 2 casas decimais', () => {
    const result = simulateSchema.safeParse({
      taxRegime: 'LUCRO_REAL',
      items: [{ ...baseItem, unitPrice: '10.999' }],
    })
    expect(result.success).toBe(false)
  })

  it('rejeita mais de 100 itens no array', () => {
    const items = Array.from({ length: 101 }, () => ({ ...baseItem, unitPrice: '10.00' }))
    const result = simulateSchema.safeParse({ taxRegime: 'LUCRO_REAL', items })
    expect(result.success).toBe(false)
  })

  it('rejeita quantidade acima do limite por item', () => {
    const result = simulateSchema.safeParse({
      taxRegime: 'LUCRO_REAL',
      items: [{ ncmCode: '84713012', quantity: 10001, unitPrice: '10.00' }],
    })
    expect(result.success).toBe(false)
  })

  it('aceita um valor monetário válido normal', () => {
    const result = simulateSchema.safeParse({
      taxRegime: 'LUCRO_REAL',
      items: [{ ...baseItem, unitPrice: '2500.00' }],
    })
    expect(result.success).toBe(true)
  })
})

describe('createSaleSchema - limite de itens (Finding 1, mesma classe de problema)', () => {
  it('rejeita mais de 100 itens no array', () => {
    const items = Array.from({ length: 101 }, () => ({
      productId: '123e4567-e89b-12d3-a456-426614174000',
      quantity: 1,
    }))
    const result = createSaleSchema.safeParse({
      clientId: '123e4567-e89b-12d3-a456-426614174000',
      items,
    })
    expect(result.success).toBe(false)
  })
})
