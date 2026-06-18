"use client"

import { useState } from "react"
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
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Produtos", href: "/produtos", icon: Package },
  { label: "Clientes", href: "/clientes", icon: Users },
  { label: "Vendas", href: "/vendas", icon: Receipt },
  { label: "Simulação", href: "/simulacao", icon: Calculator },
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <aside
      style={{ width: collapsed ? 64 : 256 }}
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-[#27272a] bg-[#18181b]",
        className
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-[#27272a] px-4">
        <div className="flex items-center">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-[#09090b] text-[#34d399]">
            <Calculator className="h-5 w-5" />
          </div>
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ willChange: "transform, opacity" }}
                layout={false}
                className="ml-3 text-sm font-semibold tracking-tight text-[#fafafa]"
              >
                TaxSim
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="flex h-8 w-8 shrink-0 items-center justify-center text-[#a1a1aa] transition-colors hover:bg-[#27272a] hover:text-[#fafafa]"
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
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
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ willChange: "transform, opacity" }}
                        layout={false}
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
          href="/configuracoes"
          className="flex items-center gap-3 rounded-none px-3 py-2 text-sm text-[#a1a1aa] transition-colors hover:bg-[#27272a] hover:text-[#fafafa]"
        >
          <Settings className="h-[18px] w-[18px] shrink-0" />
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ willChange: "transform, opacity" }}
                layout={false}
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
