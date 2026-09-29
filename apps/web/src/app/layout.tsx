import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { MotionPreferences } from '@/components/accessibility/motion-preferences'
import 'driver.js/dist/driver.css'
import './globals.css'

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
})

const productionUrl = new URL('https://taxsim-web.duckdns.org')

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers()
  const forwardedHost = requestHeaders.get('x-forwarded-host')
  const requestHost = (forwardedHost ?? requestHeaders.get('host') ?? '')
    .split(',')[0]
    .trim()
    .split(':')[0]
    .toLowerCase()
  const isProductionHost = requestHost === productionUrl.hostname

  return {
    metadataBase: productionUrl,
    applicationName: 'TaxSim',
    authors: [{ name: 'Mitsrael' }],
    creator: 'Mitsrael',
    publisher: 'TaxSim',
    title: {
      default: 'TaxSim — Simulação da Reforma Tributária',
      template: '%s | TaxSim',
    },
    description: 'Compare o modelo tributário atual com o IVA Dual (IBS/CBS/IS).',
    robots: isProductionHost
      ? { index: true, follow: true }
      : {
          index: false,
          follow: false,
          noarchive: true,
          nosnippet: true,
        },
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#09090b] text-[#fafafa]">
        <MotionPreferences>{children}</MotionPreferences>
      </body>
    </html>
  )
}
