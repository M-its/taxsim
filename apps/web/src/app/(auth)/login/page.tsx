'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/auth/auth-provider'
import { PublicRoute } from '@/components/auth/public-route'
import { Button } from '@/components/ui/button'
import { AsyncStatus } from '@/components/ui/async-status'
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
import { safeRedirectPath } from '@/lib/safe-redirect'

export const dynamic = 'force-dynamic'

function LoginForm() {
  const { login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = safeRedirectPath(searchParams.get('redirectTo'))

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<'email' | 'password', string>>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const errorSummaryRef = useRef<HTMLDivElement>(null)

  function focusField(id: 'email' | 'password') {
    requestAnimationFrame(() => document.getElementById(id)?.focus())
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const errors: Partial<Record<'email' | 'password', string>> = {}
    if (!email.trim() || !email.includes('@')) errors.email = 'Informe um e-mail válido.'
    if (!password) errors.password = 'Informe sua senha.'
    setFieldErrors(errors)
    const firstInvalid = (['email', 'password'] as const).find((field) => errors[field])
    if (firstInvalid) {
      focusField(firstInvalid)
      return
    }

    setIsSubmitting(true)
    try {
      await login({ email: email.trim(), password })
      router.replace(redirectTo)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Erro ao entrar. Tente novamente.'
      setFormError(message)
      requestAnimationFrame(() => errorSummaryRef.current?.focus())
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#09090b] p-4">
      <Card className="w-full max-w-sm rounded-none border-[#27272a] bg-[#18181b]">
        <CardHeader className="space-y-1">
          <CardTitle as="h1" className="text-xl text-[#fafafa]">
            Entrar no TaxSim
          </CardTitle>
          <CardDescription className="text-[#a1a1aa]">
            Insira suas credenciais para acessar o sistema.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
          <AsyncStatus message={isSubmitting ? 'Entrando no TaxSim.' : ''} />
          <CardContent className="space-y-4">
            {(formError || Object.keys(fieldErrors).length > 0) && (
              <div
                ref={errorSummaryRef}
                tabIndex={-1}
                role="alert"
                className="rounded-none border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400 outline-none focus:ring-2 focus:ring-red-300"
              >
                <p className="font-medium">Revise os dados para entrar:</p>
                <ul className="mt-1 list-disc pl-5">
                  {formError && <li>{formError}</li>}
                  {fieldErrors.email && (
                    <li>
                      <a href="#email">{fieldErrors.email}</a>
                    </li>
                  )}
                  {fieldErrors.password && (
                    <li>
                      <a href="#password">{fieldErrors.password}</a>
                    </li>
                  )}
                </ul>
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
                onChange={(e) => {
                  setEmail(e.target.value)
                  setFieldErrors((current) => ({ ...current, email: undefined }))
                }}
                placeholder="joao@acme.com"
                required
                aria-invalid={Boolean(fieldErrors.email) || undefined}
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                className="rounded-none border-[#27272a] bg-[#09090b] text-[#fafafa] placeholder:text-[#a1a1aa] focus-visible:border-[#34d399] focus-visible:ring-[#34d399]/20"
              />
              {fieldErrors.email && (
                <p id="email-error" className="text-sm text-red-400">
                  {fieldErrors.email}
                </p>
              )}
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
                onChange={(e) => {
                  setPassword(e.target.value)
                  setFieldErrors((current) => ({ ...current, password: undefined }))
                }}
                placeholder="••••••••"
                required
                minLength={8}
                aria-invalid={Boolean(fieldErrors.password) || undefined}
                aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                className="rounded-none border-[#27272a] bg-[#09090b] text-[#fafafa] placeholder:text-[#a1a1aa] focus-visible:border-[#34d399] focus-visible:ring-[#34d399]/20"
              />
              {fieldErrors.password && (
                <p id="password-error" className="text-sm text-red-400">
                  {fieldErrors.password}
                </p>
              )}
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
              <Link href="/register" className="text-[#34d399] underline underline-offset-2">
                Criar uma
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
      <ComplianceBanner className="max-w-sm" />
    </main>
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
