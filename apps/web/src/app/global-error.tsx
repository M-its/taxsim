'use client'

import { ErrorState } from '@/components/ui/page-state'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const technicalDetails =
    process.env.NODE_ENV === 'development'
      ? error.stack ?? error.message
      : undefined

  return (
    <html lang="pt-BR" className="dark">
      <body style={{ margin: 0 }}>
        <main>
          <ErrorState
            title="Não foi possível iniciar a aplicação"
            description="Ocorreu um erro inesperado. Tente novamente."
            primaryAction={{ label: 'Tentar novamente', onClick: reset }}
            secondaryAction={{ label: 'Voltar ao início', href: '/' }}
            supportId={error.digest}
            technicalDetails={technicalDetails}
            fullScreen
          />
        </main>
      </body>
    </html>
  )
}
