'use client'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { RequireAuth } from '@/components/auth/require-auth'
import { TaxSimTour } from '@/components/onboarding/taxsim-tour'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  useEffect(() => {
    const update = () => setIsSidebarOpen(window.innerWidth >= 768)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev)

  return (
    <RequireAuth>
      <div className="min-h-screen bg-[#09090b]">
        <Topbar isSidebarOpen={isSidebarOpen} onToggleSidebar={toggleSidebar} />
        <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
        <main className={cn('min-h-screen pt-14', isSidebarOpen ? 'md:pl-64' : 'md:pl-16')}>
          <div className="mx-auto max-w-7xl p-6">{children}</div>
        </main>
        <TaxSimTour />
      </div>
    </RequireAuth>
  )
}
