'use client'
import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { RequireAuth } from '@/components/auth/require-auth'
import { TaxSimTour } from '@/components/onboarding/taxsim-tour'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const sidebarRef = useRef<HTMLElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const backgroundRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)')
    const update = (mobile: boolean) => {
      setIsMobile(mobile)
      setIsSidebarOpen(!mobile)
    }
    update(media.matches)
    const handleChange = (event: MediaQueryListEvent) => update(event.matches)
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev)

  useEffect(() => {
    if (!isMobile || !isSidebarOpen) return

    const sidebar = sidebarRef.current
    const background = backgroundRef.current
    if (!sidebar || !background) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    background.setAttribute('inert', '')
    background.setAttribute('aria-hidden', 'true')

    const focusableSelector =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    const focusInitialControl = () =>
      (sidebar.querySelector('[data-drawer-initial-focus]') as HTMLElement | null)?.focus()
    requestAnimationFrame(focusInitialControl)

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        setIsSidebarOpen(false)
        return
      }

      if (event.key !== 'Tab') return
      const controls = Array.from(
        sidebar!.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter((control) => control.getClientRects().length > 0)
      if (controls.length === 0) {
        event.preventDefault()
        return
      }
      const first = controls[0]
      const last = controls[controls.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      background.removeAttribute('inert')
      background.removeAttribute('aria-hidden')
      requestAnimationFrame(() => menuButtonRef.current?.focus())
    }
  }, [isMobile, isSidebarOpen])

  return (
    <RequireAuth>
      <div className="min-h-screen bg-[#09090b]">
        <div ref={backgroundRef}>
          <a
            href="#main-content"
            className="fixed left-4 top-4 z-[100] -translate-y-24 bg-[#34d399] px-4 py-2 font-medium text-[#09090b] shadow-lg transition-transform focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#09090b]"
          >
            Pular para o conteúdo
          </a>
          <Topbar
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={toggleSidebar}
            menuButtonRef={menuButtonRef}
          />
          <main
            id="main-content"
            tabIndex={-1}
            className={cn(
              'min-h-screen pt-14 outline-none',
              isSidebarOpen ? 'md:pl-64' : 'md:pl-16',
            )}
          >
            <div className="mx-auto max-w-7xl p-6">{children}</div>
          </main>
        </div>
        {isMobile && isSidebarOpen && (
          <div
            aria-hidden="true"
            className="fixed inset-0 z-[35] bg-black/70 backdrop-blur-[1px]"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        <Sidebar
          containerRef={sidebarRef}
          isOpen={isSidebarOpen}
          isMobile={isMobile}
          onToggle={toggleSidebar}
          onNavigate={() => {
            if (isMobile) setIsSidebarOpen(false)
          }}
        />
        <TaxSimTour />
      </div>
    </RequireAuth>
  )
}
