"use client"

import { useState } from "react"
import { Building2 } from "lucide-react"
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
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
]

const inputClassName =
  "rounded-none border-[#27272a] bg-[#09090b] text-[#fafafa] placeholder:text-[#71717a] focus-visible:border-[#34d399] focus-visible:ring-[#34d399]/20"

export default function SettingsPage() {
  const [form, setForm] = useState<CompanyFormData>({
    name: "Acme Ltda",
    document: "12.345.678/0001-95",
    taxRegime: "SIMPLES_NACIONAL",
    municipioCode: "4314902",
    uf: "RS",
  })

  const [saved, setSaved] = useState(false)

  function handleChange(field: keyof CompanyFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
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
                  Código do Município (IBGE)
                </Label>
                <Input
                  id="municipioCode"
                  value={form.municipioCode}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  onChange={(event) =>
                    handleChange("municipioCode", event.target.value.replace(/\D/g, ""))
                  }
                  className={inputClassName}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              {saved && (
                <span className="text-sm text-[#34d399]">Alterações salvas</span>
              )}
              <Button
                type="submit"
                className="rounded-none border border-transparent bg-[#1a1a1a] px-5 py-2 text-sm font-medium text-[#fafafa] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#1f2a1f]"
              >
                Salvar Alterações
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
