
import type { Metadata } from "next"
import { AuthProvider } from "@/components/auth/auth-provider"
import { DashboardShell } from "@/components/layout/dashboard-shell"

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <DashboardShell>{children}</DashboardShell>
    </AuthProvider>
  )
}
