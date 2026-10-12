import type { Metadata } from 'next'
import { LandingPage } from '@/components/landing/landing-page'

const title = 'TaxSim — do NCM à comparação tributária'
const description =
  'Compare o modelo tributário atual com o IVA Dual em uma demonstração técnica de SaaS fiscal multi-tenant. Explore produto, arquitetura, segurança e acessibilidade.'

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: '/',
    siteName: 'TaxSim',
    title,
    description,
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
}

export default function Home() {
  return <LandingPage />
}
