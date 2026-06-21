"use client"

import { usePathname } from "next/navigation"
import { Search, Menu } from "lucide-react"
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
  isSidebarOpen?: boolean
  onToggleSidebar?: () => void
}

export function Topbar({
  className,
  isSidebarOpen = true,
  onToggleSidebar,
}: TopbarProps) {
  const pathname = usePathname()
  const label = breadcrumbLabel(pathname)

  return (
    <header
      className={cn(
        "fixed left-0 right-0 top-0 z-30 flex h-14 items-center justify-between border-b border-[#27272a] bg-[#09090b]/95 px-6 backdrop-blur",
        isSidebarOpen ? "md:pl-64" : "md:pl-16",
        className
      )}
    >
      <div className="flex items-center gap-2 md:ml-6">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 hover:bg-zinc-800 transition-colors cursor-pointer rounded-none md:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5 text-[#a1a1aa]" />
        </button>

        <div className="flex items-center gap-2 text-sm text-[#a1a1aa]">
          <span>TaxSim</span>
          <span>/</span>
          <span className="text-[#fafafa]">{label}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden w-64 sm:block">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
          />
          <Input
            type="text"
            placeholder="Buscar..."
            className="h-9 rounded-none border-[#27272a] bg-[#18181b] pl-8 text-sm text-[#fafafa] placeholder:text-[#71717a] focus-visible:border-[#34d399] focus-visible:ring-[#34d399]/20"
          />
        </div>

        <button
          type="button"
          className="p-2 hover:bg-zinc-800 transition-colors cursor-pointer rounded-none"
          aria-label="Usuário"
        >
          <Avatar className="h-5 w-5 rounded-none">
            <AvatarFallback className="rounded-none bg-transparent text-[10px] font-medium text-[#fafafa]">
              JS
            </AvatarFallback>
          </Avatar>
        </button>
      </div>
    </header>
  )
}
