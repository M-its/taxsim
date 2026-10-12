import { headers } from 'next/headers'
import { isProductionHost, publicRobots } from '@/lib/site-metadata'

export const dynamic = 'force-dynamic'

export default async function robots() {
  const requestHeaders = await headers()
  return publicRobots(
    isProductionHost(requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host')),
  )
}
