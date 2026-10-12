import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { MotionPreferences } from '@/components/accessibility/motion-preferences'
import { isProductionHost, productionUrl, themeColor } from '@/lib/site-metadata'
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

export const viewport: Viewport = { themeColor, colorScheme: 'dark' }

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers()
  const forwardedHost = requestHeaders.get('x-forwarded-host')
  const production = isProductionHost(forwardedHost ?? requestHeaders.get('host'))

  return {
    metadataBase: productionUrl,
    applicationName: 'TaxSim',
    authors: [{ name: 'Mitsrael' }],
    creator: 'Mitsrael',
    publisher: 'TaxSim',
    icons: {
      icon: [
        { url: '/brand/icon.svg', type: 'image/svg+xml', sizes: 'any' },
        { url: '/brand/icon-32.png', type: 'image/png', sizes: '32x32' },
      ],
      apple: { url: '/brand/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    },
    title: {
      default: 'TaxSim — Simulação da Reforma Tributária',
      template: '%s | TaxSim',
    },
    description: 'Compare o modelo tributário atual com o IVA Dual (IBS/CBS/IS).',
    robots: production
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
