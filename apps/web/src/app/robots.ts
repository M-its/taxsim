import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const productionUrl = 'https://taxsim-web.duckdns.org'

  return {
    host: productionUrl,
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
