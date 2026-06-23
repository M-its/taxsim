"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  Package,
  Users,
  Receipt,
  Calculator,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Produtos", href: "/products", icon: Package },
  { label: "Clientes", href: "/customers", icon: Users },
  { label: "Vendas", href: "/sales", icon: Receipt },
  { label: "Simulação", href: "/simulation", icon: Calculator },
]

interface SidebarProps {
  className?: string
  isOpen?: boolean
  onToggle?: () => void
}

export function Sidebar({ className, isOpen = true, onToggle }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      style={{ width: isOpen ? 256 : 64 }}
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-[#27272a] bg-[#18181b]",
        !isOpen && "hidden",
        "md:flex",
        className
      )}
    >
      <div
        className={cn(
          "flex h-14 shrink-0 items-center border-b border-[#27272a]",
          isOpen ? "justify-between px-4" : "justify-center px-2"
        )}
      >
        {isOpen && (
          <div className="flex items-center">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-[#09090b] text-[#34d399]">
              <Calculator className="h-5 w-5" />
            </div>
            <AnimatePresence initial={false}>
              <motion.span
                key="logo-text"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.2 }}
                style={{ willChange: "transform, opacity" }}
                className="ml-3 text-sm font-semibold tracking-tight text-[#fafafa]"
              >
                TaxSim
              </motion.span>
            </AnimatePresence>
          </div>
        )}

        <button
          type="button"
          onClick={onToggle}
          className="hidden h-8 w-8 shrink-0 items-center justify-center text-[#a1a1aa] transition-colors hover:bg-[#27272a] hover:text-[#fafafa] md:flex"
          aria-label={isOpen ? "Recolher menu" : "Expandir menu"}
        >
          {isOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </button>

        <button
          type="button"
          onClick={onToggle}
          className="flex h-8 w-8 items-center justify-center text-[#a1a1aa] transition-colors hover:bg-[#27272a] hover:text-[#fafafa] md:hidden"
          aria-label="Fechar menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            const Icon = item.icon

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-none px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-[#34d399]/10 text-[#34d399]"
                      : "text-[#a1a1aa] hover:bg-[#27272a] hover:text-[#fafafa]"
                  )}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.span
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.2 }}
                        style={{ willChange: "transform, opacity" }}
                        className="truncate"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-[#27272a] p-2">
        <Link
          href="settings"
          className={cn(
            "flex items-center gap-3 rounded-none px-3 py-2 text-sm text-[#a1a1aa] transition-colors hover:bg-[#27272a] hover:text-[#fafafa]",
            !isOpen && "justify-center"
          )}
        >
          <Settings className="h-[18px] w-[18px] shrink-0" />
          <AnimatePresence initial={false}>
            {isOpen && (
              <motion.span
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.2 }}
                style={{ willChange: "transform, opacity" }}
              >
                Configurações
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>
    </aside>
  )
}
