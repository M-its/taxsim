"use client"

import { useEffect, useRef, useState } from "react"
import { Building2, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/components/auth/auth-provider"
import { updateCompany, type UpdateCompanyInput, getMunicipalities, type Municipality } from "@/lib/api"
import { ApiError } from "@/lib/api"

interface CompanyFormData {
  name: string
  document: string
  taxRegime: "SIMPLES_NACIONAL" | "LUCRO_PRESUMIDO" | "LUCRO_REAL"
  municipioCode: string
  uf: string
}

const TAX_REGIMES: { value: CompanyFormData["taxRegime"]; label: string }[] = [
  { value: "SIMPLES_NACIONAL", label: "Simples Nacional" },
  { value: "LUCRO_PRESUMIDO", label: "Lucro Presumido" },
  { value: "LUCRO_REAL", label: "Lucro Real" },
]

const UF_OPTIONS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
]

const inputClassName =
  "rounded-none border-[#27272a] bg-[#09090b] text-[#fafafa] placeholder:text-[#71717a] focus-visible:border-[#34d399] focus-visible:ring-[#34d399]/20"

function parseCompanyForm(company: ReturnType<typeof useAuth>['company']): CompanyFormData | null {
  if (!company) return null
  return {
    name: company.name,
    document: company.document,
    taxRegime: company.taxRegime,
    municipioCode: company.municipioCode?.toString() ?? "",
    uf: company.uf ?? "",
  }
}

export default function SettingsPage() {
  const { company, refreshCompany } = useAuth()
  const [form, setForm] = useState<CompanyFormData | null>(parseCompanyForm(company))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [municipios, setMunicipios] = useState<Municipality[]>([])
  const [municipioSearch, setMunicipioSearch] = useState("")
  const [isLoadingMunicipios, setIsLoadingMunicipios] = useState(false)
  const [currentMunicipioName, setCurrentMunicipioName] = useState<string | null>(null)
  const initialUfLoaded = useRef(false)

  useEffect(() => {
    setForm((prev) => {
      const next = parseCompanyForm(company)
      if (!next) return null
      if (!prev || prev.document !== next.document) return next
      return prev
    })
  }, [company])

  useEffect(() => {
    if (!form?.uf) return
    const currentForm = form

    async function loadMunicipios(): Promise<void> {
      setIsLoadingMunicipios(true)
      try {
        const list = await getMunicipalities(currentForm.uf)
        setMunicipios(list)
        const current = list.find((m) => m.code === Number(currentForm.municipioCode))
        setCurrentMunicipioName(current?.name ?? null)
      } catch {
        setMunicipios([])
        setCurrentMunicipioName(null)
      } finally {
        setIsLoadingMunicipios(false)
      }
    }

    if (!initialUfLoaded.current) {
      initialUfLoaded.current = true
      loadMunicipios()
    } else {
      setForm((prev) => (prev ? { ...prev, municipioCode: "" } : null))
      setMunicipioSearch("")
      setCurrentMunicipioName(null)
      loadMunicipios()
    }
    // Only UF should trigger a reload/clear; captured form values are used only for the current lookup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form?.uf])

  function handleChange(field: keyof CompanyFormData, value: string) {
    setForm((prev) => (prev ? { ...prev, [field]: value } : null))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form || !company) return

    setIsSubmitting(true)
    setSuccess(false)
    setError(null)

    try {
      const payload: UpdateCompanyInput = {
        name: form.name,
        taxRegime: form.taxRegime,
        municipioCode: Number(form.municipioCode),
        uf: form.uf,
      }
      await updateCompany(company.id, payload)
      await refreshCompany()
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      let message = "Erro ao atualizar dados. Tente novamente."
      if (err instanceof ApiError) {
        message = err.message || message
      }
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!form) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#fafafa]">Configurações</h1>
        <p className="mt-1 text-sm text-[#a1a1aa]">Dados fiscais da empresa</p>
      </div>

      <Card className="rounded-none border-[#27272a] bg-[#18181b]">
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center bg-[#34d399]/10 text-[#34d399]">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-medium text-[#fafafa]">
              Dados fiscais da empresa
            </CardTitle>
            <CardDescription className="text-xs text-[#a1a1aa]">
              Visualize e ajuste as informações cadastrais
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name" className="text-xs text-[#a1a1aa]">
                  Razão Social
                </Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(event) => handleChange("name", event.target.value)}
                  className={inputClassName}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="document" className="text-xs text-[#a1a1aa]">
                  CNPJ
                </Label>
                <Input
                  id="document"
                  value={form.document}
                  readOnly
                  className={`${inputClassName} cursor-not-allowed opacity-70`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxRegime" className="text-xs text-[#a1a1aa]">
                  Regime Tributário
                </Label>
                <Select
                  value={form.taxRegime}
                  onValueChange={(value) =>
                    handleChange(
                      "taxRegime",
                      (value as CompanyFormData["taxRegime"]) ?? "SIMPLES_NACIONAL"
                    )
                  }
                >
                  <SelectTrigger
                    id="taxRegime"
                    className="w-full rounded-none border-[#27272a] bg-[#09090b] text-[#fafafa] focus:border-[#34d399] focus:ring-[#34d399]/50"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-[#27272a] bg-[#18181b] text-[#fafafa]">
                    {TAX_REGIMES.map((regime) => (
                      <SelectItem
                        key={regime.value}
                        value={regime.value}
                        className="rounded-none text-[#a1a1aa] focus:bg-[#27272a] focus:text-[#fafafa]"
                      >
                        {regime.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="uf" className="text-xs text-[#a1a1aa]">
                  UF
                </Label>
                <Select
                  value={form.uf}
                  onValueChange={(value) => handleChange("uf", value ?? "")}
                >
                  <SelectTrigger
                    id="uf"
                    className="w-full rounded-none border-[#27272a] bg-[#09090b] text-[#fafafa] focus:border-[#34d399] focus:ring-[#34d399]/50"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-[#27272a] bg-[#18181b] text-[#fafafa]">
                    {UF_OPTIONS.map((uf) => (
                      <SelectItem
                        key={uf}
                        value={uf}
                        className="rounded-none text-[#a1a1aa] focus:bg-[#27272a] focus:text-[#fafafa]"
                      >
                        {uf}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="municipioCode" className="text-xs text-[#a1a1aa]">
                  Município (IBGE)
                </Label>
                {isLoadingMunicipios ? (
                  <p className="text-sm text-[#71717a]">Carregando municípios...</p>
                ) : form.municipioCode ? (
                  <div className="border border-[#27272a] bg-[#09090b] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-[#fafafa]">
                          {currentMunicipioName ?? `Código ${form.municipioCode}`}
                        </p>
                        {currentMunicipioName && (
                          <p className="text-xs text-[#71717a]">IBGE {form.municipioCode}</p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          handleChange("municipioCode", "")
                          setMunicipioSearch("")
                          setCurrentMunicipioName(null)
                        }}
                        className="h-auto rounded-none px-2 py-1 text-xs text-[#a1a1aa] hover:bg-[#27272a] hover:text-[#fafafa]"
                      >
                        Trocar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#71717a]" />
                      <Input
                        id="municipioCode"
                        value={municipioSearch}
                        onChange={(event) => setMunicipioSearch(event.target.value)}
                        placeholder="Buscar município..."
                        disabled={isLoadingMunicipios}
                        className={`${inputClassName} pl-9`}
                      />
                    </div>
                    {municipioSearch.trim() && (
                      <ul className="max-h-48 overflow-auto border border-[#27272a] bg-[#09090b]">
                        {municipios
                          .filter(
                            (municipio) =>
                              municipio.name
                                .toLowerCase()
                                .includes(municipioSearch.toLowerCase()) ||
                              municipio.code.toString().includes(municipioSearch)
                          )
                          .map((municipio) => (
                            <li key={municipio.code}>
                              <button
                                type="button"
                                onClick={() => {
                                  handleChange("municipioCode", String(municipio.code))
                                  setCurrentMunicipioName(municipio.name)
                                  setMunicipioSearch("")
                                }}
                                className="w-full px-3 py-2 text-left transition-colors hover:bg-[#27272a]"
                              >
                                <p className="text-sm text-[#fafafa]">{municipio.name}</p>
                                <p className="text-xs text-[#71717a]">IBGE {municipio.code}</p>
                              </button>
                            </li>
                          ))}
                        {municipios.filter(
                          (municipio) =>
                            municipio.name
                              .toLowerCase()
                              .includes(municipioSearch.toLowerCase()) ||
                            municipio.code.toString().includes(municipioSearch)
                        ).length === 0 && (
                          <li className="px-3 py-2 text-xs text-[#71717a]">
                            Nenhum município encontrado.
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              {success && (
                <span className="text-sm text-[#34d399]">
                  Dados atualizados com sucesso
                </span>
              )}
              {error && (
                <span className="text-sm text-red-400">{error}</span>
              )}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-none border border-transparent bg-[#1a1a1a] px-5 py-2 text-sm font-medium text-[#fafafa] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#1f2a1f] disabled:opacity-60"
              >
                {isSubmitting ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
