import type { Metadata } from 'next'
import { LandingPage } from '@/components/landing/landing-page'
import {
  applicationSchema,
  landingDescription as description,
  landingTitle as title,
  serializeSchema,
} from '@/lib/site-metadata'

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
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeSchema(applicationSchema) }}
      />
      <LandingPage />
    </>
  )
}
