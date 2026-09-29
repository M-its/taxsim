'use client'

import { ErrorState } from '@/components/ui/page-state'

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main>
      <ErrorState
        primaryAction={{ label: 'Tentar novamente', onClick: reset }}
        secondaryAction={{ label: 'Voltar ao início', href: '/' }}
        supportId={error.digest}
        technicalDetails={
          process.env.NODE_ENV === 'development'
            ? error.stack ?? error.message
            : undefined
        }
        fullScreen
      />
    </main>
  )
}
