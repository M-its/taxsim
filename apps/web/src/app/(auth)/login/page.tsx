'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/auth/auth-provider'
import { PublicRoute } from '@/components/auth/public-route'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Suspense } from 'react'
import { ApiError } from '@/lib/api'
import { AuthLoading } from '@/components/auth/auth-loading'
import { ComplianceBanner } from '@/components/auth/compliance-banner'

export const dynamic = 'force-dynamic'

function LoginForm() {
  const { login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!email.trim() || !password) {
      setError('Preencha e-mail e senha.')
      return
    }

    setIsSubmitting(true)
    try {
      await login({ email: email.trim(), password })
      router.replace(redirectTo)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Erro ao entrar. Tente novamente.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#09090b] p-4">
      <Card className="w-full max-w-sm rounded-none border-[#27272a] bg-[#18181b]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl text-[#fafafa]">Entrar no TaxSim</CardTitle>
          <CardDescription className="text-[#a1a1aa]">
            Insira suas credenciais para acessar o sistema.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-none border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#fafafa]">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="joao@acme.com"
                required
                className="rounded-none border-[#27272a] bg-[#09090b] text-[#fafafa] placeholder:text-[#71717a] focus-visible:border-[#34d399] focus-visible:ring-[#34d399]/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#fafafa]">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                className="rounded-none border-[#27272a] bg-[#09090b] text-[#fafafa] placeholder:text-[#71717a] focus-visible:border-[#34d399] focus-visible:ring-[#34d399]/20"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-none bg-[#34d399] text-[#09090b] hover:bg-[#34d399]/90"
            >
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </Button>
            <p className="text-sm text-[#a1a1aa]">
              Não tem conta?{' '}
              <Link
                href="/register"
                className="text-[#34d399] hover:underline"
              >
                Criar uma
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
      <ComplianceBanner className="max-w-sm" />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthLoading />}>
      <PublicRoute>
        <LoginForm />
      </PublicRoute>
    </Suspense>
  )
}
