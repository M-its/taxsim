'use client'

import { useEffect, useState } from 'react'
import { getSales } from '@/lib/api'
import type { Sale } from '@/lib/sale.types'

export type UseRecentSalesResult = {
  data: Sale[]
  isLoading: boolean
  error: Error | null
}

export function useRecentSales(): UseRecentSalesResult {
  const [data, setData] = useState<Sale[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError(null)

      try {
        const response = await getSales(undefined, 1, 5)

        if (!cancelled) {
          setData(response.data as Sale[])
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)))
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  return { data, isLoading, error }
}
