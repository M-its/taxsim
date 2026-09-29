import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Configurações',
}

export default function SettingsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children
}
