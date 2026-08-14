'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from './auth-provider'
import { AuthLoading } from './auth-loading'
import { safeRedirectPath } from '@/lib/safe-redirect'

export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = safeRedirectPath(searchParams.get('redirectTo'))

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(redirectTo)
    }
  }, [isLoading, isAuthenticated, redirectTo, router])

  if (isLoading || isAuthenticated) {
    return <AuthLoading />
  }

  return children
}
