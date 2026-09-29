'use client'

import { ErrorState } from '@/components/ui/page-state'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorState
      title="Não foi possível carregar esta área"
      description="Os dados desta página não puderam ser carregados. Tente novamente."
      primaryAction={{ label: 'Tentar novamente', onClick: reset }}
      secondaryAction={{ label: 'Voltar ao dashboard', href: '/dashboard' }}
      supportId={error.digest}
      technicalDetails={
        process.env.NODE_ENV === 'development'
          ? error.stack ?? error.message
          : undefined
      }
    />
  )
}
