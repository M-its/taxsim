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
import { safeRedirectPath } from '@/lib/safe-redirect'
import {
  formatCnpj,
  normalizeCnpj,
  publicDocumentErrorMessage,
  validateCnpj,
} from '@/lib/br-document'

export const dynamic = 'force-dynamic'

const TAX_REGIMES: { value: TaxRegime; label: string }[] = [
  { value: 'SIMPLES_NACIONAL', label: 'Simples Nacional' },
  { value: 'LUCRO_PRESUMIDO', label: 'Lucro Presumido' },
  { value: 'LUCRO_REAL', label: 'Lucro Real' },
]

type RegistrationForm = {
  companyName: string
  document: string
  taxRegime: TaxRegime
  municipioCode: string
  uf: string
  userName: string
  email: string
  password: string
}

type RegistrationField = keyof RegistrationForm
type RegistrationErrors = Partial<Record<RegistrationField, string>>

const REGISTRATION_FIELD_ORDER: RegistrationField[] = [
  'companyName',
  'document',
  'taxRegime',
  'municipioCode',
  'uf',
  'userName',
  'email',
  'password',
]

function RegisterForm() {
  const { register } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = safeRedirectPath(searchParams.get('redirectTo'))

  const [form, setForm] = useState<RegistrationForm>({
    companyName: '',
    document: '',
    taxRegime: 'SIMPLES_NACIONAL' as TaxRegime,
    municipioCode: '',
    uf: '',
    userName: '',
    email: '',
    password: '',
  })
  const [fieldErrors, setFieldErrors] = useState<RegistrationErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const errorSummaryRef = useRef<HTMLDivElement>(null)

  function updateField(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
  }

  function validate(): RegistrationErrors {
    const errors: RegistrationErrors = {}
    if (!form.companyName.trim()) errors.companyName = 'Nome da empresa é obrigatório.'
    if (!validateCnpj(form.document).valid) errors.document = publicDocumentErrorMessage('CNPJ')
    if (!form.taxRegime) errors.taxRegime = 'Selecione o regime tributário.'
    const code = Number(form.municipioCode)
    if (!Number.isInteger(code) || code <= 0) {
      errors.municipioCode = 'Código do município (IBGE) é obrigatório.'
    }
    if (!form.uf.trim() || form.uf.trim().length !== 2) errors.uf = 'UF deve conter 2 letras.'
    if (!form.userName.trim()) errors.userName = 'Nome do usuário é obrigatório.'
    if (!form.email.trim() || !form.email.includes('@')) errors.email = 'E-mail inválido.'
    if (form.password.length < 8) errors.password = 'Senha deve ter pelo menos 8 caracteres.'
    return errors
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const validationErrors = validate()
    setFieldErrors(validationErrors)
    const firstInvalid = REGISTRATION_FIELD_ORDER.find((field) => validationErrors[field])
    if (firstInvalid) {
      requestAnimationFrame(() => document.getElementById(firstInvalid)?.focus())
      return
    }

    setIsSubmitting(true)
    try {
      await register({
        company: {
          name: form.companyName.trim(),
          document: normalizeCnpj(form.document),
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
      const message = err instanceof ApiError ? err.message : 'Erro ao criar conta. Tente novamente.'
      if (message.toLowerCase().includes('cnpj')) {
        setFieldErrors((current) => ({ ...current, document: publicDocumentErrorMessage('CNPJ') }))
        requestAnimationFrame(() => document.getElementById('document')?.focus())
      } else {
        setFormError(message)
        requestAnimationFrame(() => errorSummaryRef.current?.focus())
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#09090b] p-4 py-8">
      <Card className="w-full max-w-lg rounded-none border-[#27272a] bg-[#18181b]">
        <CardHeader className="space-y-1">
          <CardTitle as="h1" className="text-xl text-[#fafafa]">
            Criar conta no TaxSim
          </CardTitle>
          <CardDescription className="text-[#a1a1aa]">
            Cadastre sua empresa e o primeiro usuário.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
          <AsyncStatus message={isSubmitting ? 'Criando sua conta.' : ''} />
          <CardContent className="space-y-4">
            {(formError || Object.keys(fieldErrors).length > 0) && (
              <div
                ref={errorSummaryRef}
                tabIndex={-1}
                role="alert"
                className="rounded-none border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400 outline-none focus:ring-2 focus:ring-red-300"
              >
                <p className="font-medium">Revise os campos indicados:</p>
                <ul className="mt-1 list-disc pl-5">
                  {formError && <li>{formError}</li>}
                  {REGISTRATION_FIELD_ORDER.map((field) =>
                    fieldErrors[field] ? (
                      <li key={field}>
                        <a href={`#${field}`}>{fieldErrors[field]}</a>
                      </li>
                    ) : null,
                  )}
                </ul>
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
                aria-invalid={Boolean(fieldErrors.companyName) || undefined}
                aria-describedby={fieldErrors.companyName ? 'companyName-error' : undefined}
                className="rounded-none border-[#27272a] bg-[#09090b] text-[#fafafa] placeholder:text-[#a1a1aa] focus-visible:border-[#34d399] focus-visible:ring-[#34d399]/20"
              />
              {fieldErrors.companyName && (
                <p id="companyName-error" className="text-sm text-red-400">
                  {fieldErrors.companyName}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="document" className="text-[#fafafa]">
                  CNPJ
                </Label>
                <Input
                  id="document"
                  value={form.document}
                  onChange={(e) => updateField('document', formatCnpj(e.target.value))}
                  placeholder="00.000.000/E08G-12"
                  required
                  maxLength={18}
                  autoCapitalize="characters"
                  spellCheck={false}
                  aria-invalid={Boolean(fieldErrors.document) || undefined}
                  aria-describedby={fieldErrors.document ? 'document-error' : undefined}
                  className="rounded-none border-[#27272a] bg-[#09090b] text-[#fafafa] placeholder:text-[#a1a1aa] focus-visible:border-[#34d399] focus-visible:ring-[#34d399]/20"
                />
                {fieldErrors.document && (
                  <p id="document-error" className="text-sm text-red-400">
                    {fieldErrors.document}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxRegime" className="text-[#fafafa]">
                  Regime tributário
                </Label>
                <Select
                  value={form.taxRegime}
                  onValueChange={(value) => updateField('taxRegime', value as TaxRegime)}
                >
                  <SelectTrigger
                    id="taxRegime"
                    aria-invalid={Boolean(fieldErrors.taxRegime) || undefined}
                    aria-describedby={fieldErrors.taxRegime ? 'taxRegime-error' : undefined}
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
                {fieldErrors.taxRegime && (
                  <p id="taxRegime-error" className="text-sm text-red-400">
                    {fieldErrors.taxRegime}
                  </p>
                )}
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
                  aria-invalid={Boolean(fieldErrors.municipioCode) || undefined}
                  aria-describedby={fieldErrors.municipioCode ? 'municipioCode-error' : undefined}
                  className="rounded-none border-[#27272a] bg-[#09090b] text-[#fafafa] placeholder:text-[#a1a1aa] focus-visible:border-[#34d399] focus-visible:ring-[#34d399]/20"
                />
                {fieldErrors.municipioCode && (
                  <p id="municipioCode-error" className="text-sm text-red-400">
                    {fieldErrors.municipioCode}
                  </p>
                )}
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
                  aria-invalid={Boolean(fieldErrors.uf) || undefined}
                  aria-describedby={fieldErrors.uf ? 'uf-error' : undefined}
                  className="rounded-none border-[#27272a] bg-[#09090b] text-[#fafafa] placeholder:text-[#a1a1aa] focus-visible:border-[#34d399] focus-visible:ring-[#34d399]/20"
                />
                {fieldErrors.uf && (
                  <p id="uf-error" className="text-sm text-red-400">
                    {fieldErrors.uf}
                  </p>
                )}
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
                aria-invalid={Boolean(fieldErrors.userName) || undefined}
                aria-describedby={fieldErrors.userName ? 'userName-error' : undefined}
                className="rounded-none border-[#27272a] bg-[#09090b] text-[#fafafa] placeholder:text-[#a1a1aa] focus-visible:border-[#34d399] focus-visible:ring-[#34d399]/20"
              />
              {fieldErrors.userName && (
                <p id="userName-error" className="text-sm text-red-400">
                  {fieldErrors.userName}
                </p>
              )}
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
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                autoComplete="new-password"
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
              {isSubmitting ? 'Criando conta...' : 'Criar conta'}
            </Button>
            <p className="text-sm text-[#a1a1aa]">
              Já tem conta?{' '}
              <Link href="/login" className="text-[#34d399] underline underline-offset-2">
                Entrar
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
      <ComplianceBanner className="max-w-lg" />
    </main>
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
