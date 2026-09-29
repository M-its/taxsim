import type { Metadata } from 'next'
import { ContextualNotFound } from '@/components/ui/contextual-not-found'

export const metadata: Metadata = {
  title: '404 — Página não encontrada',
}

export default function NotFound() {
  return (
    <main>
      <ContextualNotFound />
    </main>
  )
}
