'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from './auth-provider'
import { AuthLoading } from './auth-loading'
import { safeRedirectPath } from '@/lib/safe-redirect'
import { SessionRecovery } from './session-recovery'

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

  // These forms contain no private data. Keep their server-rendered content
  // available during hydration/restoration; submission is gated in each form.
  if (isAuthenticated) {
    return <AuthLoading />
  }

  return (
    <>
      {!isLoading && <SessionRecovery />}
      {children}
    </>
  )
}
