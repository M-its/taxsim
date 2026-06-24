"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Search, Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/components/auth/auth-provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function breadcrumbLabel(path: string): string {
  const map: Record<string, string> = {
    "/customers": "Clientes",
    "/dashboard": "Dashboard",
    "/products": "Produtos",
    "/sales": "Vendas",
    "/settings": "Configurações",
    "/simulation": "Simulação"
  }
  return map[path] ?? "Taxsim"
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ""
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ""
  return (first + last).toUpperCase() || "U"
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
  const { user, company, logout } = useAuth()

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

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="p-2 hover:bg-zinc-800 transition-colors cursor-pointer rounded-none"
                aria-label="Abrir menu do usuário"
              >
                <Avatar className="h-5 w-5 rounded-none">
                  <AvatarFallback className="rounded-none bg-transparent text-[10px] font-medium text-[#fafafa]">
                    {user ? initials(user.name) : "U"}
                  </AvatarFallback>
                </Avatar>
              </button>
            }
          />

          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="rounded-none border border-[#27272a] bg-[#18181b] text-[#fafafa] min-w-[220px]"
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="rounded-none px-3 py-1.5 text-sm font-medium text-[#fafafa]">
                {user?.name ?? "Usuário"}
              </DropdownMenuLabel>
              <DropdownMenuLabel className="rounded-none px-3 py-0 text-xs font-normal text-[#a1a1aa]">
                {user?.email ?? "—"}
              </DropdownMenuLabel>
              <DropdownMenuLabel className="rounded-none px-3 py-1.5 text-xs text-[#a1a1aa]">
                {company?.name ?? "—"}
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-[#27272a]" />
            <DropdownMenuItem
              render={
                <Link
                  href="/settings"
                  className="rounded-none px-3 py-1.5 text-sm text-[#a1a1aa] focus:bg-[#27272a] focus:text-[#fafafa]"
                >
                  Configurações
                </Link>
              }
            />

            <DropdownMenuSeparator className="bg-[#27272a]" />

            <DropdownMenuItem
              render={
                <button
                  type="button"
                  onClick={logout}
                  className="w-full rounded-none px-3 py-1.5 text-left text-sm text-red-500 focus:bg-red-500/10 focus:text-red-500"
                >
                  Sair
                </button>
              }
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
