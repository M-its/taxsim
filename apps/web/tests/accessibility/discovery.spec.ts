import { expect, test } from '@playwright/test'

test('public discovery is canonical, scoped to the landing and non-installable', async ({
  page,
  request,
}) => {
  await page.route('**/auth/refresh', (route) => route.fulfill({ status: 401, json: {} }))
  await page.goto('/')
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#09090b')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://taxsim-web.duckdns.org',
  )
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    'href',
    '/manifest.webmanifest',
  )
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
    'href',
    '/brand/apple-touch-icon.png',
  )
  const schema = JSON.parse(await page.locator('script[type="application/ld+json"]').innerText())
  expect(schema).toMatchObject({
    '@type': 'WebApplication',
    name: 'TaxSim',
    url: 'https://taxsim-web.duckdns.org',
    applicationCategory: 'BusinessApplication',
    inLanguage: 'pt-BR',
    author: { name: 'Mitsrael' },
  })
  expect(schema).not.toHaveProperty('offers')
  expect(schema).not.toHaveProperty('aggregateRating')
  const ogUrl = await page.locator('meta[property="og:image"]').getAttribute('content')
  // CI controls the runner, not whether the Web server uses next dev or next build.
  // Next uses localhost:PORT for file-based social images in development, even
  // when the browser reaches the server through a different Compose alias.
  if (process.env.TAXSIM_PRODUCTION_BUILD === '1')
    expect(new URL(ogUrl!).origin).toBe('https://taxsim-web.duckdns.org')
  else
    expect(new URL(ogUrl!).origin).toBe(
      new URL(process.env.TAXSIM_DEV_METADATA_ORIGIN ?? 'http://localhost:3000').origin,
    )
  const og = await request.get(new URL(ogUrl!).pathname)
  expect(og.ok()).toBe(true)
  expect(og.headers()['content-type']).toContain('image/png')
  const ogBytes = await og.body()
  expect(ogBytes.readUInt32BE(16)).toBe(1200)
  expect(ogBytes.readUInt32BE(20)).toBe(630)

  const localRobots = await request.get('/robots.txt')
  expect(await localRobots.text()).toContain('Disallow: /')
  expect(await localRobots.text()).not.toContain('Sitemap:')
  const localSitemap = await request.get('/sitemap.xml')
  expect(await localSitemap.text()).not.toContain('<loc>')
  // Probe the production metadata branch through the local server, not the deployed site.
  const headers = { 'x-forwarded-host': 'taxsim-web.duckdns.org' }
  const productionSitemap = await request.get('/sitemap.xml', { headers })
  expect(await productionSitemap.text()).toContain('<loc>https://taxsim-web.duckdns.org/</loc>')
  expect((await productionSitemap.text()).match(/<loc>/g)).toHaveLength(1)
  const productionRobots = await request.get('/robots.txt', { headers })
  expect(await productionRobots.text()).toContain(
    'Sitemap: https://taxsim-web.duckdns.org/sitemap.xml',
  )
  for (const path of [
    '/login',
    '/register',
    '/dashboard',
    '/products',
    '/customers',
    '/sales',
    '/settings',
    '/simulation',
  ])
    expect(await productionRobots.text()).toContain(`Disallow: ${path}`)
  const manifestResponse = await request.get('/manifest.webmanifest')
  const manifest = await manifestResponse.json()
  expect(manifest).toMatchObject({
    name: 'TaxSim',
    short_name: 'TaxSim',
    display: 'browser',
    lang: 'pt-BR',
    theme_color: '#09090b',
    background_color: '#09090b',
  })
  for (const icon of [
    ...manifest.icons,
    { src: '/brand/apple-touch-icon.png', sizes: '180x180' },
    { src: '/brand/icon-32.png', sizes: '32x32' },
  ]) {
    const response = await request.get(icon.src)
    expect(response.ok()).toBe(true)
    const bytes = await response.body()
    const [width, height] = icon.sizes.split('x').map(Number)
    expect(bytes.readUInt32BE(16)).toBe(width)
    expect(bytes.readUInt32BE(20)).toBe(height)
  }
  const favicon = await request.get('/favicon.ico')
  expect(favicon.ok()).toBe(true)
  const ico = await favicon.body()
  expect(ico.readUInt16LE(2)).toBe(1)
  expect(ico.readUInt16LE(4)).toBe(3)
  await page.goto('/login')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
  expect(
    await page
      .locator(
        'meta[property="og:image"],meta[name="twitter:image"],link[rel="canonical"],script[type="application/ld+json"]',
      )
      .count(),
  ).toBe(0)
  const dashboardResponse = await request.get('/dashboard', { headers })
  const dashboard = await dashboardResponse.text()
  expect(dashboard).toContain('noindex')
  expect(dashboard).not.toContain('application/ld+json')
  expect(dashboard).not.toContain('property="og:image"')
  expect(dashboard).not.toContain('rel="canonical"')
  const serviceWorkerRegistrations = await page.evaluate(async () => {
    // HTTP Compose aliases are not secure contexts, so this API is unavailable.
    if (!('serviceWorker' in navigator)) return null
    return (await navigator.serviceWorker.getRegistrations()).length
  })
  if (process.env.TAXSIM_PRODUCTION_BUILD === '1') expect(serviceWorkerRegistrations).toBe(0)
  else expect([null, 0]).toContain(serviceWorkerRegistrations)
})
