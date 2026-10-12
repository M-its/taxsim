import { headers } from 'next/headers'
import { isProductionHost, publicSitemap } from '@/lib/site-metadata'

export const dynamic = 'force-dynamic'

export default async function sitemap() {
  const requestHeaders = await headers()
  return publicSitemap(
    isProductionHost(requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host')),
  )
}
