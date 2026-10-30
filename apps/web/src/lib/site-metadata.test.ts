import { describe, expect, it } from 'vitest'
import {
  applicationSchema,
  isProductionHost,
  publicManifest,
  publicRobots,
  publicSitemap,
  serializeSchema,
} from './site-metadata'

describe('public discovery boundaries', () => {
  it('recognizes only the production authority, including forwarded host and HTTPS port', () => {
    for (const host of [
      'taxsim-web.duckdns.org',
      'TAXSIM-WEB.DUCKDNS.ORG:443',
      ' taxsim-web.duckdns.org, proxy.test',
    ])
      expect(isProductionHost(host)).toBe(true)
    for (const host of [
      null,
      'localhost:3100',
      'preview.test',
      'taxsim-web.duckdns.org.evil.test',
      'taxsim-web.duckdns.org:3100',
    ])
      expect(isProductionHost(host)).toBe(false)
  })

  it('publishes only the canonical landing in production and no preview URLs', () => {
    expect(publicSitemap(true)).toEqual([{ url: 'https://taxsim-web.duckdns.org/' }])
    expect(publicSitemap(false)).toEqual([])
  })

  it('disallows every non-production route and omits its sitemap', () => {
    expect(publicRobots(false)).toEqual({ rules: { userAgent: '*', disallow: '/' } })
  })

  it('keeps authentication and private app paths out of production discovery', () => {
    const robots = publicRobots(true)
    expect(robots.sitemap).toBe('https://taxsim-web.duckdns.org/sitemap.xml')
    expect(robots.rules).toEqual({
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
    })
  })

  it('describes a browser-only dark application, without offline/install capabilities', () => {
    const manifest = publicManifest()
    expect(manifest).toMatchObject({
      name: 'TaxSim',
      short_name: 'TaxSim',
      display: 'browser',
      lang: 'pt-BR',
      start_url: '/',
      scope: '/',
      theme_color: '#09090b',
      background_color: '#09090b',
    })
    expect(manifest.icons?.map((icon) => icon.sizes)).toEqual(['192x192', '512x512'])
    expect(manifest).not.toHaveProperty('shortcuts')
  })

  it('uses factual minimal structured data without offers, ratings or official endorsement', () => {
    expect(applicationSchema).toMatchObject({
      '@type': 'WebApplication',
      applicationCategory: 'BusinessApplication',
      inLanguage: 'pt-BR',
      author: { name: 'Mitsrael' },
    })
    expect(applicationSchema.description).toContain('Sem validade fiscal e sem vínculo')
    expect(applicationSchema).not.toHaveProperty('offers')
    expect(applicationSchema).not.toHaveProperty('aggregateRating')
  })

  it('cannot terminate the structured data script through HTML in a future description', () => {
    const schema = { description: '</script><script>alert(1)</script>' }
    const serialized = serializeSchema(schema)
    expect(serialized).not.toContain('<')
    expect(JSON.parse(serialized)).toEqual(schema)
  })
})
