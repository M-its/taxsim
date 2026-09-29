import type { Metadata } from 'next'
import { LandingPage } from '@/components/landing/landing-page'

const title = 'TaxSim — engenharia fiscal como demonstração técnica'
const description =
  'Portfólio full-stack de um SaaS fiscal multi-tenant que compara o modelo atual ao IVA Dual com segurança, acessibilidade e integração à calculadora pública da RFB.'

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
