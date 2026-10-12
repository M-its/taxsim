'use client'

import { useEffect, useState } from 'react'
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
  const [hasShownForm, setHasShownForm] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) setHasShownForm(true)
  }, [isLoading, isAuthenticated])

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(redirectTo)
    }
  }, [isLoading, isAuthenticated, redirectTo, router])

  if ((isLoading && !hasShownForm) || isAuthenticated) {
    return <AuthLoading />
  }

  return (
    <>
      <SessionRecovery />
      {children}
    </>
  )
}
