'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { takeLandingFragment } from '@/lib/landing-fragments'

export function LandingFragmentSync() {
  const router = useRouter()

  useEffect(() => {
    const restore = () => {
      if (window.location.pathname !== '/') return
      const href = takeLandingFragment(window.__taxsimLandingFragment, window.location.origin)
      if (href) router.replace(href, { scroll: true })
    }
    window.addEventListener('hashchange', restore)
    restore()
    return () => window.removeEventListener('hashchange', restore)
  }, [router])

  return null
}
