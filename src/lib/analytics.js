// Pequeno wrapper resiliente para eventos de produto.
// Funciona mesmo sem GA/PostHog/Pixel — em dev apenas loga no console.

const isDev = import.meta?.env?.DEV === true;

export function track(event, props = {}) {
  try {
    // Google Analytics 4 (gtag)
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', event, props);
    }

    // PostHog (se existir)
    if (typeof window !== 'undefined' && window.posthog?.capture) {
      window.posthog.capture(event, props);
    }

    // DataLayer (opcional)
    if (typeof window !== 'undefined' && Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event, ...props });
    }
  } catch { /* no-op */ }

  if (isDev) {
    // Ajuda no debug local
    // eslint-disable-next-line no-console
    console.debug('[track]', event, props);
  }
}

export function identify(userId, traits = {}) {
  try {
    if (typeof window !== 'undefined' && window.posthog?.identify) {
      window.posthog.identify(String(userId), traits);
    }
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('set', { user_id: String(userId), ...traits });
    }
  } catch { /* no-op */ }

  if (isDev) {
    // eslint-disable-next-line no-console
    console.debug('[identify]', userId, traits);
  }
}

export function page(name, props = {}) {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', { page_title: name, ...props });
    }
    if (typeof window !== 'undefined' && window.posthog?.capture) {
      window.posthog.capture('$pageview', { name, ...props });
    }
  } catch { /* no-op */ }

  if (isDev) {
    // eslint-disable-next-line no-console
    console.debug('[page]', name, props);
  }
}
