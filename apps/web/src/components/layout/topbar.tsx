"use client"

import { usePathname } from "next/navigation"
import { Search, Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

function breadcrumbLabel(path: string): string {
  const map: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/produtos": "Produtos",
    "/clientes": "Clientes",
    "/vendas": "Vendas",
    "/simulacao": "Simulação",
  }
  return map[path] ?? "Taxsim"
}

interface TopbarProps {
  className?: string
}

export function Topbar({ className }: TopbarProps) {
  const pathname = usePathname()
  const label = breadcrumbLabel(pathname)

  return (
    <header
      className={cn(
        "fixed left-0 right-0 top-0 z-30 flex h-14 items-center justify-between border-b border-[#27272a] bg-[#09090b]/95 px-6 backdrop-blur",
        className
      )}
    >
      <div className="flex items-center ml-6 gap-2 text-sm text-[#a1a1aa]">
        <span>TaxSim</span>
        <span>/</span>
        <span className="text-[#fafafa]">{label}</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden w-64 sm:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a1a1aa]" />
          <Input
            type="text"
            placeholder="Buscar..."
            className="h-9 rounded-none border-[#27272a] bg-[#18181b] pl-8 text-sm text-[#fafafa] placeholder:text-[#71717a] focus-visible:border-[#34d399] focus-visible:ring-[#34d399]/20"
          />
        </div>

        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-none border border-[#27272a] bg-[#18181b] text-[#a1a1aa] transition-colors hover:border-[#3f3f46] hover:text-[#fafafa]"
          aria-label="Notificações"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-2 w-2 bg-[#34d399]" />
        </button>

        <button
          type="button"
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-none border border-[#27272a] bg-[#18181b] p-0 text-[#fafafa] transition-colors hover:bg-[#27272a]"
          aria-label="Usuário"
        >
          <Avatar className="h-full w-full rounded-none">
            <AvatarFallback className="rounded-none bg-transparent text-xs font-medium text-[#fafafa]">
              JS
            </AvatarFallback>
          </Avatar>
        </button>
      </div>
    </header>
  )
}
