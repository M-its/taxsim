import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import type { DashboardSummaryResponse } from '@/lib/dashboard.types'

export type UseDashboardSummaryResult = {
  data: DashboardSummaryResponse | null
  isLoading: boolean
  error: Error | null
}

export function useDashboardSummary(): UseDashboardSummaryResult {
  const [data, setData] = useState<DashboardSummaryResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError(null)

      try {
        const response = await apiFetch('/dashboard/summary', { method: 'GET' })

        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          throw new Error(
            body?.error?.message ??
              `Failed to load dashboard summary (${response.status})`,
          )
        }

        const summary = (await response.json()) as DashboardSummaryResponse

        if (!cancelled) {
          setData(summary)
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
