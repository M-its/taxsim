'use client'

import { useEffect, useState } from 'react'
import { searchNcm, type NcmResult } from '@/lib/api'
import type { TaxRegime } from '@/lib/auth.types'

export function useNcmSearch(taxRegime: TaxRegime | null, initialQuery = '') {
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<NcmResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const normalizedQuery = query.trim()
    if (!normalizedQuery || !taxRegime) {
      setResults([])
      setIsLoading(false)
      setError(null)
      return
    }

    let active = true
    const timer = setTimeout(() => {
      setIsLoading(true)
      setError(null)
      searchNcm(normalizedQuery, taxRegime)
        .then((data) => {
          if (active) setResults(data)
        })
        .catch(() => {
          if (!active) return
          setResults([])
          setError('Não foi possível buscar NCMs agora.')
        })
        .finally(() => {
          if (active) setIsLoading(false)
        })
    }, 300)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [query, taxRegime])

  function clear() {
    setQuery('')
    setResults([])
    setError(null)
  }

  function select(value: string) {
    setQuery(value)
    setResults([])
    setError(null)
  }

  return { query, setQuery, results, isLoading, error, clear, select }
}
