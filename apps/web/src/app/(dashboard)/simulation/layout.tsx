import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Simulação',
}

export default function SimulationLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children
}
