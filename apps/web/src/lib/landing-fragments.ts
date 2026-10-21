export const LANDING_FRAGMENTS = ['', '#conteudo', '#produto', '#arquitetura', '#qualidade']

export interface LandingFragmentState {
  pending: string | null
}

declare global {
  interface Window {
    __taxsimLandingFragment?: LandingFragmentState
  }
}

export function landingFragmentHref(value: string, origin: string): string | null {
  try {
    const url = new URL(value, origin)
    return url.origin === origin && url.pathname === '/' && LANDING_FRAGMENTS.includes(url.hash)
      ? `${url.pathname}${url.search}${url.hash}`
      : null
  } catch {
    return null
  }
}

export function takeLandingFragment(state: LandingFragmentState | undefined, origin: string) {
  if (!state?.pending) return null
  const href = landingFragmentHref(state.pending, origin)
  state.pending = null
  return href
}

// Runs before hydration, so a native fragment event is not lost when Next's
// initial HistoryUpdater replaces the URL using an older canonicalUrl. Keep
// only one pending destination; do not patch history or persist across documents.
export const LANDING_FRAGMENT_CAPTURE = `(() => {
  if (window.__taxsimLandingFragment) return;
  const state = { pending: null };
  window.__taxsimLandingFragment = state;
  const allowed = ${JSON.stringify(LANDING_FRAGMENTS)};
  const capture = (value) => {
    try {
      const url = new URL(value, location.origin);
      state.pending = url.origin === location.origin && url.pathname === '/' && allowed.includes(url.hash)
        ? url.pathname + url.search + url.hash : null;
    } catch { state.pending = null; }
  };
  if (location.hash) capture(location.href);
  addEventListener('hashchange', (event) => capture(event.newURL));
})();`
