import type { MetadataRoute } from 'next'

export const productionUrl = new URL('https://taxsim-web.duckdns.org')
export const landingTitle = 'TaxSim — do NCM à comparação tributária'
export const landingDescription =
  'Compare o modelo tributário atual com o IVA Dual em uma demonstração técnica de SaaS fiscal multi-tenant. Explore produto, arquitetura, segurança e acessibilidade.'
export const themeColor = '#09090b'

export function isProductionHost(host: string | null): boolean {
  const authority = (host ?? '').split(',')[0].trim().toLowerCase()
  return authority === productionUrl.hostname || authority === `${productionUrl.hostname}:443`
}

export function publicSitemap(production: boolean): MetadataRoute.Sitemap {
  return production ? [{ url: productionUrl.href }] : []
}

export function publicRobots(production: boolean): MetadataRoute.Robots {
  if (!production) return { rules: { userAgent: '*', disallow: '/' } }
  return {
    host: productionUrl.origin,
    sitemap: `${productionUrl.origin}/sitemap.xml`,
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/login',
        '/register',
        '/customers',
        '/dashboard',
        '/products',
        '/sales',
        '/settings',
        '/simulation',
      ],
    },
  }
}

export function publicManifest(): MetadataRoute.Manifest {
  return {
    name: 'TaxSim',
    short_name: 'TaxSim',
    description: 'Demonstração técnica de comparação tributária, sem validade fiscal.',
    lang: 'pt-BR',
    start_url: '/',
    scope: '/',
    display: 'browser',
    theme_color: themeColor,
    background_color: themeColor,
    icons: [192, 512].map((size) => ({
      src: `/brand/icon-${size}.png`,
      sizes: `${size}x${size}`,
      type: 'image/png',
      purpose: 'any',
    })),
  }
}

export const applicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'TaxSim',
  url: productionUrl.origin,
  description:
    'Demonstração técnica de comparação tributária. Sem validade fiscal e sem vínculo com a Receita Federal.',
  applicationCategory: 'BusinessApplication',
  inLanguage: 'pt-BR',
  author: { '@type': 'Person', name: 'Mitsrael' },
}

export function serializeSchema(schema: unknown): string {
  return JSON.stringify(schema).replace(/</g, '\\u003c')
}
