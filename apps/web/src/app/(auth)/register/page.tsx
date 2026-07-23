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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ApiError } from '@/lib/api'
import { Suspense } from 'react'
import type { TaxRegime } from '@/lib/auth.types'
import { AuthLoading } from '@/components/auth/auth-loading'
import { ComplianceBanner } from '@/components/auth/compliance-banner'

export const dynamic = 'force-dynamic'

const TAX_REGIMES: { value: TaxRegime; label: string }[] = [
  { value: 'SIMPLES_NACIONAL', label: 'Simples Nacional' },
  { value: 'LUCRO_PRESUMIDO', label: 'Lucro Presumido' },
  { value: 'LUCRO_REAL', label: 'Lucro Real' },
]

function RegisterForm() {
  const { register } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? '/dashboard'

  const [form, setForm] = useState({
    companyName: '',
    document: '',
    taxRegime: 'SIMPLES_NACIONAL' as TaxRegime,
    municipioCode: '',
    uf: '',
    userName: '',
    email: '',
    password: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function updateField(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function validate(): string | null {
    if (!form.companyName.trim()) return 'Nome da empresa é obrigatório.'
    if (form.document.replace(/\D/g, '').length !== 14)
      return 'CNPJ deve conter 14 dígitos.'
    if (!form.uf.trim() || form.uf.trim().length !== 2)
      return 'UF deve conter 2 letras.'
    const code = Number(form.municipioCode)
    if (!Number.isInteger(code) || code <= 0)
      return 'Código do município (IBGE) é obrigatório.'
    if (!form.userName.trim()) return 'Nome do usuário é obrigatório.'
    if (!form.email.trim() || !form.email.includes('@'))
      return 'E-mail inválido.'
    if (form.password.length < 8)
      return 'Senha deve ter pelo menos 8 caracteres.'
    return null
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)
    try {
      await register({
        company: {
          name: form.companyName.trim(),
          document: form.document.replace(/\D/g, ''),
          taxRegime: form.taxRegime,
          municipioCode: Number(form.municipioCode),
          uf: form.uf.trim().toUpperCase(),
        },
        user: {
          name: form.userName.trim(),
          email: form.email.trim(),
          password: form.password,
        },
      })
      router.replace(redirectTo)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Erro ao criar conta. Tente novamente.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#09090b] p-4 py-8">
      <Card className="w-full max-w-lg rounded-none border-[#27272a] bg-[#18181b]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl text-[#fafafa]">
            Criar conta no TaxSim
          </CardTitle>
          <CardDescription className="text-[#a1a1aa]">
            Cadastre sua empresa e o primeiro usuário.
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
              <Label htmlFor="companyName" className="text-[#fafafa]">
                Nome da empresa
              </Label>
              <Input
                id="companyName"
                value={form.companyName}
                onChange={(e) => updateField('companyName', e.target.value)}
                placeholder="Acme Ltda"
                required
                className="rounded-none border-[#27272a] bg-[#09090b] text-[#fafafa] placeholder:text-[#71717a] focus-visible:border-[#34d399] focus-visible:ring-[#34d399]/20"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="document" className="text-[#fafafa]">
                  CNPJ
                </Label>
                <Input
                  id="document"
                  value={form.document}
                  onChange={(e) => updateField('document', e.target.value)}
                  placeholder="12345678000195"
                  required
                  minLength={14}
                  maxLength={18}
                  className="rounded-none border-[#27272a] bg-[#09090b] text-[#fafafa] placeholder:text-[#71717a] focus-visible:border-[#34d399] focus-visible:ring-[#34d399]/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxRegime" className="text-[#fafafa]">
                  Regime tributário
                </Label>
                <Select
                  value={form.taxRegime}
                  onValueChange={(value) =>
                    updateField('taxRegime', value as TaxRegime)
                  }
                >
                  <SelectTrigger
                    id="taxRegime"
                    className="w-full rounded-none border-[#27272a] bg-[#09090b] text-[#fafafa] focus:border-[#34d399] focus:ring-[#34d399]/20"
                  >
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-[#27272a] bg-[#18181b] text-[#fafafa]">
                    {TAX_REGIMES.map((regime) => (
                      <SelectItem
                        key={regime.value}
                        value={regime.value}
                        className="focus:bg-[#27272a] focus:text-[#fafafa]"
                      >
                        {regime.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="municipioCode" className="text-[#fafafa]">
                  Código IBGE do município
                </Label>
                <Input
                  id="municipioCode"
                  type="number"
                  value={form.municipioCode}
                  onChange={(e) => updateField('municipioCode', e.target.value)}
                  placeholder="1234567"
                  required
                  className="rounded-none border-[#27272a] bg-[#09090b] text-[#fafafa] placeholder:text-[#71717a] focus-visible:border-[#34d399] focus-visible:ring-[#34d399]/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="uf" className="text-[#fafafa]">
                  UF
                </Label>
                <Input
                  id="uf"
                  value={form.uf}
                  onChange={(e) => updateField('uf', e.target.value)}
                  placeholder="SP"
                  required
                  minLength={2}
                  maxLength={2}
                  className="rounded-none border-[#27272a] bg-[#09090b] text-[#fafafa] placeholder:text-[#71717a] focus-visible:border-[#34d399] focus-visible:ring-[#34d399]/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="userName" className="text-[#fafafa]">
                Nome do usuário
              </Label>
              <Input
                id="userName"
                value={form.userName}
                onChange={(e) => updateField('userName', e.target.value)}
                placeholder="João Silva"
                required
                className="rounded-none border-[#27272a] bg-[#09090b] text-[#fafafa] placeholder:text-[#71717a] focus-visible:border-[#34d399] focus-visible:ring-[#34d399]/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#fafafa]">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
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
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
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
              {isSubmitting ? 'Criando conta...' : 'Criar conta'}
            </Button>
            <p className="text-sm text-[#a1a1aa]">
              Já tem conta?{' '}
              <Link href="/login" className="text-[#34d399] hover:underline">
                Entrar
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
      <ComplianceBanner className="max-w-lg" />
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<AuthLoading />}>
      <PublicRoute>
        <RegisterForm />
      </PublicRoute>
    </Suspense>
  )
}
