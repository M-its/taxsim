import { describe, it, expect } from 'vitest'
import { createProductSchema, updateProductSchema } from './products.schema'

describe('product schemas - proteção contra exponentes e amplificação (Finding 1)', () => {
  const baseProduct = {
    name: 'Notebook',
    sku: 'NOTEBOOK-001',
    ncmCode: '84713012',
  }

  it('rejeita notação de expoente científico', () => {
    const result = createProductSchema.safeParse({
      ...baseProduct,
      unitPrice: '1e100000000',
    })
    expect(result.success).toBe(false)
  })

  it('rejeita Infinity', () => {
    const result = createProductSchema.safeParse({
      ...baseProduct,
      unitPrice: 'Infinity',
    })
    expect(result.success).toBe(false)
  })

  it('rejeita valores com mais de 2 casas decimais', () => {
    const result = createProductSchema.safeParse({
      ...baseProduct,
      unitPrice: '10.999',
    })
    expect(result.success).toBe(false)
  })

  it('aceita um valor monetário válido normal', () => {
    const createResult = createProductSchema.safeParse({
      ...baseProduct,
      unitPrice: '2500.00',
    })
    const updateResult = updateProductSchema.safeParse({
      ...baseProduct,
      unitPrice: '2500.00',
    })

    expect(createResult.success).toBe(true)
    expect(updateResult.success).toBe(true)
  })
})
