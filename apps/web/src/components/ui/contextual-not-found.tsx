'use client'

import { usePathname } from 'next/navigation'
import { AuthProvider, useAuth } from '@/components/auth/auth-provider'
import { PageState } from '@/components/ui/page-state'

const authenticatedPrefixes = [
  '/dashboard',
  '/simulation',
  '/products',
  '/customers',
  '/sales',
  '/settings',
]

function AuthenticatedNotFound() {
  const pathname = usePathname()
  const { isAuthenticated, isLoading } = useAuth()
  const destination = isAuthenticated
    ? '/dashboard'
    : '/login?redirectTo=' + encodeURIComponent(pathname)

  return (
    <PageState
      code="404"
      title="Página não encontrada"
      description={
        isLoading
          ? 'A página não existe. Estamos verificando sua sessão.'
          : 'A página solicitada não existe ou não está disponível.'
      }
      primaryAction={{
        label: isAuthenticated ? 'Voltar ao dashboard' : 'Ir para o login',
        href: destination,
      }}
      fullScreen
    />
  )
}

export function ContextualNotFound() {
  const pathname = usePathname()
  const isAuthenticatedRoute = authenticatedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/'),
  )

  if (!isAuthenticatedRoute) {
    return (
      <PageState
        code="404"
        title="Página não encontrada"
        description="A página solicitada não existe."
        primaryAction={{ label: 'Voltar ao início', href: '/' }}
        fullScreen
      />
    )
  }

  return (
    <AuthProvider>
      <AuthenticatedNotFound />
    </AuthProvider>
  )
}
